# .comapeocat File Format Documentation

## Overview

`.comapeocat` files are **ZIP archives** (not TAR) containing CoMapeo configuration data. This format is similar to `.mapeosettings` but uses a different archive format and file organization.

**v2 build flow**: The plugin sends a JSON build request to the API (`/v2`), and the API returns the packaged `.comapeocat` ZIP. The plugin does not package configs locally, but it does create a shareable `.zip` of the returned file.

**Test File**: `src/test/generated-config.comapeocat`
- **Archive Format**: ZIP (PKZIP, uncompressed/store method)
- **Total Files**: 197 files (7 JSON files + VERSION + 189 PNG icons)
- **Icon Count**: 21 unique icons × 9 variants each (3 sizes × 3 resolutions)

## Complete Directory Structure

```
generated-config.comapeocat (ZIP archive)
├── config.json          # Complete merged configuration (61KB)
├── metadata.json        # Package metadata (203 bytes)
├── presets.json        # Preset definitions only (6.6KB)
├── fields.json         # Field definitions only (25KB)
├── translations.json   # Translation messages (20KB)
├── icons.json          # Icon sprite metadata (2.4KB)
├── VERSION             # Version string (1 byte)
└── icons/              # Individual PNG icons (189 files)
    ├── abelha-small@1x.png      (349 bytes)
    ├── abelha-small@2x.png      (658 bytes)
    ├── abelha-small@3x.png      (987 bytes)
    ├── abelha-medium@1x.png     (658 bytes)
    ├── abelha-medium@2x.png     (1.3KB)
    ├── abelha-medium@3x.png     (1.9KB)
    ├── abelha-large@1x.png      (1KB)
    ├── abelha-large@2x.png      (2.2KB)
    ├── abelha-large@3x.png      (3.4KB)
    ├── aldeia-small@1x.png
    ├── aldeia-small@2x.png
    ├── aldeia-small@3x.png
    └── ... (18 more icons × 9 variants each)
```

## Key Differences from .mapeosettings

| Aspect | .mapeosettings | .comapeocat |
|--------|----------------|-------------|
| **Archive Format** | TAR (POSIX tar, gzip) | ZIP (PKZIP, store) |
| **Extraction Method** | Manual TAR parsing | `Utilities.unzip()` |
| **File Organization** | Separate files | Includes `config.json` with merged data |
| **Icon Files** | May have `icons.svg` sprite | Always has individual PNGs |
| **Field Data** | In `presets.json` | Separate `fields.json` |
| **File Count** | ~10-30 files | 197 files (many icons) |

## File Descriptions

### config.json (Complete Configuration)

**Size**: 61,375 bytes (largest file)

**Purpose**: Merged/flattened configuration containing all data in one place

**Structure**:
```json
{
  "metadata": {
    "dataset_id": "comapeo-tumucumaque-categorias-comapeo",
    "name": "config-tumucumaque-categorias-comapeo",
    "version": "25.04.10",
    "fileVersion": "1.0",
    "buildDate": "2025-04-10T20:03:17.464Z"
  },
  "fields": {
    "field-id": {
      "tagKey": "field-id",
      "type": "selectMultiple|selectOne|text",
      "label": "Field Label",
      "helperText": "Helper text",
      "universal": false,
      "options": [...]
    }
  },
  "presets": {
    "preset-id": {
      "name": "Preset Name",
      "tags": { "preset-id": "yes" },
      "color": "#b6d7a8",
      "icon": "icon-name",
      "fields": ["field-id1", "field-id2"],
      "removeTags": {},
      "addTags": {},
      "geometry": ["point", "line", "area"]
    }
  },
  "translations": {
    "lang-code": {
      "presets": {
        "preset-id": {
          "name": "Translated Name"
        }
      },
      "fields": {
        "field-id": {
          "label": "Translated Label",
          "helperText": "Translated helper"
        }
      },
      "categories": {}
    }
  }
}
```

**Note**: This file contains the same data as the separate JSON files, just merged together.

### metadata.json

**Size**: 203 bytes

**Structure**:
```json
{
  "dataset_id": "comapeo-tumucumaque-categorias-comapeo",
  "name": "config-tumucumaque-categorias-comapeo",
  "version": "25.04.10",
  "fileVersion": "1.0",
  "buildDate": "2025-04-10T20:03:17.464Z"
}
```

**Fields**:
- `dataset_id`: Unique identifier
- `name`: Human-readable package name
- `version`: Package version (date format YY.MM.DD)
- `fileVersion`: Configuration format version
- `buildDate`: ISO 8601 timestamp

### presets.json

**Size**: 6,613 bytes

**Purpose**: Preset (category) definitions only

**Structure**: Same as `config.json.presets`

### fields.json

**Size**: 25,636 bytes

**Purpose**: Field definitions separate from presets

**Structure**: Same as `config.json.fields`

**Note**: In `.mapeosettings`, fields are often included in `presets.json`

### translations.json

**Size**: 20,770 bytes

**Purpose**: Translation messages for all supported languages

**Structure**: Same as `config.json.translations`

**Languages in test file**: `api`, `en` (Apalaí and English)

### icons.json

**Size**: 2,415 bytes

**Purpose**: Icon sprite metadata (if PNG sprite sheet is used)

**Structure**:
```json
{
  "icon-name-size": {
    "width": 100,
    "height": 100,
    "x": 0,
    "y": 0,
    "pixelRatio": 1
  }
}
```

**Note**: In this test file, individual PNGs are used instead of a sprite sheet.

### icons/ Directory (189 PNG Files)

**Purpose**: Individual pre-rendered icon files at multiple sizes and resolutions

**Naming Convention**: `{icon-name}-{size}@{resolution}.png`

**Icon Names** (21 unique icons in test file):
- abelha, aldeia, caa, estrutura, invaso, local-de-desova, local-de-argila
- local-perigoso, lugar-historico, paisagem, planta-para-comer
- planta-para-artesanato, ponto-de-lixo, planta-para-talhar, pesca
- planta-para-construo, remdio-tradicional, recursos-hdricos
- porto, vestgios-de-isolado, roa

**Sizes**:
- `small`: Smallest variant (~250-750 bytes per file)
- `medium`: Medium variant (~600-2000 bytes per file)
- `large`: Largest variant (~1000-7000 bytes per file)

**Resolutions**:
- `1x`: Standard DPI (~72-96 DPI)
- `2x`: Retina/High-DPI (~144-192 DPI)
- `3x`: Ultra-High-DPI (~216-288 DPI)

**Total Variants**: 21 icons × 3 sizes × 3 resolutions = **189 PNG files**

## Import Strategy for .comapeocat Files

### Extraction Process

1. **Detect Format**: Check if file is ZIP (use `Utilities.unzip()`)
2. **Extract All Files**: Unzip extracts all 197 files
3. **Locate icons/ Directory**: Find nested `icons/` folder in extracted files
4. **Index Files**: Build Map of all icon files for fast O(1) lookup (critical for 189 files!)
5. **Extract Icons**: Use indexed lookup to find best size/resolution for each preset

### Performance Considerations

**Problem**: With 189 icon files, repeated `getFilesByName()` calls are extremely slow
- Each preset needs to find its icon from 189 files
- Worst case: 21 presets × 9 attempts (3 sizes × 3 resolutions) = 189 searches
- Each search is O(n) where n=189 files

**Solution**: Build file index once
```typescript
// O(n) once: Index all files
const fileIndex = new Map<string, File>();
const files = iconsFolder.getFiles();
while (files.hasNext()) {
  const file = files.next();
  fileIndex.set(file.getName(), file);
}

// O(1) lookup per icon
if (fileIndex.has(iconFileName)) {
  const file = fileIndex.get(iconFileName);
}
```

**Performance Gain**:
- Before: O(n × m) = O(189 × 21) = ~4,000 operations
- After: O(n + m) = O(189 + 21) = ~210 operations
- **~19x faster**

### Priority Order for Icon Selection

When multiple variants exist, prefer:
1. **medium@1x** (good balance of size/quality)
2. **small@1x** (fallback if medium not available)
3. **large@1x** (fallback if both unavailable)
4. Then try @2x and @3x resolutions

### Progress Logging

With 189 files and 21 icons, provide progress updates:
```
Indexing icon files for fast lookup...
Indexed 189 files. Starting icon extraction...
Extracting icons: 5/21 (24%)
Extracting icons: 10/21 (48%)
Extracting icons: 15/21 (71%)
Extracting icons: 20/21 (95%)
Extracting icons: 21/21 (100%)
Successfully extracted 21 PNG icons to permanent folder
```

## Compatibility with .mapeosettings

Both formats are supported by the import system:

| Feature | .mapeosettings | .comapeocat | Implementation |
|---------|----------------|-------------|----------------|
| Archive extraction | Custom TAR parser | `Utilities.unzip()` | `fileExtractor.ts` |
| Icon format | SVG sprite or PNGs | Individual PNGs | `extractPngIcons.ts` |
| File parsing | Parse separate files | Can use `config.json` | `parseFiles.ts` |
| Icon lookup | Map-based index | Map-based index | Both use same optimization |

## Testing Checklist

- [ ] Import `.comapeocat` file with 189 PNG icons
- [ ] Verify icon indexing completes quickly (<5 seconds)
- [ ] Check console logs show progress indicators
- [ ] Verify 21 icons extracted to permanent folder
- [ ] Confirm icon URLs work in Categories sheet
- [ ] Test that temp folder cleanup doesn't break icons
- [ ] Verify extraction completes in reasonable time (~30-60 seconds total)

## Related Files

- `src/importCategory/fileExtractor.ts` - ZIP extraction with `Utilities.unzip()`
- `src/importCategory/extractPngIcons.ts` - Optimized PNG extraction with file indexing
- `src/importCategory/parseFiles.ts` - Handles both `config.json` and separate files
- `src/test/generated-config.comapeocat` - Test file with 189 PNG icons
