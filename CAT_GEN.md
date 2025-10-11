# CAT_GEN.md - CoMapeo Category Generation Process

Complete documentation of the CoMapeo category generation pipeline with investigation, debugging, and improvement plans.

## Table of Contents

1. [Process Overview](#process-overview)
2. [Stage-by-Stage Analysis](#stage-by-stage-analysis)
3. [Investigation & Debug Plans](#investigation--debug-plans)
4. [Improvement Roadmap](#improvement-roadmap)

---

## Process Overview

The CoMapeo category generation process is a **9-stage pipeline** that transforms spreadsheet data into a packaged `.comapeocat` configuration file.

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER INTERACTION                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Stage 0: Language Selection Dialog                                  │
│   └─> User selects translation languages OR skips                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PREPARATION PHASES                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ Stage 1: Auto Translation (optional)                                │
│   └─> Translate to selected languages using Google Translate API    │
│                                                                       │
│ Stage 2: Validation (Linting)                                       │
│   └─> Validate data structure, types, and requirements              │
│                                                                       │
│ Stage 3: Data Extraction                                            │
│   └─> Read all sheet data into SheetData object                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PROCESSING PHASE                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Stage 4: Data Processing                                            │
│   ├─> Process Fields (Details → CoMapeoField[])                     │
│   ├─> Process Presets (Categories → CoMapeoPreset[])                │
│   ├─> Process Icons (Fetch/Generate SVG icons)                      │
│   ├─> Process Metadata (Create metadata + package.json)             │
│   └─> Process Translations (Aggregate messages)                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PACKAGING PHASES                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Stage 5: Save to Google Drive                                       │
│   └─> Create folder structure with JSON files                       │
│                                                                       │
│ Stage 6: ZIP Creation                                               │
│   └─> Compress Drive folder into ZIP blob                           │
│                                                                       │
│ Stage 7: API Submission                                             │
│   └─> Send ZIP to external API for final packaging                  │
│                                                                       │
│ Stage 8: Success Notification                                       │
│   └─> Show download link to user                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Entry Points

| Function | Location | Description |
|----------|----------|-------------|
| `generateCoMapeoConfig()` | `src/generateCoMapeoConfig.ts:5` | Main entry point, shows language dialog |
| `generateCoMapeoConfigSkipTranslation()` | `src/generateCoMapeoConfig.ts:14` | Callback for skip translation button |
| `generateCoMapeoConfigWithSelectedLanguages()` | `src/generateCoMapeoConfig.ts:23` | Main pipeline orchestrator |

---

## Stage-by-Stage Analysis

### Stage 0: Language Selection Dialog

**Purpose**: Allow user to select target languages for translation or skip translation entirely.

**Files Involved**:
- `src/generateCoMapeoConfig.ts:7` - Dialog trigger
- `src/dialog.ts` - Dialog HTML generation
- `src/spreadsheetData.ts:1-226` - Language data fetching

**Processing**:
1. Fetch available languages from remote JSON (200+ languages)
2. Get primary language from cell A1
3. Filter out primary language from options
4. Display selection dialog with checkboxes
5. User selects languages OR clicks "Skip Translation"

**Input**: None (user-initiated)

**Output**:
- `selectedLanguages: TranslationLanguage[]` (empty array if skipped)
- Calls `generateCoMapeoConfigWithSelectedLanguages(selectedLanguages)`

**External Dependencies**:
- Remote: `https://raw.githubusercontent.com/digidem/comapeo-mobile/refs/heads/develop/src/frontend/languages.json`
- Fallback: Hardcoded 142-language list in `spreadsheetData.ts:18-142`

**Error Handling**:
- Network failure → Falls back to hardcoded language list
- Invalid A1 cell → Defaults to English

**Current Issues**:
- Remote fetch can fail silently
- No user feedback if remote fetch fails
- Large language list can overwhelm UI

---

### Stage 1: Auto Translation

**Purpose**: Translate all text content to selected languages using Google Translate API.

**Files Involved**:
- `src/generateCoMapeoConfig.ts:30-36` - Orchestrator
- `src/translation.ts:343+` - `autoTranslateSheetsBidirectional()`
- `src/translation.ts:55-154` - `translateSheetBidirectional()`

**Processing**:
1. Skip if `selectedLanguages.length === 0`
2. For each translation sheet:
   - Category Translations
   - Detail Label Translations
   - Detail Helper Text Translations
   - Detail Option Translations
3. Ensure language columns exist in sheets
4. For each target language:
   - Find column position
   - Translate each row using `LanguageApp.translate()`
   - Skip cells that already have translations

**Input**:
- `selectedLanguages: TranslationLanguage[]`
- Spreadsheet sheets with primary language content in column A

**Output**:
- Updated spreadsheet with translated content in language columns
- Console logs with translation summary

**External Dependencies**:
- Google Apps Script `LanguageApp.translate()` API
- Primary language code from cell A1

**Error Handling**:
- Translation API errors → Log warning, skip that translation
- Missing columns → Create columns automatically
- Invalid language code → Error thrown

**Performance Considerations**:
- Can be slow for many languages × many rows
- API rate limits possible (Apps Script quotas)
- No progress indicator for long operations

**Current Issues**:
- No user feedback during translation
- Translation errors silently skipped
- No retry mechanism for failed translations
- Overwrites manual translations if cell is empty

---

### Stage 2: Validation (Linting)

**Purpose**: Validate spreadsheet data integrity, types, and requirements before processing.

**Files Involved**:
- `src/generateCoMapeoConfig.ts:40-41` - Orchestrator
- `src/lint.ts:456+` - `lintAllSheets()`
- `src/lint.ts:106-180` - Generic `lintSheet()` function
- `src/lint.ts:183-451` - Sheet-specific validators

**Processing**:
1. Clean whitespace-only cells
2. Check for duplicate values in name columns
3. Validate each column based on rules:
   - **Categories Sheet**: Name capitalization, icon URLs, fields comma-list, geometry
   - **Details Sheet**: Name capitalization, type (selectOne/Multiple/text/number), options format
   - **Translation Sheets**: Non-empty values, consistency
4. Highlight errors with background colors:
   - `#FFC7CE` (light red) - Duplicates
   - `#FFF2CC` (light yellow) - Missing required fields
   - Auto-fix - Capitalization corrections

**Input**:
- `showAlerts: boolean` (false when called from generation pipeline)
- All spreadsheet sheets

**Output**:
- Modified spreadsheet with highlighted errors
- Auto-corrected values (capitalization)
- Console logs of issues

**Error Handling**:
- Try-catch around each sheet
- Errors logged but don't stop process
- Silent when `showAlerts=false`

**Performance Considerations**:
- Fast for small datasets (<100 rows)
- Batch operations minimize API calls
- Color highlighting can be slow

**Current Issues**:
- Linting runs but errors don't block generation
- No validation summary shown to user
- Some validations too strict (e.g., geometry options)
- No validation for icon availability

---

### Stage 3: Data Extraction

**Purpose**: Read all spreadsheet data into structured JavaScript object.

**Files Involved**:
- `src/generateCoMapeoConfig.ts:44` - Orchestrator
- `src/spreadsheetData.ts:247-263` - `getSpreadsheetData()`
- `src/spreadsheetData.ts:233-246` - `sheets()` helper

**Processing**:
1. Get list of sheet names:
   - Category Translations
   - Detail Label Translations
   - Detail Helper Text Translations
   - Detail Option Translations
   - Categories
   - Details
2. For each sheet, read all data using `sheet.getDataRange().getValues()`
3. Store in object: `{ sheetName: values[][] }`
4. Add `documentName` from spreadsheet name

**Input**: Active spreadsheet

**Output**:
```typescript
SheetData {
  documentName: string,
  "Categories": (string|number|boolean)[][],
  "Details": (string|number|boolean)[][],
  "Category Translations": (string|number|boolean)[][],
  // ... other sheets
}
```

**Performance Considerations**:
- Single `getDataRange()` call per sheet (efficient)
- Large sheets (>1000 rows) can be slow
- All data loaded into memory

**Current Issues**:
- No validation that required sheets exist
- Reads all rows including empty ones
- No progress indicator
- Assumes sheet structure is correct

---

### Stage 4: Data Processing

**Purpose**: Transform spreadsheet data into CoMapeo configuration format.

**Files Involved**:
- `src/generateCoMapeoConfig.ts:94-117` - `processDataForCoMapeo()`
- `src/generateConfig/processFields.ts` - Fields processor
- `src/generateConfig/processPresets.ts` - Presets processor
- `src/generateIcons/iconProcessor.ts` - Icons processor
- `src/generateConfig/processMetadata.ts` - Metadata processor
- `src/generateConfig/processTranslations.ts` - Translations processor

This stage has 5 sub-stages:

#### Stage 4a: Process Fields

**Files**: `src/generateConfig/processFields.ts:1-11`

**Processing**:
1. Extract Details sheet data, skip header row
2. For each detail row, create CoMapeoField:
   - `tagKey`: slugify(detail[0]) - field identifier
   - `type`: getFieldType(detail[2]) - selectOne/Multiple/text/number
   - `label`: detail[0] - display name
   - `helperText`: detail[1] - help text
   - `options`: getFieldOptions(detail[2], detail[3]) - for select types
   - `universal`: detail[5] === "TRUE" - available everywhere

**Input**: `data.Details` (2D array)

**Output**: `CoMapeoField[]`

**Helper Functions** (`src/utils.ts`):
- `slugify()`: Converts to lowercase, removes special chars, replaces spaces with `-`
- `getFieldType()`: First char → m=selectMultiple, n=number, t=text, default=selectOne
- `getFieldOptions()`: Split by comma, create `{label, value}` objects

**Current Issues**:
- No validation of required columns
- Assumes Details sheet structure
- Options parsing fragile (comma-sensitive)
- No handling of empty rows

#### Stage 4b: Process Presets

**Files**: `src/generateConfig/processPresets.ts:1-29`

**Processing**:
1. Extract Categories sheet data, skip header row
2. Get background colors from cell backgrounds (column A)
3. For each category row, create CoMapeoPreset:
   - `icon`: slugify(category[0])
   - `color`: backgroundColors[index][0] or default #0000FF
   - `fields`: Split comma-list, slugify each
   - `geometry`: Always ["point", "line", "area"]
   - `tags`: { [slugified-name]: "yes" }
   - `name`: category[0]
   - `sort`: index + 1
   - `terms`: [name, ...field names with - replaced by space]

**Input**:
- `data.Categories` (2D array)
- Cell background colors from sheet

**Output**: `CoMapeoPreset[]`

**Current Issues**:
- Geometry is hardcoded, ignores sheet column
- Color defaults to blue if cell has no background
- Fields parsing fragile (comma-sensitive)
- No validation of field references

#### Stage 4c: Process Icons

**Files**:
- `src/generateIcons/iconProcessor.ts:6-37` - `processIcons()`
- `src/generateIcons/iconApi.ts` - Icon API helpers

**Processing**:
1. Get category data (names, background colors, icon URLs from column B)
2. For each category:
   - Check if icon is Google Drive URL → Use existing
   - Check if icon is cell image → Process via API
   - Otherwise → Generate new icon from API
3. Icon generation:
   - Search icon API with category name
   - Get PNG URL from search results
   - Call generate API to convert PNG → SVG with color
4. Return array of `{ name: slugified, svg: svgString }`

**Input**:
- Categories sheet (columns A, B for name and icon)
- Optional Drive folder for saving

**Output**: `CoMapeoIcon[]`

**External Dependencies**:
- Icon search API: `https://icons.earthdefenderstoolkit.com/api/search?s=<name>&l=en`
- Icon generate API: `https://icons.earthdefenderstoolkit.com/api/generate?image=<url>&color=<hex>`

**Error Handling**:
- API failure → Retry indefinitely (potential infinite loop!)
- Drive access failure → Falls back to generating new icon
- Invalid icon format → Generates new icon

**Current Issues**:
- **CRITICAL**: Infinite retry loop on API failure
- No timeout or max retry limit
- No offline/fallback icon support
- Slow for many categories
- No progress indicator

#### Stage 4d: Process Metadata

**Files**: `src/generateConfig/processMetadata.ts:1-102`

**Processing**:
1. Get or create Metadata sheet
2. For each metadata field, get or set value:
   - `dataset_id`: "comapeo-{slugified-document-name}" (persisted)
   - `name`: "config-{slugified-document-name}" (persisted)
   - `version`: Current date in YY.MM.DD format (always updated)
3. Create package.json structure with metadata

**Input**:
- `data.documentName`
- Metadata sheet (created if missing)

**Output**:
```typescript
{
  metadata: CoMapeoMetadata,
  packageJson: CoMapeoPackageJson
}
```

**Special Behavior**:
- Version always updates to current date
- Other values persist once set
- Metadata sheet auto-created if missing

**Current Issues**:
- Version auto-update can be unwanted
- No user control over version format
- Dataset ID cannot be changed after first generation
- No semantic versioning support

#### Stage 4e: Process Translations

**Files**: `src/generateConfig/processTranslations.ts:1-135`

**Processing**:
1. Get base languages from `languages()` helper
2. Get additional custom languages from Category Translations sheet headers
3. Create empty messages object for each language
4. For each translation sheet:
   - **Category Translations** → `presets.{icon}.name`
   - **Detail Label Translations** → `fields.{tagKey}.label`
   - **Detail Helper Text Translations** → `fields.{tagKey}.helperText`
   - **Detail Option Translations** → `fields.{tagKey}.options.{value}`
5. For each row, create translation entry with message and description

**Input**:
- `data` (SheetData with translation sheets)
- `fields` (CoMapeoField[])
- `presets` (CoMapeoPreset[])

**Output**:
```typescript
CoMapeoTranslations {
  [languageCode]: {
    "presets.icon-name.name": { message: "...", description: "..." },
    "fields.tag-key.label": { message: "...", description: "..." },
    // ...
  }
}
```

**Current Issues**:
- Assumes translation sheet rows align with fields/presets order
- **CRITICAL BUG**: Index misalignment if sheets have different row counts
- No validation of language codes
- Silent failures for missing translations
- Excessive console logging

---

### Stage 5: Save to Google Drive

**Purpose**: Create Drive folder structure with JSON configuration files.

**Files Involved**:
- `src/generateCoMapeoConfig.ts:52-53` - Orchestrator
- `src/driveService.ts:85-146` - `saveConfigToDrive()`
- `src/driveService.ts:148-233` - Helper functions

**Processing**:
1. Get or create config folder (slugified spreadsheet name)
2. Create `rawBuilds` subfolder
3. Create version folder (slugified version string)
4. Create subfolders: `presets/`, `icons/`, `fields/`, `messages/`
5. Save files:
   - `presets/{icon}.json` - One file per preset
   - `icons/{icon}-{size}.svg` - Icon files with size suffixes
   - `fields/{tagKey}.json` - One file per field
   - `messages/{lang}.json` - One file per language
   - `metadata.json` - Root metadata
   - `package.json` - Root package info
6. Return folder URL and ID

**Input**: `config: CoMapeoConfig`

**Output**:
```typescript
{
  url: string,  // Google Drive folder URL
  id: string    // Folder ID for next stage
}
```

**Drive Structure Created**:
```
{spreadsheet-name}/
└── rawBuilds/
    └── {version}/
        ├── presets/
        │   ├── category-1.json
        │   └── category-2.json
        ├── icons/
        │   ├── category-1-100px.svg
        │   ├── category-1-24px.svg
        │   └── ...
        ├── fields/
        │   ├── field-1.json
        │   └── field-2.json
        ├── messages/
        │   ├── en.json
        │   ├── es.json
        │   └── ...
        ├── metadata.json
        └── package.json
```

**Error Handling**:
- Folder creation failure → Error with permissions message
- File save failure → Error with details
- 1-second delay after save to ensure Drive sync

**Performance Considerations**:
- Many individual `createFile()` calls (slow)
- No batching of Drive operations
- Can fail on quota limits

**Current Issues**:
- No cleanup of old versions
- Folder structure can get cluttered
- No validation of saved files
- Hard-coded size suffixes (`-100px`, `-24px`)
- Icon format handling fragile

---

### Stage 6: ZIP Creation

**Purpose**: Compress Drive folder contents into a ZIP blob.

**Files Involved**:
- `src/generateCoMapeoConfig.ts:58` - Orchestrator
- `src/driveService.ts:1-44` - `saveDriveFolderToZip()`

**Processing**:
1. Get folder by ID (from previous stage)
2. Recursively traverse folder tree
3. For each file:
   - Get blob
   - Set name with path prefix (e.g., `presets/category.json`)
4. For each subfolder:
   - Add to path
   - Recurse
5. Use `Utilities.zip()` to compress all blobs
6. Name ZIP file: `{folder-name}.zip`

**Input**: `folderId: string`

**Output**: `GoogleAppsScript.Base.Blob` (ZIP file)

**Error Handling**:
- Invalid folder ID → Error with details
- Folder access failure → Permissions error
- Empty folder → Creates empty ZIP

**Performance Considerations**:
- Fast for small configs (<100 files)
- Can be slow for large icon sets
- No progress indicator

**Current Issues**:
- No validation of ZIP contents
- No size checks (potential memory issues)
- Recursion depth not limited
- Error messages could be clearer

---

### Stage 7: API Submission

**Purpose**: Send ZIP to external packaging API and save result.

**Files Involved**:
- `src/generateCoMapeoConfig.ts:62` - Orchestrator
- `src/apiService.ts:32-165` - `sendDataToApiAndGetZip()`
- `src/apiService.ts:8-21` - `validateZipFile()`
- `src/driveService.ts:62-83` - `saveZipToDrive()`

**Processing**:
1. Set up retry loop (max 3 attempts)
2. For each attempt:
   - POST ZIP to API: `http://137.184.153.36:3000/`
   - Wait for response
   - Check response code (expect 200)
   - Validate response size (min 10KB)
   - Validate ZIP signature (0x50 0x4B 0x03 0x04)
   - Save to Drive if valid
   - Return Drive URL
3. On failure:
   - Show retry dialog to user
   - Exponential backoff: wait 2^retry seconds
   - Try again
4. After max retries:
   - Show error dialog
   - Throw error

**Input**:
- `zipFile: Blob`
- `metadata: { name, version }`
- `maxRetries: number` (default 3)

**Output**: `string` (URL to saved .comapeocat file in Drive)

**External Dependencies**:
- **CRITICAL**: External API at `http://137.184.153.36:3000/`
- Google Drive API for saving result

**Error Handling**:
- Network failure → Retry with backoff
- Non-200 response → Retry
- Invalid ZIP → Retry
- File too small → Retry
- Save failure → Retry
- Max retries exceeded → User error dialog

**Performance Considerations**:
- Can be slow (network + API processing)
- Exponential backoff: 2s, 4s, 8s delays
- No timeout on API request
- Blocking operation (no progress indicator)

**Current Issues**:
- **CRITICAL**: Hardcoded API URL (not configurable)
- **SECURITY**: HTTP not HTTPS
- **RELIABILITY**: Single point of failure
- No API health check before submitting
- User sees retry dialogs (poor UX)
- No cancellation option
- Response validation could be stronger

**Drive Save Details** (`saveZipToDrive`):
1. Get config folder
2. Get or create `builds/` subfolder
3. Double-zip the blob (ZIP inside ZIP)
4. Name: `{version}.zip`
5. Save file
6. Return file URL

---

### Stage 8: Success Notification

**Purpose**: Show success dialog with download link to user.

**Files Involved**:
- `src/generateCoMapeoConfig.ts:65-66` - Orchestrator
- `src/dialog.ts` - Dialog HTML generation

**Processing**:
1. Update progress dialog to final stage text
2. Call `showConfigurationGeneratedDialog(configUrl)`
3. Display HTML dialog with:
   - Success message
   - Download link (button to Drive URL)
   - CoMapeo branding
   - Instructions for next steps

**Input**: `configUrl: string` (Drive URL to .comapeocat file)

**Output**: User-visible modal dialog

**Current Issues**:
- No validation that URL is accessible
- No file size information
- No QR code for mobile transfer
- Dialog must be manually closed

---

## Investigation & Debug Plans

### General Debugging Strategies

#### 1. Add Comprehensive Logging

**Goal**: Track execution flow and data transformations

**Implementation**:
```typescript
// Add to each stage
function stageN(...) {
  const startTime = new Date().getTime();
  console.log(`[STAGE N] Starting at ${new Date().toISOString()}`);
  console.log(`[STAGE N] Input:`, JSON.stringify(input));

  try {
    // ... processing ...
    const result = ...;

    console.log(`[STAGE N] Output:`, JSON.stringify(result));
    console.log(`[STAGE N] Duration: ${new Date().getTime() - startTime}ms`);
    return result;
  } catch (error) {
    console.error(`[STAGE N] Error:`, error);
    throw error;
  }
}
```

**Benefits**:
- Track execution time per stage
- Identify bottlenecks
- Debug data transformation issues
- Reproduce errors from logs

#### 2. Create Test Functions

**Goal**: Test each stage independently

**Implementation**:
```typescript
// Test data extraction
function testStage3() {
  const data = getSpreadsheetData();
  console.log("Categories count:", data.Categories.length);
  console.log("Details count:", data.Details.length);
  console.log("Sample category:", data.Categories[1]);
  console.log("Sample detail:", data.Details[1]);
}

// Test field processing
function testStage4a() {
  const data = getSpreadsheetData();
  const fields = processFields(data);
  console.log("Fields generated:", fields.length);
  console.log("Sample field:", fields[0]);

  // Validation
  const invalidFields = fields.filter(f => !f.tagKey || !f.type);
  if (invalidFields.length > 0) {
    console.error("Invalid fields found:", invalidFields);
  }
}

// Test full config generation (without Drive/API)
function testStage4() {
  const data = getSpreadsheetData();
  const config = processDataForCoMapeo(data);
  console.log("Config generated:");
  console.log("- Fields:", config.fields.length);
  console.log("- Presets:", config.presets.length);
  console.log("- Icons:", config.icons.length);
  console.log("- Languages:", Object.keys(config.messages).length);

  // Save to script properties for inspection
  PropertiesService.getScriptProperties().setProperty(
    'last_config',
    JSON.stringify(config)
  );
}
```

**Benefits**:
- Test without external dependencies
- Validate data at each stage
- Quick iteration during development
- Save intermediate results for inspection

#### 3. Add Validation Checkpoints

**Goal**: Catch errors early before they cascade

**Implementation**:
```typescript
function validateSheetStructure() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const requiredSheets = ["Categories", "Details"];
  const missing = [];

  for (const name of requiredSheets) {
    if (!spreadsheet.getSheetByName(name)) {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required sheets: ${missing.join(", ")}`);
  }

  // Validate Categories structure
  const categories = spreadsheet.getSheetByName("Categories");
  const categoryHeaders = categories.getRange(1, 1, 1, 4).getValues()[0];
  // ... validate headers

  return true;
}

function validateConfig(config: CoMapeoConfig) {
  const errors = [];

  if (!config.metadata.dataset_id) {
    errors.push("Missing dataset_id");
  }

  if (config.fields.length === 0) {
    errors.push("No fields defined");
  }

  if (config.presets.length === 0) {
    errors.push("No presets defined");
  }

  // Validate field references in presets
  const fieldKeys = new Set(config.fields.map(f => f.tagKey));
  for (const preset of config.presets) {
    const invalidFields = preset.fields.filter(f => !fieldKeys.has(f));
    if (invalidFields.length > 0) {
      errors.push(`Preset "${preset.name}" references invalid fields: ${invalidFields.join(", ")}`);
    }
  }

  if (errors.length > 0) {
    throw new Error("Config validation failed:\n" + errors.join("\n"));
  }

  return true;
}
```

#### 4. Create Mock Data

**Goal**: Test without requiring full spreadsheet setup

**Implementation**:
```typescript
function getMockSheetData(): SheetData {
  return {
    documentName: "Test Config",
    Categories: [
      ["Name", "Icon", "Fields", "Geometry"],
      ["Water Point", "water", "Type, Status", "point"],
      ["Forest", "tree", "Species, Height", "area"]
    ],
    Details: [
      ["Name", "Helper", "Type", "Options", "", "Universal"],
      ["Type", "Select type", "selectOne", "Well, Spring, Tank", "", "FALSE"],
      ["Status", "Current status", "selectOne", "Working, Broken", "", "TRUE"]
    ],
    "Category Translations": [
      ["English", "Español"],
      ["Water Point", "Punto de Agua"],
      ["Forest", "Bosque"]
    ],
    "Detail Label Translations": [
      ["English", "Español"],
      ["Type", "Tipo"],
      ["Status", "Estado"]
    ],
    "Detail Helper Text Translations": [
      ["English", "Español"],
      ["Select type", "Seleccionar tipo"],
      ["Current status", "Estado actual"]
    ],
    "Detail Option Translations": [
      ["English", "Español"],
      ["Well, Spring, Tank", "Pozo, Manantial, Tanque"],
      ["Working, Broken", "Funcionando, Roto"]
    ]
  };
}

function testWithMockData() {
  const data = getMockSheetData();
  const config = processDataForCoMapeo(data);
  console.log("Mock config:", config);
}
```

### Stage-Specific Debug Plans

#### Stage 0: Language Selection

**Testing**:
```typescript
function testLanguageFetch() {
  const all = getAllLanguages();
  console.log("Total languages:", Object.keys(all).length);
  console.log("Sample:", Object.entries(all).slice(0, 5));
}

function testPrimaryLanguageDetection() {
  const primary = getPrimaryLanguage();
  console.log("Primary language:", primary);

  // Test with invalid A1 value
  const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Categories");
  const currentA1 = categoriesSheet.getRange("A1").getValue();

  categoriesSheet.getRange("A1").setValue("InvalidLanguage");
  const invalid = getPrimaryLanguage();
  console.log("With invalid A1:", invalid);

  // Restore
  categoriesSheet.getRange("A1").setValue(currentA1);
}
```

**Common Issues**:
- Remote language fetch fails → Check network, API availability
- Invalid primary language → Validate A1 cell contains exact language name from list
- Dialog doesn't show → Check for JavaScript errors in browser console

**Improvements Needed**:
1. Add loading indicator during language fetch
2. Show error if remote fetch fails
3. Validate A1 cell value on sheet change
4. Add search/filter to language list
5. Remember user's language selections

#### Stage 1: Translation

**Testing**:
```typescript
function testTranslationSheet() {
  const sheetName = "Category Translations";
  const targetLanguages = ["es", "pt"];

  console.log(`Testing translation of ${sheetName} to ${targetLanguages.join(", ")}`);

  try {
    translateSheetBidirectional(sheetName, targetLanguages);
    console.log("Translation successful");
  } catch (error) {
    console.error("Translation failed:", error);
  }
}

function testBatchTranslation() {
  const targetLanguages = ["es"];
  autoTranslateSheetsBidirectional(targetLanguages);
}

function validateTranslationColumns() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Category Translations");
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  console.log("Translation columns:", headers);

  // Check for empty translations
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    for (let j = 1; j < data[i].length; j++) {
      if (!data[i][j]) {
        console.warn(`Empty translation at row ${i+1}, column ${headers[j]}`);
      }
    }
  }
}
```

**Common Issues**:
- Translation fails silently → Check LanguageApp quota limits
- Wrong language translated → Verify language code vs. language name
- Overwrites manual translations → Add "force" parameter to control
- Slow performance → Batch translations, add progress indicator

**Improvements Needed**:
1. Progress bar for translation
2. Retry failed translations
3. Option to preserve manual translations
4. Translation quality validation
5. Offline mode (skip translation)
6. Cache translations to avoid re-translating

#### Stage 2: Validation

**Testing**:
```typescript
function testLintCategories() {
  lintCategoriesSheet();
  console.log("Check Categories sheet for highlighted cells");
}

function testLintDetails() {
  lintDetailsSheet();
  console.log("Check Details sheet for highlighted cells");
}

function testLintAll() {
  lintAllSheets(true); // Show alerts
}

function getLintReport() {
  const errors = [];
  const warnings = [];

  // Categories validation
  const categories = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Categories");
  const catData = categories.getDataRange().getValues();

  for (let i = 1; i < catData.length; i++) {
    if (!catData[i][0]) {
      errors.push(`Categories row ${i+1}: Missing name`);
    }
    // ... more checks
  }

  console.log("Lint Report:");
  console.log("Errors:", errors);
  console.log("Warnings:", warnings);

  return { errors, warnings };
}
```

**Common Issues**:
- Linting doesn't block invalid configs → Add hard validation
- Auto-fixes may not be wanted → Add confirmation dialog
- No summary of issues → Generate validation report
- Color highlighting hard to see → Use data validation dropdowns

**Improvements Needed**:
1. Validation summary dialog before generation
2. Option to fix vs. cancel
3. Severity levels (error vs. warning)
4. Detailed error messages
5. Link to documentation for fixes
6. Pre-generation validation gate

#### Stage 3: Data Extraction

**Testing**:
```typescript
function testDataExtraction() {
  const data = getSpreadsheetData();

  console.log("Extracted sheets:", Object.keys(data));
  console.log("Document name:", data.documentName);

  for (const [sheetName, values] of Object.entries(data)) {
    if (Array.isArray(values)) {
      console.log(`${sheetName}: ${values.length} rows x ${values[0]?.length || 0} cols`);
    }
  }

  // Check for empty sheets
  const emptySheets = [];
  for (const [name, values] of Object.entries(data)) {
    if (Array.isArray(values) && values.length <= 1) {
      emptySheets.push(name);
    }
  }

  if (emptySheets.length > 0) {
    console.warn("Empty sheets:", emptySheets);
  }
}

function inspectSheetData() {
  const data = getSpreadsheetData();

  // Save to properties for manual inspection
  for (const [sheetName, values] of Object.entries(data)) {
    if (Array.isArray(values)) {
      PropertiesService.getScriptProperties().setProperty(
        `sheet_${sheetName}`,
        JSON.stringify(values.slice(0, 10)) // First 10 rows
      );
    }
  }

  console.log("Sheet data saved to script properties");
}
```

**Common Issues**:
- Missing sheets → Validate before extraction
- Empty rows included → Filter empty rows
- Incorrect data types → Validate cell types
- Large data sets slow → Optimize with ranges

**Improvements Needed**:
1. Validate sheet existence before reading
2. Filter empty/header rows
3. Type validation per column
4. Progress indicator for large sheets
5. Data preview before processing
6. Error recovery if sheet missing

#### Stage 4: Data Processing

**Testing Each Sub-stage**:

```typescript
// 4a: Test Fields Processing
function testFieldsProcessing() {
  const data = getSpreadsheetData();
  const fields = processFields(data);

  console.log(`Processed ${fields.length} fields`);

  for (const field of fields) {
    console.log(`Field: ${field.label} (${field.tagKey})`);
    console.log(`  Type: ${field.type}`);
    if (field.options) {
      console.log(`  Options:`, field.options);
    }
  }

  // Validation
  const invalid = fields.filter(f =>
    !f.tagKey || !f.label || !f.type
  );

  if (invalid.length > 0) {
    console.error("Invalid fields:", invalid);
  }
}

// 4b: Test Presets Processing
function testPresetsProcessing() {
  const data = getSpreadsheetData();
  const presets = processPresets(data);

  console.log(`Processed ${presets.length} presets`);

  for (const preset of presets) {
    console.log(`Preset: ${preset.name} (${preset.icon})`);
    console.log(`  Color: ${preset.color}`);
    console.log(`  Fields: ${preset.fields.join(", ")}`);
  }

  // Validation
  const noColor = presets.filter(p => p.color === "#0000FF");
  if (noColor.length > 0) {
    console.warn("Presets with default color:", noColor.map(p => p.name));
  }
}

// 4c: Test Icon Processing
function testIconProcessing() {
  const categories = ["Water", "Forest", "School"];
  const colors = ["#0000FF", "#00FF00", "#FF0000"];

  for (let i = 0; i < categories.length; i++) {
    console.log(`Generating icon for ${categories[i]}...`);
    const svg = generateNewIcon(categories[i], colors[i]);
    console.log(`Result: ${svg.substring(0, 100)}...`);
  }
}

function testIconAPIAvailability() {
  const testQuery = "water";
  const searchData = fetchSearchData(testQuery);

  if (searchData && searchData.length > 0) {
    console.log("Icon API is available");
    console.log("Sample result:", searchData[0]);
  } else {
    console.error("Icon API unavailable or returned no results");
  }
}

// 4d: Test Metadata Processing
function testMetadataProcessing() {
  const data = getSpreadsheetData();
  const { metadata, packageJson } = processMetadata(data);

  console.log("Metadata:", metadata);
  console.log("Package JSON:", packageJson);

  // Check version format
  const versionRegex = /^\d{2}\.\d{2}\.\d{2}$/;
  if (!versionRegex.test(metadata.version)) {
    console.warn("Unexpected version format:", metadata.version);
  }
}

// 4e: Test Translation Processing
function testTranslationProcessing() {
  const data = getSpreadsheetData();
  const fields = processFields(data);
  const presets = processPresets(data);
  const messages = processTranslations(data, fields, presets);

  console.log("Languages:", Object.keys(messages));

  for (const [lang, msgs] of Object.entries(messages)) {
    console.log(`${lang}: ${Object.keys(msgs).length} messages`);

    // Sample messages
    const sampleKeys = Object.keys(msgs).slice(0, 3);
    for (const key of sampleKeys) {
      console.log(`  ${key}:`, msgs[key]);
    }
  }

  // Validation: Check for empty messages
  for (const [lang, msgs] of Object.entries(messages)) {
    const empty = Object.entries(msgs).filter(([k, v]) => !v.message);
    if (empty.length > 0) {
      console.warn(`${lang} has ${empty.length} empty messages`);
    }
  }
}

// Test full processing pipeline
function testCompleteProcessing() {
  const data = getSpreadsheetData();
  const config = processDataForCoMapeo(data);

  console.log("=== Complete Config ===");
  console.log("Metadata:", config.metadata);
  console.log("Package:", config.packageJson);
  console.log("Fields:", config.fields.length);
  console.log("Presets:", config.presets.length);
  console.log("Icons:", config.icons.length);
  console.log("Languages:", Object.keys(config.messages).length);

  // Save to properties
  PropertiesService.getScriptProperties().setProperty(
    'test_config',
    JSON.stringify(config, null, 2)
  );

  console.log("Config saved to script properties as 'test_config'");
}
```

**Common Issues**:
- **Stage 4a**: Field type detection fails → Check type column format
- **Stage 4b**: Color not extracted → Check cell background color
- **Stage 4c**: Icon API timeout → Add timeout and retry limits
- **Stage 4d**: Version overwrites → Add option to keep version
- **Stage 4e**: Translation index mismatch → Validate row counts match

**Improvements Needed**:
1. Validate data structure before processing
2. Add timeout to icon API calls (max 30s)
3. Cache generated icons
4. Allow version manual override
5. Fix translation indexing bug
6. Add dry-run mode (validate without side effects)

#### Stage 5: Drive Operations

**Testing**:
```typescript
function testDriveFolderCreation() {
  const mockConfig = {
    metadata: {
      dataset_id: "test-config",
      name: "Test Config",
      version: "25.01.08"
    },
    packageJson: { name: "test", version: "1.0.0" },
    fields: [],
    presets: [],
    icons: [],
    messages: {}
  };

  try {
    const result = saveConfigToDrive(mockConfig);
    console.log("Folder created:", result.url);
    console.log("Folder ID:", result.id);
  } catch (error) {
    console.error("Drive operation failed:", error);
  }
}

function testDrivePermissions() {
  try {
    const testFolder = DriveApp.createFolder("_test_permissions_");
    console.log("Drive write access: OK");
    testFolder.setTrashed(true);
  } catch (error) {
    console.error("Drive write access: FAILED", error);
  }
}

function inspectDriveStructure() {
  const configFolder = getConfigFolder();
  console.log("Config folder:", configFolder.getName());

  const rawBuilds = configFolder.getFoldersByName("rawBuilds");
  if (rawBuilds.hasNext()) {
    const folder = rawBuilds.next();
    const subfolders = folder.getFolders();

    console.log("Version folders:");
    while (subfolders.hasNext()) {
      const sub = subfolders.next();
      console.log(`  ${sub.getName()} - ${sub.getUrl()}`);
    }
  }
}
```

**Common Issues**:
- Permission errors → Check Drive API access
- Folder creation fails → Check quota limits
- Files not appearing → Wait for Drive sync
- Large files timeout → Increase timeout

**Improvements Needed**:
1. Batch file creation
2. Progress indicator
3. Cleanup old versions
4. Validate files after creation
5. Add rollback on failure
6. Better error messages

#### Stage 6: ZIP Creation

**Testing**:
```typescript
function testZipCreation() {
  // Create test folder with files
  const testFolder = DriveApp.createFolder("_test_zip_");
  testFolder.createFile("test1.txt", "Content 1");
  testFolder.createFile("test2.json", '{"key": "value"}');

  try {
    const zipBlob = saveDriveFolderToZip(testFolder.getId());
    console.log("ZIP created:");
    console.log("  Name:", zipBlob.getName());
    console.log("  Size:", zipBlob.getBytes().length);
    console.log("  Type:", zipBlob.getContentType());
  } catch (error) {
    console.error("ZIP creation failed:", error);
  } finally {
    testFolder.setTrashed(true);
  }
}

function validateZipContents() {
  // This requires manual inspection
  console.log("To validate ZIP:");
  console.log("1. Run generation");
  console.log("2. Check logs for folder ID");
  console.log("3. Download ZIP from Drive");
  console.log("4. Extract and verify contents");
}
```

**Common Issues**:
- Empty ZIP created → Validate folder has files
- Missing files in ZIP → Check recursion
- ZIP corruption → Check file sizes
- Memory limits → Reduce file count/size

**Improvements Needed**:
1. Validate ZIP after creation
2. Check file count matches expected
3. Add size limit validation
4. Better error on empty folder
5. Test ZIP extraction

#### Stage 7: API Submission

**Testing**:
```typescript
function testAPIAvailability() {
  const apiUrl = "http://137.184.153.36:3000/";

  try {
    const response = UrlFetchApp.fetch(apiUrl, {
      method: "get",
      muteHttpExceptions: true
    });

    console.log("API Status:", response.getResponseCode());
    console.log("API Response:", response.getContentText());
  } catch (error) {
    console.error("API unavailable:", error);
  }
}

function testZipValidation() {
  // Test with valid ZIP
  const validZip = [0x50, 0x4B, 0x03, 0x04, 0x00, 0x00];
  console.log("Valid ZIP signature:", validateZipFile(validZip));

  // Test with invalid ZIP
  const invalidZip = [0x00, 0x00, 0x00, 0x00];
  console.log("Invalid ZIP signature:", validateZipFile(invalidZip));
}

function simulateAPIFailure() {
  // Test retry logic
  const mockBlob = Utilities.newBlob("test", "application/zip", "test.zip");
  const mockMetadata = { name: "test", version: "1.0.0" };

  // This will fail (invalid API), testing retry logic
  try {
    sendDataToApiAndGetZip(mockBlob, mockMetadata, 2);
  } catch (error) {
    console.log("Expected error after retries:", error.message);
  }
}
```

**Common Issues**:
- **CRITICAL**: API offline → No fallback mechanism
- Network timeout → No timeout configured
- Invalid response → Retry logic works but poor UX
- Retry dialogs annoying → Background retry with final notification

**Improvements Needed**:
1. **URGENT**: Add API health check before submission
2. **URGENT**: Add timeout (60s max)
3. **URGENT**: Add HTTPS support
4. **URGENT**: Configurable API endpoint
5. Silent retry with progress indicator
6. Fallback: save raw ZIP if API fails
7. Better error messages
8. Cancel option during retry

---

## Improvement Roadmap

### Critical Issues (Fix Immediately)

#### 1. Icon API Infinite Loop
**Location**: `src/generateIcons/iconProcessor.ts:242-249`

**Problem**:
```typescript
while (!searchData) {
  console.log(`Retrying search for ${preset.name}`);
  searchData = findValidSearchData(searchParams);
}
```
This will loop forever if API is unavailable.

**Fix**:
```typescript
let retries = 0;
const maxRetries = 5;

while (!searchData && retries < maxRetries) {
  console.log(`Retrying search for ${preset.name} (${retries + 1}/${maxRetries})`);
  searchData = findValidSearchData(searchParams);
  retries++;

  if (!searchData && retries < maxRetries) {
    Utilities.sleep(1000 * retries); // Exponential backoff
  }
}

if (!searchData) {
  console.warn(`Failed to fetch icon for ${preset.name}, using fallback`);
  return createFallbackIcon(preset);
}
```

#### 2. Translation Index Mismatch
**Location**: `src/generateConfig/processTranslations.ts:32-122`

**Problem**: Assumes translation sheets have same row count as fields/presets.

**Fix**:
```typescript
// Instead of using array index, match by name/label
const translationMap = new Map();

// Build map from primary language column
for (let i = 0; i < translations.length; i++) {
  const primaryText = translations[i][0];
  translationMap.set(primaryText.trim().toLowerCase(), i);
}

// Match fields/presets by name
for (const item of items) {
  const itemName = item.name || item.label;
  const index = translationMap.get(itemName.trim().toLowerCase());

  if (index !== undefined) {
    const translationRow = translations[index];
    // ... process translation
  } else {
    console.warn(`No translation found for: ${itemName}`);
  }
}
```

#### 3. API Hardcoded URL
**Location**: `src/apiService.ts:38`

**Problem**: No way to change API endpoint without code change.

**Fix**:
```typescript
function getAPIUrl(): string {
  // Check script properties first
  const customUrl = PropertiesService.getScriptProperties()
    .getProperty('COMAPEO_API_URL');

  if (customUrl) {
    return customUrl;
  }

  // Fall back to default
  return "http://137.184.153.36:3000/";
}

// Add menu option to configure
function showAPIConfigDialog() {
  const current = getAPIUrl();
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    "Configure API URL",
    `Current URL: ${current}\n\nEnter new URL or leave blank to reset to default:`,
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const newUrl = response.getResponseText().trim();
    if (newUrl) {
      PropertiesService.getScriptProperties()
        .setProperty('COMAPEO_API_URL', newUrl);
      ui.alert("API URL updated to: " + newUrl);
    }
  }
}
```

#### 4. No API Health Check
**Location**: `src/apiService.ts:32` (add before sendDataToApiAndGetZip)

**Fix**:
```typescript
function checkAPIHealth(apiUrl: string): boolean {
  try {
    const response = UrlFetchApp.fetch(apiUrl + "health", {
      method: "get",
      muteHttpExceptions: true,
      timeoutInSeconds: 5
    });

    return response.getResponseCode() === 200;
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
}

function sendDataToApiAndGetZip(...) {
  // Check API health before attempting
  const apiUrl = getAPIUrl();

  if (!checkAPIHealth(apiUrl)) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      "API Unavailable",
      "The packaging API is currently unavailable. Would you like to save the raw configuration instead?",
      ui.ButtonSet.YES_NO
    );

    if (response === ui.Button.YES) {
      // Save raw ZIP to Drive and return URL
      return saveZipToDrive(zipFile, metadata.version);
    } else {
      throw new Error("API unavailable and user declined fallback");
    }
  }

  // ... rest of function
}
```

### Quick Wins (Low Effort, High Impact)

#### 1. Add Progress Indicators
**Effort**: 2-3 hours
**Impact**: Much better UX

```typescript
// Create persistent progress dialog
function createProgressDialog() {
  const html = HtmlService.createHtmlOutput(`
    <div id="progress">
      <h3>Generating CoMapeo Category</h3>
      <div class="progress-bar">
        <div id="progress-fill" style="width: 0%"></div>
      </div>
      <p id="status">Starting...</p>
      <p id="details"></p>
    </div>
    <script>
      function updateProgress(percent, status, details) {
        document.getElementById('progress-fill').style.width = percent + '%';
        document.getElementById('status').textContent = status;
        document.getElementById('details').textContent = details || '';
      }
    </script>
  `).setWidth(400).setHeight(200);

  SpreadsheetApp.getUi().showModalDialog(html, "Progress");
}

// Update from server side
function updateProgressDialog(percent, status, details) {
  const html = HtmlService.createHtmlOutput(`
    <script>
      window.opener.updateProgress(${percent}, "${status}", "${details}");
    </script>
  `);
  // This requires keeping dialog reference
}
```

#### 2. Validation Summary Before Generation
**Effort**: 3-4 hours
**Impact**: Prevents failed generations

```typescript
function showValidationSummary() {
  const errors = [];
  const warnings = [];

  // Run all validations
  // ... collect errors and warnings

  if (errors.length === 0 && warnings.length === 0) {
    // Proceed with generation
    return true;
  }

  const ui = SpreadsheetApp.getUi();
  let message = "";

  if (errors.length > 0) {
    message += "ERRORS (must fix):\n" + errors.join("\n") + "\n\n";
  }

  if (warnings.length > 0) {
    message += "WARNINGS (optional):\n" + warnings.join("\n") + "\n\n";
  }

  if (errors.length > 0) {
    message += "Cannot proceed with errors. Fix issues and try again.";
    ui.alert("Validation Failed", message, ui.ButtonSet.OK);
    return false;
  }

  message += "Proceed with generation?";
  const response = ui.alert("Validation Warnings", message, ui.ButtonSet.YES_NO);

  return response === ui.Button.YES;
}
```

#### 3. Cache Icon API Results
**Effort**: 2 hours
**Impact**: Faster regeneration, reduced API load

```typescript
function getOrFetchIcon(name: string, color: string): string {
  const cacheKey = `icon_${slugify(name)}_${color}`;
  const cache = CacheService.getScriptCache();

  // Check cache (max 6 hours)
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`Using cached icon for ${name}`);
    return cached;
  }

  // Fetch from API
  const svg = generateNewIcon(name, color);

  // Cache result
  cache.put(cacheKey, svg, 21600); // 6 hours

  return svg;
}
```

#### 4. Add Timeout to API Calls
**Effort**: 1 hour
**Impact**: Prevents indefinite hangs

```typescript
// In apiService.ts
const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
  method: "post",
  payload: form,
  muteHttpExceptions: true,
  timeoutInSeconds: 60 // Add this!
};
```

### Medium-Term Improvements (1-2 weeks)

#### 1. Refactor to Async/Await Pattern
**Effort**: 1 week
**Impact**: Better error handling, cleaner code

Convert callback-based flow to async/await with proper error boundaries.

#### 2. Add Comprehensive Testing Suite
**Effort**: 1-2 weeks
**Impact**: Confidence in changes, regression prevention

Create test functions for each stage with mock data.

#### 3. Improve Error Messages
**Effort**: 3-4 days
**Impact**: Easier troubleshooting for users

Replace generic errors with specific, actionable messages.

#### 4. Add Dry-Run Mode
**Effort**: 2-3 days
**Impact**: Safe validation before generation

```typescript
function validateConfigGeneration(dryRun = true) {
  // Run through all stages without side effects
  // Return validation report
}
```

#### 5. Optimize Drive Operations
**Effort**: 1 week
**Impact**: Faster generation, lower quota usage

Batch file creation, parallel processing where possible.

### Long-Term Vision (1-2 months)

#### 1. Modular Architecture Refactor
**Goal**: Make each stage independently testable and replaceable

```
src/
├── stages/
│   ├── 00-language-selection/
│   ├── 01-translation/
│   ├── 02-validation/
│   ├── 03-extraction/
│   ├── 04-processing/
│   ├── 05-drive-save/
│   ├── 06-zip-creation/
│   ├── 07-api-submit/
│   └── 08-notification/
├── core/
│   ├── pipeline.ts (orchestrator)
│   ├── errors.ts
│   └── logging.ts
└── utils/
```

#### 2. Plugin System for Processors
**Goal**: Allow custom field types, preset generators, etc.

```typescript
interface FieldProcessor {
  canProcess(data: any): boolean;
  process(data: any): CoMapeoField[];
}

class CustomSelectProcessor implements FieldProcessor {
  canProcess(data: any): boolean {
    return data.type === "customSelect";
  }

  process(data: any): CoMapeoField[] {
    // Custom logic
  }
}

// Register processors
FieldProcessorRegistry.register(new CustomSelectProcessor());
```

#### 3. Offline Mode
**Goal**: Generate configs without external APIs

- Local icon library
- Offline validation
- Skip translation option
- Local packaging (no API required)

#### 4. Advanced UI
**Goal**: Better user experience

- Multi-step wizard
- Live preview of config
- Undo/redo support
- Validation as you type
- Import from other formats (Mapeo Classic, ODK, etc.)

#### 5. Performance Optimization
**Goal**: Sub-30-second generation for typical configs

- Parallel processing where possible
- Caching at every level
- Lazy loading
- Incremental updates (only regenerate changed parts)

#### 6. Observability & Monitoring
**Goal**: Track success rates, identify bottlenecks

- Send telemetry to external service
- Track generation times per stage
- Error rate monitoring
- User analytics (with consent)

---

## Appendix: Quick Reference

### File Structure Map

```
src/
├── generateCoMapeoConfig.ts      Main pipeline orchestrator
├── spreadsheetData.ts            Data extraction (Stage 3)
├── translation.ts                Translation logic (Stage 1)
├── lint.ts                       Validation (Stage 2)
├── driveService.ts               Drive operations (Stage 5, 6)
├── apiService.ts                 API submission (Stage 7)
├── dialog.ts                     UI dialogs (Stage 0, 8)
├── utils.ts                      Shared utilities
├── types.ts                      TypeScript interfaces
├── generateConfig/
│   ├── processFields.ts          Stage 4a
│   ├── processPresets.ts         Stage 4b
│   ├── processMetadata.ts        Stage 4d
│   └── processTranslations.ts    Stage 4e
└── generateIcons/
    ├── iconProcessor.ts          Stage 4c
    └── iconApi.ts                Icon API helpers
```

### External Dependencies

| Dependency | Type | Purpose | URL |
|------------|------|---------|-----|
| Languages JSON | Data | 200+ language definitions | `https://raw.githubusercontent.com/digidem/comapeo-mobile/refs/heads/develop/src/frontend/languages.json` |
| Icon Search API | Service | Search for icons by name | `https://icons.earthdefenderstoolkit.com/api/search` |
| Icon Generate API | Service | Convert PNG → SVG with color | `https://icons.earthdefenderstoolkit.com/api/generate` |
| Packaging API | Service | Package config → .comapeocat | `http://137.184.153.36:3000/` |
| Google Translate | Service | Automatic translation | `LanguageApp.translate()` |

### Google Apps Script APIs Used

- `SpreadsheetApp` - Read/write spreadsheet data
- `DriveApp` - Create folders, save files
- `UrlFetchApp` - HTTP requests to external APIs
- `LanguageApp` - Translation
- `Utilities` - ZIP compression, base64, date formatting
- `PropertiesService` - Persistent configuration storage
- `CacheService` - Temporary caching
- `HtmlService` - UI dialogs

### Common Error Codes

| Error | Likely Cause | Solution |
|-------|-------------|----------|
| "Sheet not found" | Missing required sheet | Check Categories/Details sheets exist |
| "Failed to access Drive folder" | Permissions issue | Check Drive API enabled, re-authorize |
| "API request failed with status 500" | Packaging API error | Check API availability, retry |
| "Translation failed" | LanguageApp quota | Wait for quota reset, reduce languages |
| "Invalid language code" | Wrong language format | Use language code (es) not name (Español) |
| "Missing dataset_id" | Metadata not initialized | Run generation once to create Metadata sheet |
| "Icon API timeout" | Network/API issue | Check internet, icon API availability |

### Performance Benchmarks (Typical Config)

- 10 categories, 20 fields, 2 languages
- Total time: ~45-60 seconds

| Stage | Time | Bottleneck |
|-------|------|------------|
| 0. Language Selection | 2-3s | User action |
| 1. Translation | 10-15s | API calls |
| 2. Validation | 3-5s | Cell operations |
| 3. Data Extraction | 1-2s | - |
| 4. Processing | 15-20s | Icon API |
| 5. Drive Save | 8-10s | File creation |
| 6. ZIP Creation | 2-3s | - |
| 7. API Submit | 5-10s | Network |
| 8. Notification | 1s | - |

**Optimization Targets**:
- Stage 1: Cache translations, parallel API calls → 5-8s
- Stage 4: Cache icons, parallel fetching → 8-10s
- Stage 5: Batch operations → 4-6s
- **Total Target**: 25-35s

---

*Last Updated: 2025-01-08*
*Document Version: 1.0.0*
