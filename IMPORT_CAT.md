# Import Category Feature - Investigation & Analysis

## Overview

The import category feature allows users to import existing `.comapeocat` files back into the spreadsheet format. This reverse-engineering process extracts metadata, presets, fields, icons, and translations from the packaged configuration file.

## Current Process Flow

```
User Upload (.comapeocat file)
    ↓
extractTarFile() - Extract archive to temp folder
    ↓
parseExtractedFiles() - Parse JSON files
    ↓
processIconSpriteBlob() - Extract individual SVG icons
    ↓
applyConfigurationToSpreadsheet() - Write to sheets
    ├── applyMetadata()
    ├── applyCategories()
    ├── applyFields()
    └── applyTranslations()
    ↓
addAllDropdowns() - Add data validation
    ↓
Clean up temp folder
```

## Critical Issues Identified

### 1. Icon URLs Not Persisting ⚠️

**Problem**: Icons are extracted from the sprite to a temporary folder, but the temp folder is deleted after import, breaking all icon URLs.

**Current Behavior**:
- `parseIconSprite.ts:240` creates icons in temp folder: `tempFolder/icons_output/icons/{name}.svg`
- URLs are `https://drive.google.com/file/d/TEMP_ID/view`
- `importCategory.ts:116-122` deletes temp folder after import
- Result: Broken icon URLs in Categories sheet column B

**Root Cause**:
```typescript
// parseIconSprite.ts:20
const iconsOutputFolder = tempFolder.createFolder("icons_output");
// ↑ Icons saved to TEMPORARY folder

// importCategory.ts:116
if (extractionResult.tempFolder) {
  extractionResult.tempFolder.setTrashed(true); // ← Deletes icons!
}
```

**Expected Behavior**:
- Icons should be saved to permanent config folder structure
- Structure: `{spreadsheet-name}/icons/{icon-name}.svg`
- URLs should persist after import completion

**Fix Required**:
1. Create permanent icons folder in config directory (similar to `icons.ts:23-30`)
2. Copy extracted icons to permanent location
3. Update icon URLs before applying to spreadsheet
4. Only delete temp extraction files, not icon files

---

### 2. Translations Not Appearing ⚠️

**Problem**: Translation data has structural mismatch between import format and spreadsheet format.

**Current Behavior**:
- Import receives flat structure: `messages[lang]["presets.{id}.name"]`
- Code expects nested: `messages[lang].presets.presets[id].name`
- Result: Empty translation sheets

**Data Structure Comparison**:

**Received from translations.json** (flat):
```json
{
  "es": {
    "presets.water.name": {
      "message": "Agua",
      "description": "Name for preset 'water'"
    },
    "presets.fields.waterType.label": {
      "message": "Tipo de agua",
      "description": "Label for field 'waterType'"
    }
  }
}
```

**Expected by applyTranslations.ts** (nested):
```json
{
  "es": {
    "presets": {
      "presets": {
        "water": {
          "name": "Agua"
        }
      },
      "fields": {
        "waterType": {
          "label": "Tipo de agua"
        }
      }
    }
  }
}
```

**Root Cause**:
```typescript
// applyTranslations.ts:89-90
const langMessages = messages[langCode];
if (langMessages?.presets?.presets?.[preset.id]?.name) {
  // ↑ Expects nested structure but receives flat
```

**Export Format** (processTranslations.ts creates flat):
```typescript
// processTranslations.ts:97-100
messages[lang][`${messageType}.${key}.name`] = {
  message: translation[langIndex + 1],
  description: `Name for preset '${key}'`
};
// Creates: "presets.water.name" (flat key)
```

**Fix Required**:
1. Add transformation function in `parseFiles.ts` to restructure translations
2. Convert flat keys to nested objects before passing to `applyTranslations()`
3. Handle all translation types: presets.name, fields.label, fields.helperText, fields.options

---

### 3. Details Column Dropdown Format ⚠️

**Problem**: Details column (Categories sheet, column C) should support multiple selections with comma separation.

**Current Behavior**:
- `addDetailsDropdown.ts:53-58` creates single-select dropdown
- Multi-select API not yet available in Apps Script
- Fallback uses comma separation but lacks proper validation

**Current Implementation**:
```typescript
// addDetailsDropdown.ts:53-56
const rule = SpreadsheetApp.newDataValidation()
  .requireValueInRange(valueRange, true)
  .setAllowInvalid(true)
  // .setAllowMultipleSelections(true) ← Commented out, not supported
  .build();
```

**Expected Behavior**:
- Dropdown should show all field labels from Details sheet
- Allow selecting multiple values
- Display as comma-separated list
- Validate each value against Details sheet

**Fix Required**:
1. Verify dropdown source range is correct (Details sheet column A)
2. Ensure `setAllowInvalid(true)` allows comma-separated values
3. Add validation in `handleMultiSelectEdit` trigger
4. Consider formatting cells with comma separation guide

---

## Additional Issues Found

### 4. Missing Validation After Import

**Problem**: No data validation or linting after import completes.

**Current Behavior**:
- Import applies data without validation
- May contain malformed field types, missing required fields
- No error highlighting

**Fix Required**:
- Add optional validation step after import
- Run lint checks on imported data
- Highlight any issues for user review

---

### 5. Icon Column Format Not Standardized

**Problem**: Icon URLs in Categories sheet may not be in expected format.

**Current Behavior**:
- `applyCategories.ts:38` expects `iconMap[icon.name]` to contain URL
- But URLs may be temp folder links (see Issue #1)
- No fallback if icon not found

**Fix Required**:
- Standardize icon URL format
- Add placeholder for missing icons
- Validate icon URLs are accessible

---

### 6. Field Options Not Properly Reconstructed

**Problem**: Field options may lose structure during import.

**Current Behavior**:
```typescript
// parseFiles.ts:103-109
options = Object.entries(field.options).map(([key, value]) => ({
  label: typeof value === 'string' ? value : key,
  value: key,
}));
```

**Potential Issues**:
- Assumes options are object with key-value pairs
- May not handle array format
- Value slugification may differ from export

**Fix Required**:
- Verify options format matches export
- Test with both object and array formats
- Ensure value slugification is consistent

---

## Proposed Fixes

### Priority 1A: Icon Extraction from .mapeosettings (Critical)

**File**: `src/importCategory/extractTarFile.ts`

**Problem**: When .mapeosettings files are parsed as JSON (lines 46-92), icon data is ignored, resulting in no icons during import.

**Changes**:
```typescript
// Added helper function to create sprite from icon array
function createIconSprite(icons: any[]): string {
  let sprite = '<svg xmlns="http://www.w3.org/2000/svg">\n';
  for (const icon of icons) {
    let svgContent = icon.svg;
    const svgMatch = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    if (svgMatch) svgContent = svgMatch[1];
    sprite += `  <symbol id="${icon.name}">\n    ${svgContent.trim()}\n  </symbol>\n`;
  }
  sprite += "</svg>";
  return sprite;
}

// Added icon handling in JSON extraction (after translations)
if (jsonData.icons) {
  console.log("Creating icons.svg from embedded data...");
  let iconsSvgContent = "";

  if (typeof jsonData.icons === "string") {
    iconsSvgContent = jsonData.icons;
  } else if (jsonData.icons.svg) {
    iconsSvgContent = jsonData.icons.svg;
  } else if (Array.isArray(jsonData.icons)) {
    iconsSvgContent = createIconSprite(jsonData.icons);
  }

  if (iconsSvgContent) {
    const iconsSvgBlob = Utilities.newBlob(
      iconsSvgContent,
      "image/svg+xml",
      "icons.svg",
    );
    extractFolder.createFile(iconsSvgBlob);
    extractedFiles.push(iconsSvgBlob);
  }
}
```

### Priority 1B: Icon Blob Handling (Critical)

**File**: `src/importCategory/parseIconSprite.ts`

**Problem**: icons.svg blob needs to be saved to the correct temp folder before processing.

**Changes**:
```typescript
// Updated function signature to accept blob
function processIconSpriteBlob(
  tempFolder: GoogleAppsScript.Drive.Folder,
  iconsSvgBlob?: GoogleAppsScript.Base.Blob, // ← Added parameter
): { name: string; svg: string; id: string }[] {

  // Save blob to iconsSvgFolder before processing
  if (iconsSvgBlob) {
    console.log("Saving provided icons.svg blob to temp folder");
    iconsSvgFolder.createFile(iconsSvgBlob);
  }

  // ... rest of function
}
```

**File**: `src/importCategory/parseFiles.ts`

**Changes**:
```typescript
// Pass the blob to processIconSpriteBlob
const extractedIcons = processIconSpriteBlob(
  tempFolder,
  configData.iconsSvgFile, // ← Pass the blob
);
```

### Priority 1C: Icon Persistence (Critical)

**File**: `src/importCategory/parseIconSprite.ts`

**Changes**:
```typescript
function processIconSpriteBlob(
  tempFolder: GoogleAppsScript.Drive.Folder,
): { name: string; svg: string; id: string }[] {
  // Get permanent config folder
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const parentFolder = DriveApp.getFileById(spreadsheet.getId())
    .getParents()
    .next();
  const configFolderName = slugify(spreadsheet.getName());

  let configFolder: GoogleAppsScript.Drive.Folder;
  const configFolders = parentFolder.getFoldersByName(configFolderName);
  if (configFolders.hasNext()) {
    configFolder = configFolders.next();
  } else {
    configFolder = parentFolder.createFolder(configFolderName);
  }

  // Create permanent icons folder
  let iconsFolder: GoogleAppsScript.Drive.Folder;
  const iconsFolders = configFolder.getFoldersByName("icons");
  if (iconsFolders.hasNext()) {
    iconsFolder = iconsFolders.next();
  } else {
    iconsFolder = configFolder.createFolder("icons");
  }

  // Extract to temp first, then move to permanent location
  const iconsSvgFolder = tempFolder.createFolder("icons_svg_temp");
  const iconsOutputFolder = tempFolder.createFolder("icons_output");

  const icons = deconstructSvgSprite(
    iconsSvgFolder.getId(),
    iconsOutputFolder.getId(),
  );

  // Move icons to permanent folder and update URLs
  const permanentIcons = icons.map(icon => {
    // Find temp file
    const tempFiles = iconsOutputFolder
      .getFoldersByName("icons")
      .next()
      .getFilesByName(`${icon.name}.svg`);

    if (tempFiles.hasNext()) {
      const tempFile = tempFiles.next();

      // Check if file already exists in permanent folder
      const existingFiles = iconsFolder.getFilesByName(`${icon.name}.svg`);
      let permanentFile;

      if (existingFiles.hasNext()) {
        // Update existing file
        permanentFile = existingFiles.next();
        permanentFile.setContent(tempFile.getBlob().getDataAsString());
      } else {
        // Create new file
        permanentFile = iconsFolder.createFile(
          tempFile.getBlob().setName(`${icon.name}.svg`)
        );
      }

      return {
        name: icon.name,
        svg: permanentFile.getUrl(),
        id: icon.id
      };
    }

    return icon;
  });

  return permanentIcons;
}
```

---

### Priority 2: Translation Structure (Critical)

**File**: `src/importCategory/parseFiles.ts`

**Add new function**:
```typescript
/**
 * Restructures flat translation keys into nested object structure
 * Converts "presets.water.name" → presets.presets.water.name
 */
function restructureTranslations(flatMessages: any): any {
  const restructured: any = {};

  for (const lang in flatMessages) {
    restructured[lang] = {
      presets: {
        presets: {},
        fields: {}
      }
    };

    for (const key in flatMessages[lang]) {
      const value = flatMessages[lang][key];
      const parts = key.split('.');

      if (parts[0] === 'presets' && parts.length >= 3) {
        const itemId = parts[1];
        const property = parts[2];

        if (!restructured[lang].presets.presets[itemId]) {
          restructured[lang].presets.presets[itemId] = {};
        }

        if (parts.length === 3) {
          // presets.water.name
          restructured[lang].presets.presets[itemId][property] =
            typeof value === 'object' ? value.message : value;
        } else if (parts[3] === 'options') {
          // presets.water.options.clean.label
          if (!restructured[lang].presets.presets[itemId].options) {
            restructured[lang].presets.presets[itemId].options = {};
          }
          const optionId = parts[4];
          restructured[lang].presets.presets[itemId].options[optionId] = value;
        }
      } else if (parts[0] === 'fields' && parts.length >= 3) {
        const itemId = parts[1];
        const property = parts[2];

        if (!restructured[lang].presets.fields[itemId]) {
          restructured[lang].presets.fields[itemId] = {};
        }

        if (parts.length === 3) {
          // fields.waterType.label
          restructured[lang].presets.fields[itemId][property] =
            typeof value === 'object' ? value.message : value;
        } else if (parts[3] === 'options') {
          // fields.waterType.options.river.label
          if (!restructured[lang].presets.fields[itemId].options) {
            restructured[lang].presets.fields[itemId].options = {};
          }
          const optionId = parts[4];
          restructured[lang].presets.fields[itemId].options[optionId] = value;
        }
      }
    }
  }

  return restructured;
}
```

**Update parseExtractedFiles**:
```typescript
// After parsing translations.json (line 130-136)
else if (fileName === "translations.json") {
  const content = JSON.parse(file.getDataAsString());
  configData.messages = restructureTranslations(content); // ← Add restructuring
  console.log(
    `Parsed translations.json: ${Object.keys(content).length} languages`,
  );
}
```

---

### Priority 3: Dropdown Validation (Medium)

**File**: `src/importCategory/addDetailsDropdown.ts`

**Verify implementation**:
```typescript
// Line 53-58: Current implementation should work
// Just verify the validation trigger is installed

// Add logging to handleMultiSelectEdit to debug
function handleMultiSelectEdit(e: GoogleAppsScript.Events.SheetsOnEdit): void {
  console.log(`Edit detected: sheet=${e.range.getSheet().getName()}, col=${e.range.getColumn()}, value=${e.range.getValue()}`);
  // ... rest of function
}
```

---

## Testing Checklist

After implementing fixes:

- [ ] **Icons Test**
  - [ ] Import .comapeocat file with icons
  - [ ] Verify Categories sheet column B contains valid URLs
  - [ ] Click icon URL and verify file opens
  - [ ] Check icons folder created in config directory
  - [ ] Verify icons persist after temp folder cleanup

- [ ] **Translations Test**
  - [ ] Import .comapeocat file with multiple languages
  - [ ] Verify Category Translations sheet populated
  - [ ] Verify Detail Label Translations sheet populated
  - [ ] Verify Detail Helper Text Translations sheet populated
  - [ ] Check translation values match original file

- [ ] **Dropdown Test**
  - [ ] Verify Details column has dropdown
  - [ ] Test selecting single value
  - [ ] Test entering multiple comma-separated values
  - [ ] Verify invalid values are rejected
  - [ ] Check dropdown source matches Details sheet

- [ ] **End-to-End Test**
  - [ ] Export config from spreadsheet
  - [ ] Import exported file into new spreadsheet
  - [ ] Compare all sheets for data accuracy
  - [ ] Verify no data loss in round-trip

---

## Architecture Improvements

### Future Enhancements

1. **Validation System**
   - Add schema validation for imported data
   - Check required fields exist
   - Validate data types
   - Flag inconsistencies

2. **Error Recovery**
   - Better error messages for malformed files
   - Partial import support (continue on errors)
   - Import preview before applying

3. **Icon Management**
   - Icon deduplication
   - Bulk icon update
   - Icon preview in spreadsheet

4. **Translation Management**
   - Support for additional translation properties
   - Translation completeness check
   - Missing translation highlighting

---

## Related Files

### Core Import Flow
- `src/importCategory.ts` - Entry point
- `src/importCategory/extractTarFile.ts` - Archive extraction
- `src/importCategory/parseFiles.ts` - JSON parsing
- `src/importCategory/applyConfiguration.ts` - Orchestration

### Specific Handlers
- `src/importCategory/applyCategories.ts` - Categories sheet
- `src/importCategory/applyFields.ts` - Details sheet
- `src/importCategory/applyTranslations.ts` - Translation sheets
- `src/importCategory/applyMetadata.ts` - Metadata sheet

### Icon Processing
- `src/importCategory/parseIconSprite.ts` - SVG sprite extraction
- `src/icons.ts` - Icon generation reference

### Validation
- `src/importCategory/addDetailsDropdown.ts` - Dropdown setup
- `src/importCategory/clearValidations.ts` - Validation cleanup

### Export Reference (for comparison)
- `src/generateConfig/processPresets.ts` - Preset export
- `src/generateConfig/processFields.ts` - Field export
- `src/generateConfig/processTranslations.ts` - Translation export

---

## .mapeosettings / .comapeocat TAR Archive Structure

### Overview

`.mapeosettings` and `.comapeocat` files are **POSIX TAR archives** (often gzip compressed) containing configuration data, icons, and translations for Mapeo/CoMapeo applications.

**Test File**: `src/test/mapeo-default-min.mapeosettings`
- **Archive Format**: POSIX tar (gzip compressed)
- **Config Version**: v3.7.0 (from metadata.json)
- **Version**: 3.4.1 (from VERSION file)
- **Total Files**: 27 files

### Complete Directory Structure

```
mapeo-default-min/               (root directory in TAR)
├── metadata.json                # Package metadata
├── VERSION                      # Version string (e.g., "3.4.1")
├── presets.json                # Category and field definitions
├── translations.json           # Translation messages (all languages)
├── icons.svg                   # SVG symbol definitions
├── icons.png                   # PNG sprite sheet (all icons in one image)
├── icons.json                  # Sprite sheet coordinate mapping
├── style.css                   # Optional styling
└── icons/                      # Individual icon files (18 files)
    ├── animal-small@1x.png     # 333 bytes
    ├── animal-small@2x.png     # 641 bytes
    ├── animal-small@3x.png     # 888 bytes
    ├── animal-medium@1x.png    # 684 bytes
    ├── animal-medium@2x.png    # 1134 bytes
    ├── animal-medium@3x.png    # 1403 bytes
    ├── animal-large@1x.png     # 893 bytes
    ├── animal-large@2x.png     # 1424 bytes
    ├── animal-large@3x.png     # 1754 bytes
    ├── building-small@1x.png   # 291 bytes
    ├── building-small@2x.png   # 556 bytes
    ├── building-small@3x.png   # 773 bytes
    ├── building-medium@1x.png  # 607 bytes
    ├── building-medium@2x.png  # 970 bytes
    ├── building-medium@3x.png  # 1216 bytes
    ├── building-large@1x.png   # 791 bytes
    ├── building-large@2x.png   # 1253 bytes
    └── building-large@3x.png   # 1582 bytes
```

### Key Files Explained

#### metadata.json

Package-level metadata:

```json
{
  "dataset_id": "mapeo-minimal",
  "version": "v3.7.0",
  "name": "mapeo-default-min"
}
```

**Fields**:
- `dataset_id`: Unique identifier for this configuration
- `version`: CoMapeo config format version (e.g., "v3.7.0")
- `name`: Human-readable package name

#### presets.json

Defines categories (presets) and their associated fields.

**Structure**:
```json
{
  "categories": {},
  "fields": {
    "field-id": {
      "key": "field-id",
      "type": "text|select_one|select_multiple|...",
      "label": "Field Label",
      "placeholder": "Helper text",
      "options": ["Option1", "Option2"]
    }
  },
  "presets": {
    "preset-id": {
      "icon": "icon-name",
      "fields": ["field-id1", "field-id2"],
      "geometry": ["point", "area", "line"],
      "tags": { "type": "preset-id" },
      "terms": ["search", "terms"],
      "name": "Preset Name"
    }
  },
  "defaults": {
    "area": ["preset-id"],
    "line": [],
    "point": ["preset-id"],
    "vertex": [],
    "relation": []
  }
}
```

**Icon Reference**: Each preset's `"icon"` property references an icon by name (e.g., `"icon": "animal"`).

### Icon Formats - Three Different Representations

Icons are provided in **three different formats** to support various platforms and use cases:

#### Format 1: SVG Symbols (icons.svg)

Vector graphics stored as `<symbol>` elements in a single SVG file.

**Structure**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <symbol viewBox="0 0 11 6.5" id="animal" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 1.9S2.1 0 3.2 0..." fill="#6d626d"/>
  </symbol>
  <symbol viewBox="0 0 11 6.5" id="animal-12" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 1.9S2.1 0 3.2 0..." fill="#6d626d"/>
  </symbol>
  <symbol viewBox="0 0 9 9" id="building" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 4v5h1V5h2v4..." fill="#4b7767"/>
  </symbol>
  <symbol viewBox="0 0 9 9" id="building-12" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 4v5h1V5h2v4..." fill="#4b7767"/>
  </symbol>
</svg>
```

**Symbol IDs**: Icon names (e.g., "animal", "building") with optional size suffix (e.g., "-12")

**Use Case**: Scalable vector graphics, small file size, color customization

#### Format 2: PNG Sprite Sheet (icons.png + icons.json)

All icons rendered as a single PNG image with JSON coordinate mapping.

**icons.json** (coordinates for sprite sheet):
```json
{
  "animal-100px": {
    "width": 100,
    "height": 100,
    "x": 0,
    "y": 0,
    "pixelRatio": 1
  },
  "building-100px": {
    "width": 100,
    "height": 100,
    "x": 100,
    "y": 0,
    "pixelRatio": 1
  }
}
```

**icons.png**: Single image containing all icons positioned according to icons.json coordinates

**Use Case**: Web applications needing efficient rendering when displaying many icons simultaneously

#### Format 3: Individual PNG Files (icons/ directory)

Pre-rendered PNG files at multiple sizes and pixel densities.

**Naming Convention**: `{icon-name}-{size}@{resolution}.png`

**Sizes**:
- `small`: Smallest size variant (typically for lists/menus)
- `medium`: Medium size variant (default display)
- `large`: Largest size variant (prominent display)

**Resolutions**:
- `1x`: Standard resolution (72-96 DPI)
- `2x`: Retina/high-DPI displays (144-192 DPI)
- `3x`: Ultra-high-DPI displays (216-288 DPI)

**Example**: `animal-medium@2x.png` = Animal icon, medium size, 2x resolution (for Retina displays)

**File Sizes** (from test file):
- small@1x: ~300-400 bytes
- medium@1x: ~600-800 bytes
- medium@2x: ~1000-1200 bytes
- large@3x: ~1500-2000 bytes

**Use Case**: Mobile apps, native applications, spreadsheet import (our use case)

### Icon Extraction Strategy

When importing a `.mapeosettings` file, use this extraction strategy:

#### Step 1: Extract TAR Archive
```typescript
// Extract entire TAR to temporary folder
const extractFolder = DriveApp.createFolder("temp-extract-" + Date.now());
// ... extraction logic
```

#### Step 2: Parse presets.json to Get Icon Names
```typescript
const presets = JSON.parse(presetsFile.getDataAsString());
const iconNames = Object.values(presets.presets).map(p => p.icon);
// iconNames = ["animal", "building"]
```

#### Step 3: Extract Icons Based on Available Format

**Priority Order** (for Google Sheets import):
1. **Individual PNGs** (recommended for spreadsheet cells)
2. **SVG symbols** (if PNG not available)
3. **PNG sprite** (least preferred, requires cropping)

**Implementation**:
```typescript
function extractIcons(extractFolder, iconNames) {
  const icons = [];

  // Check for icons/ directory (Format 3 - Individual PNGs)
  const iconsFolders = extractFolder.getFoldersByName("icons");
  if (iconsFolders.hasNext()) {
    const iconsFolder = iconsFolders.next();

    for (const iconName of iconNames) {
      // Prefer medium@1x for good balance of quality/size
      const filename = `${iconName}-medium@1x.png`;
      const files = iconsFolder.getFilesByName(filename);

      if (files.hasNext()) {
        const file = files.next();
        icons.push({
          name: iconName,
          file: file,
          url: file.getUrl(),
          blob: file.getBlob()
        });
      }
    }

    return icons;
  }

  // Fallback to SVG symbols (Format 1)
  const svgFiles = extractFolder.getFilesByName("icons.svg");
  if (svgFiles.hasNext()) {
    return extractIconsFromSvgSprite(svgFiles.next(), iconNames);
  }

  // Last resort: PNG sprite (Format 2)
  const pngSpriteFiles = extractFolder.getFilesByName("icons.png");
  const jsonFiles = extractFolder.getFilesByName("icons.json");
  if (pngSpriteFiles.hasNext() && jsonFiles.hasNext()) {
    return extractIconsFromPngSprite(
      pngSpriteFiles.next(),
      jsonFiles.next(),
      iconNames
    );
  }

  return [];
}
```

#### Step 4: Move to Permanent Location

**Critical**: Don't store icons in temp folder - it gets deleted!

```typescript
// Get or create permanent icons folder
const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
const configFolder = getOrCreateConfigFolder(spreadsheet);
const permanentIconsFolder = getOrCreateIconsFolder(configFolder);

// Copy icons to permanent location
const permanentIcons = icons.map(icon => {
  // Check if already exists
  const existing = permanentIconsFolder.getFilesByName(icon.file.getName());

  if (existing.hasNext()) {
    // Update existing
    const existingFile = existing.next();
    existingFile.setContent(icon.blob);
    return { ...icon, file: existingFile, url: existingFile.getUrl() };
  } else {
    // Create new
    const newFile = permanentIconsFolder.createFile(icon.blob);
    return { ...icon, file: newFile, url: newFile.getUrl() };
  }
});

return permanentIcons;
```

### Common Import Issues

#### Issue 1: Icons Not Found
**Cause**: Looking for wrong format or filename pattern
**Solution**: Check all three formats in priority order

#### Issue 2: Icons Disappear After Import
**Cause**: Icons stored in temp folder that gets deleted
**Solution**: Move to permanent config folder structure

#### Issue 3: Wrong Icon Size
**Cause**: Hardcoded size/resolution in filename
**Solution**: Use `medium@1x` as default, allow configuration

#### Issue 4: SVG Parsing Errors
**Cause**: Invalid XML or missing symbol IDs
**Solution**: Validate SVG structure, handle missing symbols gracefully

### Validation Checklist

After implementing icon extraction:

- [ ] TAR extraction includes `icons/` subdirectory
- [ ] Can detect and handle all 3 icon formats
- [ ] Icons copied to permanent location (not temp folder)
- [ ] Icon URLs persist after temp folder cleanup
- [ ] Handles missing icons gracefully (placeholder or error)
- [ ] Icon size/resolution configurable
- [ ] Supports icon name matching from presets.json

### Related Implementation Files

- `src/importCategory/extractTarFile.ts` - TAR extraction logic
- `src/importCategory/parseIconSprite.ts` - SVG sprite parsing
- `src/importCategory/applyCategories.ts` - Apply icons to Categories sheet
- `src/icons.ts` - Icon generation reference for export
