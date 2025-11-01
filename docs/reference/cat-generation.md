# Category Generation Process: Complete Implementation Guide

Complete technical documentation of the CoMapeo category generation pipeline, including all four generation modes, step-by-step implementation details, and debugging strategies.

**Last Updated**: 2025-10-31
**Document Version**: 2.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Generation Modes](#generation-modes)
3. [Entry Points & Menu Functions](#entry-points--menu-functions)
4. [8-Step Pipeline](#8-step-pipeline)
5. [Stage-by-Stage Analysis](#stage-by-stage-analysis)
6. [GenerationOptions System](#generationoptions-system)
7. [Error Handling & Recovery](#error-handling--recovery)
8. [Debugging Strategies](#debugging-strategies)
9. [Performance Characteristics](#performance-characteristics)
10. [Critical Issues & Solutions](#critical-issues--solutions)

---

## Overview

The CoMapeo category generation system transforms spreadsheet data into packaged `.comapeocat` configuration files through a sophisticated 8-step pipeline. The system supports four distinct modes, each optimized for different use cases: **translation-only**, **main generation**, **debug mode**, and **in-memory mode**.

### Key Architectural Changes (v2.0)

- **GenerationOptions System**: Configurable via `GenerationOptions` interface
- **Pre-Flight Validation**: Validates BEFORE processing to prevent failures
- **PropertiesService State Management**: Persists state across async callbacks
- **Progress Tracking**: Real-time modal dialog updates during processing
- **Error Isolation**: Icon errors stored separately and shown in report
- **Conditional Steps**: Translation and Drive writes can be skipped based on mode

---

## Generation Modes

### Mode 1: Translation-Only
**Primary Use Case**: Standalone translation without config generation

**Entry Point**: `translateCoMapeoCategory()` → `showSelectTranslationLanguagesDialog()` → `handleLanguageSelection()` → `manageLanguagesAndTranslate()`

**Workflow**:
1. Show language selection dialog (auto-translate + custom languages)
2. Add custom language columns to all translation sheets
3. Auto-translate empty cells using Google Translate API
4. Update spreadsheet with translations
5. Show completion dialog

**No Config Generation**: This mode does NOT create `.comapeocat` files

---

### Mode 2: Main Generation (Production)
**Primary Use Case**: Primary workflow for creating CoMapeo configurations

**Entry Point**: `generateCoMapeoCategory()` → `generateCoMapeoConfig()` → `startCoMapeoGeneration()` → `showSelectTranslationLanguagesDialog()` → `generateCoMapeoConfigWithSelectedLanguages()`

**Workflow**:
1. User confirms generation in menu dialog
2. Store `GenerationOptions` ({skipDriveWrites: false})
3. Show language selection dialog
4. Run full 8-step pipeline
5. Output: `.comapeocat` file in Google Drive

**Characteristics**:
- Includes language selection and auto-translation
- Creates Drive folder structure for ZIP creation
- Full error handling and cleanup
- Production-ready with user notifications

---

### Mode 3: Debug Mode (With Drive Writes)
**Primary Use Case**: Development, troubleshooting, and inspecting intermediate files

**Entry Point**: `generateCoMapeoCategoryDebug()` → `generateCoMapeoConfigWithDriveWrites()` → `generateCoMapeoConfigWithSelectedLanguages([], {skipDriveWrites: false})`

**Workflow**:
1. User confirms debug mode in menu dialog
2. Store `GenerationOptions` ({skipDriveWrites: false})
3. Skip translation (empty language array)
4. Run 8-step pipeline
5. Create `rawBuilds/` folder with individual JSON files
6. Package and send to API
7. Output: Both raw files AND final `.comapeocat`

**Debug Folder Structure**:
```
{spreadsheet-name}/
└── rawBuilds/
    └── {version}/
        ├── presets/
        │   ├── category-1.json
        │   └── category-2.json
        ├── fields/
        │   ├── field-1.json
        │   └── field-2.json
        ├── icons/
        │   ├── icon-1-100px.svg
        │   └── icon-1-24px.svg
        ├── messages/
        │   ├── en.json
        │   └── es.json
        ├── metadata.json
        └── package.json
```

**Use Cases**:
- Inspecting field/preset structure
- Validating icon generation
- Checking translation messages
- Debugging config schema issues
- Comparing versions

---

### Mode 4: In-Memory Mode
**Primary Use Case**: Fast testing, CI/CD pipelines, performance testing

**Entry Point**: `generateCoMapeoConfigInMemory()` → `generateCoMapeoConfigWithSelectedLanguages([], {skipDriveWrites: true})`

**Workflow**:
1. Store `GenerationOptions` ({skipDriveWrites: true})
2. Skip translation (empty language array)
3. Run 8-step pipeline
4. ALL processing in memory (no Drive writes)
5. Create ZIP blob directly from in-memory files
6. Send to API
7. Output: `.comapeocat` file without intermediate Drive storage

**Performance Benefits**:
- 60-70% faster (no Drive I/O)
- No folder cleanup needed
- Ideal for automated testing
- Reduces Google Drive quota usage

**Limitations**:
- Cannot inspect intermediate files
- No fallback if API fails mid-process
- Higher memory usage

---

## Entry Points & Menu Functions

### Menu Structure

**File**: `src/index.ts` - `onOpen()` function

Creates custom menu with localized text from `src/text/menu.ts`:

```typescript
// English menu items
{
  menu: "CoMapeo Tools",
  translateCoMapeoCategory: "Manage Languages & Translate",
  generateIcons: "Generate Category Icons",
  generateCoMapeoCategory: "Generate CoMapeo Category",
  generateCoMapeoCategoryDebug: "Debug: Export Raw Files",
  importCategoryFile: "Import category file",
  lintAllSheets: "Lint Sheets",
  cleanAllSheets: "Reset Spreadsheet",
  openHelpPage: "Help",
}

// Spanish menu items
{
  menu: "Herramientas CoMapeo",
  translateCoMapeoCategory: "Gestionar idiomas y traducir",
  generateIcons: "Generar Íconos para Categorías",
  generateCoMapeoCategory: "Generar Categoría CoMapeo",
  generateCoMapeoCategoryDebug: "Debug: Exportar Archivos Sin Procesar",
  importCategoryFile: "Importar archivo de categoría",
  lintAllSheets: "Validar Planillas",
  cleanAllSheets: "Resetear Planillas",
  openHelpPage: "Ayuda",
}
```

### Function Call Chain

```
┌─────────────────────────────────────────────────────────────┐
│ Menu Function (index.ts)                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Storage: pendingGenerationOptions + PropertiesService      │
│ Purpose: Persist options across async callbacks            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Dialog: showSelectTranslationLanguagesDialog()              │
│ - User selects auto-translate languages                     │
│ - User enters custom language names/ISOs                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Callback: handleLanguageSelection()                         │
│ - Retrieves options from PropertiesService                 │
│ - Calls appropriate workflow based on options              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Main Pipeline: generateCoMapeoConfigWithSelectedLanguages() │
│ - Executes 8-step pipeline                                 │
│ - Returns config URL or throws error                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 8-Step Pipeline

The main generation mode executes this 8-step pipeline:

```
Step 0: Pre-Flight Validation
  └─> Validate spreadsheet structure

Step 1: Initialization
  └─> Lint sheets + Add custom language columns

Step 2: Auto-Translation (Conditional)
  └─> Translate to selected languages

Step 3: Data Extraction
  └─> Read all sheets into SheetData

Step 4: Data Processing (5 sub-stages)
  ├─> Process Fields
  ├─> Process Presets
  ├─> Process Icons
  ├─> Process Metadata
  └─> Process Translations

Step 5: Save to Drive (Conditional)
  └─> Create folder structure or stage in memory

Step 6: ZIP Creation
  └─> Compress files into ZIP blob

Step 7: API Submission
  └─> Send to packaging API, download .comapeocat

Step 8: Completion
  └─> Show success dialog + icon error report
```

### Conditional Execution

| Step | Main Mode | Debug Mode | In-Memory Mode | Translation Mode |
|------|-----------|------------|----------------|------------------|
| 0: Pre-Flight | ✅ | ✅ | ✅ | ❌ |
| 1: Init + Lint | ✅ | ✅ | ✅ | ✅ |
| 2: Auto-Translate | ✅* | ❌ | ❌ | ✅ |
| 3: Data Extraction | ✅ | ✅ | ✅ | ❌ |
| 4: Processing | ✅ | ✅ | ✅ | ❌ |
| 5: Save to Drive | ✅** | ✅ | ❌ | ❌ |
| 6: ZIP Creation | ✅ | ✅ | ✅ | ❌ |
| 7: API Submission | ✅ | ✅ | ✅ | ❌ |
| 8: Completion | ✅ | ✅ | ✅ | ✅ |

*Only if languages selected
**Creates minimal structure for ZIP

---

## Stage-by-Stage Analysis

### Step 0: Pre-Flight Validation

**Function**: `runPreflightChecks()` (line ~187 in `generateCoMapeoConfig.ts`)

**Purpose**: Validate spreadsheet structure BEFORE starting the pipeline

**Checks Performed**:
1. **Sheet Existence**: Verify Categories and Details sheets exist
2. **Required Columns**: Validate column headers match expected structure
3. **Data Integrity**: Check for empty sheets, missing critical data
4. **Permissions**: Verify Drive and Sheets API access

**Implementation**:
```typescript
const preflightResults = runPreflightChecks();

if (!preflightResults.allPassed) {
  const shouldContinue = showPreflightResults(preflightResults);
  if (!shouldContinue) {
    return; // User cancelled
  }
}
```

**User Experience**:
- Shows dialog with summary of issues
- Lists errors vs warnings
- User can choose to:
  - **Cancel**: Stop generation, fix issues manually
  - **Continue**: Proceed despite issues (not recommended)

**Benefits**:
- **Fail Fast**: Catches issues before expensive operations
- **Saves Time**: Prevents running 7 steps before failing
- **User Control**: User decides whether to proceed

---

### Step 1: Initialization

**Functions**:
- `showProcessingModalDialog()` (from `src/dialog.ts`)
- `lintAllSheets(false)` (from `src/lint.ts`)
- `addCustomLanguagesToTranslationSheets()` (from `src/translation.ts`)

**Purpose**: Setup and initial validation

**Actions**:

#### 1.1 Show Processing Dialog
```typescript
showProcessingModalDialog(processingDialogTexts[0][locale]);
```
- Creates modal dialog with CoMapeo branding
- Shows "Initializing..." message
- Will be updated throughout pipeline

#### 1.2 Lint All Sheets
```typescript
lintAllSheets(false); // false = don't show UI alerts
```
- Cleans whitespace-only cells
- Checks for duplicates
- Validates field types and required columns
- Highlights errors with background colors
- **Silent mode**: Errors logged but don't block pipeline

#### 1.3 Add Custom Language Columns
```typescript
if (customLanguages.length > 0) {
  addCustomLanguagesToTranslationSheets(customLanguages);
}
```
- Adds language columns to ALL translation sheets
- Creates columns with proper headers (language names + ISO codes)
- User can specify custom languages not in auto-translate list

**Logging**:
```typescript
log.info("Step 1: Initializing...");
log.debug("Auto-translate languages:", autoTranslateLanguages);
log.debug("Custom languages:", customLanguages);
```

---

### Step 2: Auto-Translation (Conditional)

**Function**: `autoTranslateSheetsBidirectional()` (from `src/translation.ts`)

**Purpose**: Translate empty cells to selected languages

**Trigger Condition**:
```typescript
if (autoTranslateLanguages.length > 0) {
  // Run translation
} else {
  log.info("SKIPPING TRANSLATION - No languages selected");
}
```

**Translation Process**:

1. **For each translation sheet**:
   - `Category Translations`
   - `Detail Label Translations`
   - `Detail Helper Text Translations`
   - `Detail Option Translations`

2. **For each target language**:
   - Find or create column
   - Iterate through rows
   - Skip non-empty cells (preserve manual translations)
   - Translate using `LanguageApp.translate()`

3. **Bidirectional Capability**:
   - Can translate from target language back to source
   - Useful for refining translations

**Google Translate API**:
- Built into Google Apps Script
- No API key required
- Subject to quota limits
- Free for reasonable usage

**Progress Tracking**:
```typescript
showProcessingModalDialog(processingDialogTexts[1][locale]);
const translationStart = Date.now();
autoTranslateSheetsBidirectional(autoTranslateLanguages);
recordTiming("autoTranslateSheetsBidirectional", translationStart);
```

**Performance**:
- **Typical**: 10-15 seconds for 2 languages, 50 fields
- **Bottleneck**: API call latency
- **Optimization**: Skip cells that already have translations

---

### Step 3: Data Extraction

**Function**: `getSpreadsheetData()` (from `src/spreadsheetData.ts:247-263`)

**Purpose**: Read all sheet data into structured object

**Sheet Order**:
1. `Category Translations`
2. `Detail Label Translations`
3. `Detail Helper Text Translations`
4. `Detail Option Translations`
5. `Categories`
6. `Details`

**Reading Method**:
```typescript
for (const sheetName of sheetNames) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  data[sheetName] = values;
}
data.documentName = spreadsheet.getName();
```

**Output Structure**:
```typescript
interface SheetData {
  documentName: string;
  "Categories": (string | number | boolean)[][];
  "Details": (string | number | boolean)[][];
  "Category Translations": (string | number | boolean)[][];
  "Detail Label Translations": (string | number | boolean)[][];
  "Detail Helper Text Translations": (string | number | boolean)[][];
  "Detail Option Translations": (string | number | boolean)[][];
}
```

**Timing**:
- AFTER translation (to include any new columns)
- **Performance**: 1-2 seconds for typical dataset
- Uses single `getDataRange()` call per sheet (efficient)

---

### Step 4: Data Processing

**Function**: `processDataForCoMapeo()` (from `src/generateCoMapeoConfig.ts:352-421`)

**Purpose**: Transform spreadsheet data into CoMapeo configuration

**Validation First**:
```typescript
const sheetValidation = validateSheetData(data);
if (!sheetValidation.valid) {
  throw new Error(sheetValidation.error);
}
```

**5 Sub-Processing Stages**:

#### Stage 4a: Process Fields
**Function**: `processFields()` (from `src/generateConfig/processFields.ts`)

**Input**: `data.Details` (2D array)
**Output**: `CoMapeoField[]`

**Processing**:
```typescript
const fields = processFields(data);
```

**Field Transformation**:
| Spreadsheet Column | CoMapeoField Property |
|--------------------|----------------------|
| A: Label | `label` (display name) |
| A: Label | `tagKey` (slugified ID) |
| B: Helper Text | `helperText` |
| C: Type | `type` (text/number/selectOne/selectMultiple) |
| D: Options | `options[]` (for select fields) |
| F: Universal | `universal` (boolean) |

**Helper Functions** (`src/utils.ts`):
- `slugify()`: "Company Name" → "company-name"
- `getFieldType()`: "Text" → "text", "Multiple" → "selectMultiple"
- `getFieldOptions()`: "Well, Spring, Tank" → `[{label: "Well", value: "well"}, ...]`

---

#### Stage 4b: Process Presets
**Function**: `processPresets()` (from `src/generateConfig/processPresets.ts`)

**Input**:
- `data.Categories` (2D array)
- `categoriesSheet` (for background colors)
- `fields` (to validate field references)

**Output**: `CoMapeoPreset[]`

**Processing**:
```typescript
const presets = processPresets(data, categoriesSheet, fields);
```

**Preset Transformation**:
| Spreadsheet Column | CoMapeoPreset Property |
|--------------------|----------------------|
| A: Name | `name` |
| A: Name | `icon` (slugified) |
| A: Name | `tags` ({"icon-name": "yes"}) |
| A: Name | `sort` (row index) |
| A: Name | `terms` (for search) |
| B: Icon | Icon URL or slug |
| C: Details | `fields[]` (slugified field refs) |
| Cell Background | `color` (hex color) |

**Geometry**:
- **Current**: Always `["point", "line", "area"]` (hardcoded)
- **Issue**: Sheet has geometry column but it's ignored
- **TODO**: Use geometry column value

---

#### Stage 4c: Process Icons
**Function**: `processIcons()` (from `src/generateIcons/iconProcessor.ts`)

**Input**: None (reads Categories sheet directly)
**Output**: `IconProcessingResult`

**Processing Result**:
```typescript
interface IconProcessingResult {
  icons: CoMapeoIcon[];
  errorSummary: IconErrorSummary;
}
```

**Icon Processing Logic**:
1. **Google Drive Icon Exists** → Use existing (URL from column B)
2. **Cell Has Image** → Process via icon API
3. **Empty** → Generate new icon via API

**External APIs**:
- **Search**: `https://icons.earthdefenderstoolkit.com/api/search?s=<query>&l=en`
- **Generate**: `https://icons.earthdefenderstoolkit.com/api/generate?image=<url>&color=<hex>`

**Error Handling**:
- **Retry Logic**: Up to 5 attempts with exponential backoff
- **Fallback Icons**: Generated if API fails
- **Error Reporting**: Stored in PropertiesService for later display

**Icon Error Report**:
```typescript
if (iconResult.errorSummary.errorCount > 0) {
  PropertiesService.getScriptProperties().setProperty(
    "lastIconErrorSummary",
    JSON.stringify(iconResult.errorSummary)
  );
}
```

**User Display**: Step 8 shows icon error dialog with:
- Total processed count
- Success/error/fallback counts
- Grouped errors by type (API, permission, validation)
- Suggested actions for each error
- Option to download CSV report

---

#### Stage 4d: Process Metadata
**Function**: `processMetadata()` (from `src/generateConfig/processMetadata.ts`)

**Input**: `data.documentName`

**Processing**:
```typescript
const { metadata, packageJson } = processMetadata(data);
```

**Metadata Generation**:
| Field | Value |
|-------|-------|
| `dataset_id` | `"comapeo-{slugified-name}"` (persisted in sheet) |
| `name` | `"config-{slugified-name}"` (persisted in sheet) |
| `version` | Current date in `YY.MM.DD` format (always updated) |
| `fileVersion` | `"1.0"` (constant) |
| `buildDate` | ISO 8601 timestamp |

**Special Behavior**:
- Version always updates to current date (even in debug mode)
- Other values persist once set (stored in Metadata sheet)
- Metadata sheet auto-created if missing

**Package.json**:
```json
{
  "name": "config-{slugified-name}",
  "version": "YY.MM.DD",
  "description": "CoMapeo configuration for {readable-name}",
  "comapeo": {
    "dataset_id": "comapeo-{slugified-name}",
    "generated": "YYYY-MM-DDTHH:mm:ss.sssZ"
  }
}
```

---

#### Stage 4e: Process Translations
**Function**: `processTranslations()` (from `src/generateConfig/processTranslations.ts`)

**Input**:
- `data` (all translation sheets)
- `fields` (CoMapeoField[])
- `presets` (CoMapeoPreset[])

**Output**: `CoMapeoTranslations` (messages object)

**Translation Mapping**:
| Sheet | Key Pattern | Example |
|-------|-------------|---------|
| Category Translations | `presets.{icon}.name` | `presets.water-point.name` |
| Detail Label Translations | `fields.{tagKey}.label` | `fields.company-name.label` |
| Detail Helper Text Translations | `fields.{tagKey}.helperText` | `fields.company-name.helperText` |
| Detail Option Translations | `fields.{tagKey}.options.{value}` | `fields.water-type.options.well` |

**Messages Structure**:
```typescript
{
  "es": {
    "presets": {
      "water-point": {
        "name": { message: "Punto de Agua", description: "Water Point" }
      }
    },
    "fields": {
      "company-name": {
        "label": { message: "Empresa", description: "Company" },
        "helperText": { message: "¿Cuál es el nombre de la empresa?", description: "What is the company name?" }
      }
    }
  }
}
```

**CRITICAL BUG**: Index Mismatch
- **Problem**: Assumes translation sheet rows align with fields/presets order
- **Risk**: If sheets have different row counts, mismatched translations
- **Solution**: Match by name/label instead of index
- **Status**: Known issue, not yet fixed

---

### Step 5: Save to Drive (Conditional)

**Function**: `saveConfigToDrive()` (from `src/driveService.ts`)

**Conditional Behavior**:

#### In Debug Mode (`skipDriveWrites: false`)
Creates full folder structure:
```
{spreadsheet-name}/
└── rawBuilds/
    └── {version}/
        ├── presets/{icon}.json
        ├── fields/{tagKey}.json
        ├── icons/{icon}-{size}.svg
        ├── messages/{lang}.json
        ├── metadata.json
        └── package.json
```

#### In Main Mode (`skipDriveWrites: false`)
Creates minimal structure for ZIP:
```
{spreadsheet-name}/
└── rawBuilds/
    └── {version}/
        [files needed for ZIP]
```

#### In In-Memory Mode (`skipDriveWrites: true`)
Skipped entirely - files staged in memory

**Implementation**:
```typescript
const { id, zipBlobs } = saveConfigToDrive(
  config,
  updateProcessingDialogProgress,  // Progress callback
  { skipDriveWrites }
);
```

**Returns**:
- `id`: Folder ID (if Drive writes enabled)
- `zipBlobs`: Array of Blobs (if in-memory mode)

**Progress Updates**:
```typescript
function updateProcessingDialogProgress(main: string, detail?: string) {
  // Updates processing dialog with current stage
  // Called multiple times during Drive operations
}
```

**Cleanup on Failure**:
```typescript
try {
  // ... save to drive
} catch (error) {
  if (createdFolderId) {
    cleanupDriveFolder(createdFolderId); // Delete folder to prevent clutter
  }
  throw error;
}
```

---

### Step 6: ZIP Creation

**Two Paths**:

#### Path A: From Drive Folder (Debug/Main Mode)
**Function**: `saveDriveFolderToZip()` (from `src/driveService.ts`)

**Process**:
1. Get folder by ID
2. Recursively traverse folder tree
3. Create Blob array with path prefixes
4. Use `Utilities.zip(blobs, filename)`

**Implementation**:
```typescript
folderZip = saveDriveFolderToZip(id, updateProcessingDialogProgress, zipBlobs);
```

#### Path B: In-Memory ZIP (In-Memory Mode)
**Function**: Direct `Utilities.zip()` call

**Process**:
1. Use staged blobs from Step 5
2. Copy blobs to avoid mutation
3. ZIP with version-based filename

**Implementation**:
```typescript
folderZip = Utilities.zip(
  (zipBlobs || []).map((blob) => blob.copyBlob()),
  `${slugify(config.metadata.version)}.zip`
);
```

**Output**: `GoogleAppsScript.Base.Blob` (ZIP file)

---

### Step 7: API Submission

**Function**: `sendDataToApiAndGetZip()` (from `src/apiService.ts`)

**Purpose**: Send ZIP to external packaging API

**API Endpoint**: `http://137.184.153.36:3000/`

**Process**:

#### 7.1 Retry Setup
```typescript
const maxRetries = 3;
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  // ... try API call
}
```

#### 7.2 API Call
```typescript
const form = {
  file: folderZip,
  metadata: JSON.stringify(metadata)
};

const response = UrlFetchApp.fetch(apiUrl, {
  method: "post",
  payload: form,
  muteHttpExceptions: true
});
```

#### 7.3 Response Validation
```typescript
// Check status code
if (response.getResponseCode() !== 200) {
  throw new Error(`API returned ${code}`);
}

// Check size (min 10KB)
if (response.getBytes().length < 10000) {
  throw new Error("Response too small");
}

// Check ZIP signature
const bytes = response.getBytes();
if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
  throw new Error("Invalid ZIP signature");
}
```

#### 7.4 Save Result
```typescript
const configUrl = saveZipToDrive(response.getBlob(), metadata.version);
```

**Retry Logic**:
- **Attempts**: 3 total
- **Backoff**: 2^attempt seconds (2s, 4s, 8s)
- **Silent Retries**: User sees progress dialog, not retry dialogs
- **Final Failure**: Shows error dialog with details

**Progress Tracking**:
```typescript
updateProcessingDialogProgress?.(
  "Uploading to API server...",
  `Attempt ${attempt}/${maxRetries}`
);
```

**Critical Issues**:
1. **Hardcoded URL**: Cannot configure endpoint without code change
2. **HTTP not HTTPS**: Security risk
3. **No Health Check**: Sends data before verifying API availability
4. **Single Point of Failure**: No fallback if API is down

---

### Step 8: Completion

**Purpose**: Finalize and notify user

**Actions**:

#### 8.1 Show Icon Error Report
```typescript
const errorSummaryJson = PropertiesService.getScriptProperties()
  .getProperty("lastIconErrorSummary");

if (errorSummaryJson) {
  const errorSummary = JSON.parse(errorSummaryJson);
  if (errorSummary.errorCount > 0) {
    showIconErrorDialog(errorSummary);
  }
  PropertiesService.getScriptProperties()
    .deleteProperty("lastIconErrorSummary");
}
```

**Icon Error Dialog** (from `src/dialog.ts:911-1017`):
- Shows total processed count
- Lists errors by category (API, permission, validation)
- Provides suggested actions
- Option to download CSV report
- "Continue" button to proceed anyway

#### 8.2 Show Success Dialog
```typescript
showConfigurationGeneratedDialog(configUrl);
```

**Success Dialog**:
- CoMapeo branding
- "Configuration Generated" title
- Download link button (opens Google Drive file)
- Instructions for next steps
- Links to documentation

#### 8.3 Clean Up
- Close processing dialog
- Clear pending options from PropertiesService
- Log completion

---

## GenerationOptions System

**Purpose**: Configure generation behavior without code changes

**Interface**:
```typescript
interface GenerationOptions {
  skipDriveWrites?: boolean;
}
```

**Why Needed**: Google Apps Script doesn't preserve global variables across `google.script.run` callbacks

**Solution**: Store in PropertiesService

```typescript
// Store options
const PENDING_OPTIONS_KEY = "pendingGenerationOptions";
PropertiesService.getScriptProperties()
  .setProperty(PENDING_OPTIONS_KEY, JSON.stringify(options));

// Retrieve options
const optionsJson = PropertiesService.getScriptProperties()
  .getProperty(PENDING_OPTIONS_KEY);
const options = JSON.parse(optionsJson);

// Clear after use
PropertiesService.getScriptProperties()
  .deleteProperty(PENDING_OPTIONS_KEY);
```

**Options**:

| Option | Type | Default | Effect |
|--------|------|---------|--------|
| `skipDriveWrites` | boolean | false | Skip Drive folder creation (in-memory mode) |

**Usage**:
```typescript
// Main mode
startCoMapeoGeneration({ skipDriveWrites: false });

// In-memory mode
generateCoMapeoConfigInMemory();
// Sets { skipDriveWrites: true }

// Debug mode
generateCoMapeoConfigWithDriveWrites();
// Sets { skipDriveWrites: false }
```

---

## Error Handling & Recovery

### Try-Catch Strategy

Each major step is wrapped in try-catch:

```typescript
try {
  // Step 1: Initialize
  showProcessingModalDialog(...);
  lintAllSheets(false);
  addCustomLanguagesToTranslationSheets(...);

  // Step 2: Auto-translate
  autoTranslateSheetsBidirectional(...);

  // ... other steps

} catch (error) {
  // Cleanup: Delete created folder
  if (createdFolderId) {
    cleanupDriveFolder(createdFolderId);
  }

  // Log error
  log.error("Error generating CoMapeo config", error);

  // Show error dialog
  showErrorDialog(error.message);
}
```

### Error Types & Handling

#### 1. Validation Errors
- **When**: Pre-flight checks or sheet validation
- **User Action**: Fix spreadsheet issues, retry
- **Recovery**: User can cancel and fix, or continue

#### 2. API Errors
- **When**: Icon API or Packaging API failures
- **Recovery**: Automatic retry with backoff
- **User Impact**: Longer wait times, may see timeout

#### 3. Drive Errors
- **When**: Folder creation, file save, ZIP creation
- **Cleanup**: `cleanupDriveFolder()` deletes partial results
- **Prevention**: Check permissions before starting

#### 4. Translation Errors
- **When**: LanguageApp quota exceeded, invalid language
- **Behavior**: Skip failed translations, log warning
- **User Impact**: Some translations may be missing

### Error Logging

**System**: `getScopedLogger()` from `src/loggingHelpers.ts`

**Log Levels**:
- `log.info()`: High-level pipeline events
- `log.debug()`: Detailed processing info
- `log.warn()`: Non-fatal issues
- `log.error()`: Fatal errors

**Timing Logs**:
```typescript
const start = Date.now();
// ... operation ...
recordTiming("operationName", start);
// Logs: "[TIMING] operationName took 1234ms"
```

### Icon Error Reporting

**Storage**: PropertiesService as JSON

**Structure**:
```typescript
interface IconErrorSummary {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  fallbackCount: number;
  hasCriticalErrors: boolean;
  errorsByType: Map<ErrorType, IconError[]>;
}

type ErrorType = "format" | "permission" | "api" | "drive" | "validation" | "network" | "timeout" | "unknown";
```

**Display** (Step 8):
- Grouped by error type
- Shows first 5 errors per type
- "Show more" for remaining
- Suggested action for each error
- Download CSV option

---

## Debugging Strategies

### 1. Use Debug Mode

**For**: Inspecting intermediate files, validation issues

```typescript
// Menu: Debug: Export Raw Files
// OR run manually:
generateCoMapeoCategoryDebug();
```

**Benefits**:
- Individual JSON files for each component
- Can inspect structure before ZIP
- Compare with expected format
- Validate field/preset relationships

**Inspection Points**:
- `rawBuilds/{version}/fields/` - Field definitions
- `rawBuilds/{version}/presets/` - Category definitions
- `rawBuilds/{version}/messages/` - Translation messages
- `metadata.json` - Package metadata

### 2. Check Console Logs

**Enable**: Apps Script Editor → Executions

**Key Log Patterns**:
```
[ConfigGeneration] Starting CoMapeo generation with options: {...}
[ConfigGeneration] Step 1: Initializing...
[ConfigGeneration] Linting sheets...
[ConfigGeneration] Translation process completed
[ConfigGeneration] Reading spreadsheet data...
[ConfigGeneration] Processing CoMapeo data...
[ConfigGeneration] Done processing 15 fields
[ConfigGeneration] Done processing 8 presets
[ConfigGeneration] Done processing 8 icons
[TIMING] processDataForCoMapeo took 15234ms
```

### 3. Test Individual Functions

**Test Data Extraction**:
```typescript
function testDataExtraction() {
  const data = getSpreadsheetData();
  console.log("Sheets:", Object.keys(data));
  console.log("Categories:", data.Categories.length);
  console.log("Details:", data.Details.length);
}
```

**Test Processing**:
```typescript
function testProcessing() {
  const data = getSpreadsheetData();
  const config = processDataForCoMapeo(data);
  console.log("Fields:", config.fields.length);
  console.log("Presets:", config.presets.length);
  console.log("Icons:", config.icons.length);

  // Save to PropertiesService for inspection
  PropertiesService.getScriptProperties()
    .setProperty('test_config', JSON.stringify(config));
}
```

**Test Icon Processing**:
```typescript
function testIcons() {
  const result = processIcons();
  console.log("Icons:", result.icons.length);
  console.log("Errors:", result.errorSummary.errorCount);
}
```

### 4. Validate at Each Stage

**Pre-Flight Checks**:
```typescript
function testValidation() {
  const results = runPreflightChecks();
  console.log("Passed:", results.allPassed);
  console.log("Errors:", results.errors);
  console.log("Warnings:", results.warnings);
}
```

**Sheet Validation**:
```typescript
function testSheetValidation() {
  const data = getSpreadsheetData();
  const validation = validateSheetData(data);
  if (!validation.valid) {
    console.error("Validation failed:", validation.error);
  }
  if (validation.warnings) {
    console.warn("Warnings:", validation.warnings);
  }
}
```

### 5. Compare Configs

**Generate Debug Config**:
```typescript
generateCoMapeoCategoryDebug();
```

**Compare Files**:
1. Open `rawBuilds/{version}/`
2. Compare `presets.json` vs individual files
3. Check `messages/` structure
4. Verify icon references

### 6. Script Properties Inspection

**Store Test Data**:
```typescript
// During testing
PropertiesService.getScriptProperties()
  .setProperty('test_data', JSON.stringify(data));

// Retrieve
const testData = PropertiesService.getScriptProperties()
  .getProperty('test_data');
```

**Common Properties**:
- `pendingGenerationOptions` - Current generation options
- `lastIconErrorSummary` - Icon processing errors
- `test_config` - Last generated config (for inspection)

---

## Performance Characteristics

### Typical Timing (10 categories, 20 fields, 2 languages)

| Step | Time | Bottleneck | Optimization Potential |
|------|------|------------|------------------------|
| 0: Pre-Flight | 1-2s | - | - |
| 1: Initialization | 3-5s | Lint operations | Medium (batch operations) |
| 2: Translation | 10-15s | LanguageApp API | High (caching) |
| 3: Data Extraction | 1-2s | - | - |
| 4: Processing | 15-20s | Icon API | High (caching, parallel) |
| 5: Drive Save | 8-10s | Drive operations | High (batching) |
| 6: ZIP Creation | 2-3s | - | - |
| 7: API Submit | 5-10s | Network | Medium (health check) |
| 8: Completion | 1s | - | - |
| **Total** | **45-60s** | **Icon API** | **Target: 25-35s** |

### Optimization Targets

#### Stage 2: Translation
- **Current**: 10-15s
- **Target**: 5-8s
- **Strategy**:
  - Cache translations (CacheService)
  - Parallel API calls
  - Skip if nothing to translate

#### Stage 4: Processing
- **Current**: 15-20s
- **Target**: 8-10s
- **Strategy**:
  - Cache icon API results (6-hour TTL)
  - Parallel icon fetching
  - Reduce API calls

#### Stage 5: Drive Operations
- **Current**: 8-10s
- **Target**: 4-6s
- **Strategy**:
  - Batch file creation
  - Use `Utilities.createFile()` instead of DriveApp
  - Reduce file count

### Memory Usage

**In-Memory Mode**:
- Higher memory during processing
- Lower disk I/O
- Faster overall

**Debug/Main Mode**:
- Lower memory footprint
- Higher disk I/O
- Slower but more inspectable

**Google Apps Script Limits**:
- **Total execution time**: 6 minutes (360s)
- **Memory**: Shared among all executions
- **Drive operations**: Quota limits apply

---

## Critical Issues & Solutions

### Issue 1: Icon API Infinite Loop
**Location**: `src/generateIcons/iconProcessor.ts:242-249`

**Problem**:
```typescript
while (!searchData) {
  console.log(`Retrying search for ${preset.name}`);
  searchData = findValidSearchData(searchParams);
}
```
Loops forever if API is unavailable.

**Impact**: Script timeout, user frustration

**Solution**:
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

**Status**: Known issue, needs implementation

---

### Issue 2: Translation Index Mismatch
**Location**: `src/generateConfig/processTranslations.ts:32-122`

**Problem**: Assumes translation sheets have same row count as fields/presets

**Example**:
```typescript
// Current (broken) - uses index
for (let i = 0; i < fields.length; i++) {
  const field = fields[i];
  const translation = translations[i]; // WRONG if rows don't align
  // ...
}
```

**Impact**: Wrong translations mapped to fields/presets

**Solution**: Match by name/label
```typescript
// Build map from primary language column
const translationMap = new Map();
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

**Status**: Known issue, needs implementation

---

### Issue 3: Hardcoded API URL
**Location**: `src/apiService.ts:38`

**Problem**: No way to change API endpoint without code change

```typescript
const API_URL = "http://137.184.153.36:3000/";
```

**Impact**: Cannot use different endpoints (dev, staging, production)

**Solution**: Check PropertiesService first
```typescript
function getAPIUrl(): string {
  const customUrl = PropertiesService.getScriptProperties()
    .getProperty('COMAPEO_API_URL');

  if (customUrl) {
    return customUrl;
  }

  return "http://137.184.153.36:3000/";
}
```

**Menu Option to Configure**:
```typescript
function showAPIConfigDialog() {
  const current = getAPIUrl();
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    "Configure API URL",
    `Current URL: ${current}\n\nEnter new URL:`,
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const newUrl = response.getResponseText().trim();
    PropertiesService.getScriptProperties()
      .setProperty('COMAPEO_API_URL', newUrl);
  }
}
```

**Status**: Known issue, needs implementation

---

### Issue 4: No API Health Check
**Location**: `src/apiService.ts` (before `sendDataToApiAndGetZip`)

**Problem**: Sends ZIP before verifying API is available

**Impact**: Waste time on failed uploads, poor user experience

**Solution**: Health check before submission
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
    return false;
  }
}

function sendDataToApiAndGetZip(...) {
  const apiUrl = getAPIUrl();

  if (!checkAPIHealth(apiUrl)) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      "API Unavailable",
      "The packaging API is currently unavailable. Save raw config instead?",
      ui.ButtonSet.YES_NO
    );

    if (response === ui.Button.YES) {
      return saveZipToDrive(zipFile, metadata.version);
    } else {
      throw new Error("API unavailable and user declined fallback");
    }
  }

  // ... rest of function
}
```

**Status**: Known issue, needs implementation

---

### Issue 5: Geometry Column Ignored
**Location**: `src/generateConfig/processPresets.ts`

**Problem**: Categories sheet has geometry column but it's hardcoded

```typescript
// Current (hardcoded)
geometry: ["point", "line", "area"]
```

**Should be**:
```typescript
// Use sheet column D
const geometryValue = category[3];
const geometry = geometryValue ? [geometryValue] : ["point", "line", "area"];
```

**Impact**: Users can't control geometry types

**Status**: Known issue, needs implementation

---

### Issue 6: No Version Control
**Location**: `src/generateConfig/processMetadata.ts`

**Problem**: Version always auto-updates to current date

```typescript
version: formatDate(new Date()) // Always changes
```

**Impact**: Can't maintain semantic versions, hard to track changes

**Solution**: Allow user to specify version or keep existing
```typescript
// Check Metadata sheet for existing version
const existingVersion = getMetadataValue("version");
if (existingVersion && !forceUpdate) {
  version = existingVersion;
} else {
  version = formatDate(new Date());
}
```

**Menu Option**: "Keep existing version" checkbox

**Status**: Known issue, needs implementation

---

## Appendix

### File Structure Map

```
src/
├── generateCoMapeoConfig.ts      Main pipeline orchestrator
├── spreadsheetData.ts            Data extraction (Step 3)
├── translation.ts                Translation logic (Step 2)
├── lint.ts                       Validation (Step 1)
├── driveService.ts               Drive operations (Step 5, 6)
├── apiService.ts                 API submission (Step 7)
├── dialog.ts                     UI dialogs (all steps)
├── validation.ts                 Pre-flight & schema validation
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

| Dependency | URL | Purpose |
|------------|-----|---------|
| Languages JSON | `https://raw.githubusercontent.com/digidem/comapeo-mobile/develop/src/frontend/languages.json` | 200+ language definitions |
| Icon Search API | `https://icons.earthdefenderstoolkit.com/api/search` | Search icons by name |
| Icon Generate API | `https://icons.earthdefenderstoolkit.com/api/generate` | Convert PNG→SVG with color |
| Packaging API | `http://137.184.153.36:3000/` | Package config → .comapeocat |
| Google Translate | `LanguageApp.translate()` | Automatic translation |

### Google Apps Script APIs Used

- `SpreadsheetApp` - Read/write spreadsheet data
- `DriveApp` - Create folders, save files
- `UrlFetchApp` - HTTP requests to external APIs
- `LanguageApp` - Translation
- `Utilities` - ZIP compression, base64, date formatting
- `PropertiesService` - Persistent configuration storage
- `CacheService` - Temporary caching (for icons)
- `HtmlService` - UI dialogs
- `Logger` - Logging and timing

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Sheet not found" | Missing Categories/Details | Check sheet names |
| "Failed to access Drive folder" | Permissions issue | Re-authorize script |
| "API request failed with status 500" | Packaging API error | Retry or check API status |
| "Translation failed" | LanguageApp quota | Wait or reduce languages |
| "Invalid language code" | Wrong language format | Use ISO code (es not Español) |
| "Missing dataset_id" | Metadata not initialized | Run generation once |
| "Icon API timeout" | Network/API issue | Check internet, try again |
| "ZIP validation failed" | Corrupted or empty ZIP | Check Drive folder contents |

### Performance Benchmarks

**Test Configuration**:
- 10 categories
- 20 fields
- 2 languages (English, Spanish)
- 8 icons

**Timing Breakdown**:
```
Step 0: Pre-Flight        1.2s
Step 1: Initialization    4.1s
Step 2: Translation       12.3s
Step 3: Data Extraction   1.5s
Step 4: Processing        17.8s
  └─ Icons               15.2s
Step 5: Drive Save        9.3s
Step 6: ZIP Creation      2.7s
Step 7: API Submit        7.4s
Step 8: Completion        0.8s
─────────────────────────────
Total                     57.1s
```

**Optimization Potential**:
- Icon caching → Save 10-12s
- Parallel icon fetching → Save 5-8s
- Drive operation batching → Save 4-6s
- **Target**: 30-35s (40% improvement)

---

*End of Document*
