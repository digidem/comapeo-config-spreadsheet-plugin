# Dependencies Documentation

**Last Updated**: 2025-10-12

Complete documentation of module dependencies, data flow patterns, and external dependencies for the CoMapeo Config Spreadsheet Plugin.

## Table of Contents

1. [External Dependencies](#external-dependencies)
2. [Module Organization](#module-organization)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Module Dependency Graph](#module-dependency-graph)
5. [Critical Dependencies](#critical-dependencies)

---

## External Dependencies

### NPM Development Dependencies

```json
{
  "@types/bun": "latest",
  "@types/google-apps-script": "^1.0.91",
  "biome": "^0.3.3",
  "typescript": "^5.7.3"
}
```

**Purpose**:
- **@types/bun**: TypeScript type definitions for Bun runtime (development only)
- **@types/google-apps-script**: TypeScript type definitions for Google Apps Script APIs
- **biome**: Fast linter and formatter for JavaScript/TypeScript
- **typescript**: TypeScript compiler for type checking and compilation

### Google Apps Script Runtime Dependencies

These are built-in APIs provided by Google Apps Script runtime:

- **SpreadsheetApp**: Spreadsheet manipulation API
  - Used in: All core modules, processing modules, import modules
  - Primary operations: Read/write cells, create sheets, format ranges

- **DriveApp**: Google Drive file operations API
  - Used in: `driveService.ts`, `importCategory/extractTarFile.ts`
  - Primary operations: Create folders, save files, manage ZIP archives

- **UrlFetchApp**: HTTP request API
  - Used in: `apiService.ts`, `iconApi.ts`, `spreadsheetData.ts`
  - Primary operations: Fetch icons, call external API, download language data

- **LanguageApp**: Translation API
  - Used in: `translation.ts`
  - Primary operations: Translate text between languages using Google Translate

- **Utilities**: Utility functions API
  - Used in: `driveService.ts`, `apiService.ts`, `generateConfig/processMetadata.ts`
  - Primary operations: Create ZIP files, sleep/retry logic, date formatting

- **PropertiesService**: Persistent storage API
  - Used in: `apiService.ts`
  - Primary operations: Store and retrieve API URL configuration

- **CacheService**: Caching API
  - Used in: `spreadsheetData.ts`
  - Primary operations: Cache language data to reduce API calls

- **Logger**: Logging API
  - Used in: `apiService.ts`, `spreadsheetData.ts`
  - Primary operations: Log information for debugging

### External HTTP APIs

- **Icon API**: `http://137.184.153.36:3000/icons/` (configurable)
  - Used in: `generateIcons/iconApi.ts`
  - Purpose: Fetch SVG icons for categories
  - Retry logic: 3 attempts with exponential backoff

- **CoMapeo Build API**: `http://137.184.153.36:3000/` (configurable)
  - Used in: `apiService.ts`
  - Purpose: Convert ZIP to final .comapeocat package
  - Retry logic: 3 attempts with exponential backoff

- **GitHub Languages API**: `https://unpkg.com/@cospired/i18n-iso-languages@4.3.0/langs/en.json`
  - Used in: `spreadsheetData.ts`
  - Purpose: Fetch comprehensive language list
  - Caching: 6-hour TTL in CacheService

---

## Module Organization

### Core Modules (Entry Points)

#### `generateCoMapeoConfig.ts`
**Purpose**: Main entry point for config generation workflow

**Dependencies**:
- `spreadsheetData.ts`: Get spreadsheet data
- `generateConfig/processMetadata.ts`: Generate metadata
- `generateConfig/processFields.ts`: Process field definitions
- `generateConfig/processPresets.ts`: Process category definitions
- `generateConfig/processTranslations.ts`: Process translations
- `driveService.ts`: Save config to Drive and create ZIP
- `apiService.ts`: Send ZIP to API for final packaging
- `dialog.ts`: Show progress and results
- `translation.ts`: Auto-translate sheets
- `validation.ts`: Validate configuration
- `logger.ts`: Logging
- `utils.ts`: Utility functions

**Data Flow**: Orchestrator → Processors → Drive → API → User

---

#### `importCategory.ts`
**Purpose**: Main entry point for importing .comapeocat files

**Dependencies**:
- `importCategory/extractTarFile.ts`: Extract tar archive
- `importCategory/parseFiles.ts`: Parse JSON config files
- `importCategory/parseIconSprite.ts`: Extract SVG icons from sprite
- `importCategory/applyConfiguration.ts`: Main orchestrator for applying config
- `importCategory/importProgressHandler.ts`: Progress reporting
- `importDropzone.ts`: File upload UI
- `dialog.ts`: Show progress and results
- `logger.ts`: Logging

**Data Flow**: Upload → Extract → Parse → Apply → User

---

#### `icons.ts`
**Purpose**: Generate and save category icons

**Dependencies**:
- `generateIcons/iconProcessor.ts`: Process and optimize icons
- `spreadsheetData.ts`: Get category names
- `driveService.ts`: Get config folder
- `dialog.ts`: Show success dialog
- `utils.ts`: Utility functions (slugify)

**Data Flow**: Categories → Icon API → Process → Drive → User

---

#### `translation.ts`
**Purpose**: Manage translation workflows

**Dependencies**:
- `spreadsheetData.ts`: Get language data and primary language
- Google LanguageApp: Translate text
- `logger.ts`: Logging (implicit via console.log)

**Data Flow**: Source Text → Google Translate → Target Cells

---

#### `lint.ts`
**Purpose**: Validate spreadsheet data and highlight errors

**Dependencies**:
- `spreadsheetData.ts`: Get spreadsheet data
- `validation.ts`: Validation functions
- `dialog.ts`: Show validation results
- `logger.ts`: Logging

**Data Flow**: Sheets → Validate → Highlight Errors → User

---

#### `cleanup.ts`
**Purpose**: Clean up spreadsheet data and Drive folders

**Dependencies**:
- `spreadsheetData.ts`: Get spreadsheet data
- `driveService.ts`: Get config folder
- `dialog.ts`: Show cleanup results
- `logger.ts`: Logging

**Data Flow**: Sheets/Drive → Clean → Report → User

---

### Processing Modules

#### `generateConfig/processMetadata.ts`
**Purpose**: Generate metadata and package.json

**Dependencies**:
- `utils.ts`: slugify()
- Google Utilities: Date formatting

**Called By**: `generateCoMapeoConfig.ts`

---

#### `generateConfig/processFields.ts`
**Purpose**: Convert spreadsheet fields to CoMapeo field format

**Dependencies**:
- `utils.ts`: slugify(), getFieldType(), getFieldOptions()
- `validation.ts`: validateFieldDefinition()

**Called By**: `generateCoMapeoConfig.ts`

---

#### `generateConfig/processPresets.ts`
**Purpose**: Convert spreadsheet categories to CoMapeo preset format

**Dependencies**:
- `utils.ts`: slugify()
- `validation.ts`: validateCategoryDefinition()

**Called By**: `generateCoMapeoConfig.ts`

---

#### `generateConfig/processTranslations.ts`
**Purpose**: Aggregate translations from all translation sheets

**Dependencies**:
- `spreadsheetData.ts`: getPrimaryLanguage(), getAllLanguages(), sheets()
- `utils.ts`: getFieldType()
- `logger.ts`: Logging (implicit via console.log)

**Called By**: `generateCoMapeoConfig.ts`

---

### Import System Modules

#### `importCategory/applyConfiguration.ts`
**Purpose**: Main orchestrator for applying imported config to spreadsheet

**Dependencies**:
- `importCategory/applyMetadata.ts`: Apply metadata
- `importCategory/applyCategories.ts`: Apply categories
- `importCategory/applyFields.ts`: Apply fields
- `importCategory/applyTranslations.ts`: Apply translations
- `importCategory/clearValidations.ts`: Clear existing validations
- `importCategory/addDetailsDropdown.ts`: Add field type dropdowns
- `importCategory/debugLogger.ts`: Debug logging
- `importCategory/importProgressHandler.ts`: Progress reporting
- `utils.ts`: Utility functions

**Called By**: `importCategory.ts`

---

#### `importCategory/extractTarFile.ts`
**Purpose**: Extract tar archive to Google Drive temp folder

**Dependencies**:
- Google DriveApp: Create folders, save files
- `importCategory/debugLogger.ts`: Debug logging
- `utils.ts`: slugify()

**Called By**: `importCategory.ts`

---

#### `importCategory/parseFiles.ts`
**Purpose**: Parse JSON config files and extract data structures

**Dependencies**:
- Google DriveApp: Read files
- `importCategory/debugLogger.ts`: Debug logging
- `types.ts`: Type definitions

**Called By**: `importCategory.ts`

---

#### `importCategory/parseIconSprite.ts`
**Purpose**: Extract individual SVG icons from icon sprite

**Dependencies**:
- Google DriveApp: Read sprite file, save individual icons
- `importCategory/debugLogger.ts`: Debug logging

**Called By**: `importCategory.ts`

---

### Validation & Utility Modules

#### `validation.ts`
**Purpose**: Comprehensive input validation system

**Dependencies**:
- `spreadsheetData.ts`: getAllLanguages()
- `utils.ts`: getFieldType()

**Called By**:
- `generateConfig/processFields.ts`: Field validation
- `generateConfig/processPresets.ts`: Category validation
- `spreadsheetData.ts`: Language validation
- `lint.ts`: Sheet validation

---

#### `logger.ts`
**Purpose**: Centralized logging system with log levels

**Dependencies**: None (standalone utility)

**Called By**: All modules (via Logger.scope())

---

#### `utils.ts`
**Purpose**: Shared utility functions

**Dependencies**: None (standalone utility)

**Called By**: All modules
- **slugify()**: URL-safe string conversion
- **getFieldType()**: Map spreadsheet field types to CoMapeo types
- **getFieldOptions()**: Parse field options from CSV
- **isOptionField()**: Check if field has options

---

#### `types.ts`
**Purpose**: TypeScript type definitions

**Dependencies**: None (type-only file)

**Used By**: All modules

---

### Service Modules

#### `driveService.ts`
**Purpose**: Google Drive operations (folders, files, ZIP archives)

**Dependencies**:
- Google DriveApp: Folder/file operations
- Google Utilities: ZIP creation, sleep
- `generateIcons/iconProcessor.ts`: processIcons()
- `utils.ts`: slugify()
- `logger.ts`: Logging

**Called By**:
- `generateCoMapeoConfig.ts`: Save config and create ZIP
- `icons.ts`: Get config folder
- `cleanup.ts`: Get config folder for cleanup

---

#### `apiService.ts`
**Purpose**: External API communication

**Dependencies**:
- Google UrlFetchApp: HTTP requests
- Google PropertiesService: Store API URL
- Google Utilities: Sleep for retry
- `driveService.ts`: saveZipToDrive()
- `logger.ts`: Logging (implicit via console.log)

**Called By**: `generateCoMapeoConfig.ts`

---

#### `spreadsheetData.ts`
**Purpose**: Spreadsheet data access and language management

**Dependencies**:
- Google SpreadsheetApp: Read spreadsheet data
- Google UrlFetchApp: Fetch language data from GitHub
- Google CacheService: Cache language data
- `data/languagesFallback.ts`: Fallback language data
- `validation.ts`: validatePrimaryLanguage()
- `logger.ts`: Logging

**Called By**: All modules that need spreadsheet data or language information

---

### Icon Generation Modules

#### `generateIcons/iconProcessor.ts`
**Purpose**: Process and optimize SVG icons

**Dependencies**:
- `generateIcons/iconApi.ts`: Fetch icons from API
- Google DriveApp: Save icons to Drive
- `logger.ts`: Logging (implicit via console.log)

**Called By**: `driveService.ts`

---

#### `generateIcons/iconApi.ts`
**Purpose**: Fetch SVG icons from external API

**Dependencies**:
- Google UrlFetchApp: HTTP requests
- Google Utilities: Sleep for retry
- `apiService.ts`: getApiUrl()
- `logger.ts`: Logging (implicit via console.log)

**Called By**: `generateIcons/iconProcessor.ts`

---

### UI & Dialog Modules

#### `dialog.ts`
**Purpose**: Generate HTML dialogs for user interactions

**Dependencies**:
- `text/dialog.ts`: Dialog text templates
- `utils.ts`: HTML escaping

**Called By**:
- `generateCoMapeoConfig.ts`: Progress and result dialogs
- `importCategory.ts`: Progress and result dialogs
- `icons.ts`: Success dialog
- `lint.ts`: Validation results
- `cleanup.ts`: Cleanup results

---

#### `text/dialog.ts`
**Purpose**: Localized text strings for dialogs

**Dependencies**: None (data-only file)

**Called By**: `dialog.ts`

---

#### `text/menu.ts`
**Purpose**: Localized text strings for menu items

**Dependencies**: None (data-only file)

**Called By**: Menu creation in main App Script file

---

### Data Modules

#### `data/languagesFallback.ts`
**Purpose**: Fallback language data if GitHub API fails

**Dependencies**: None (data-only file)

**Called By**: `spreadsheetData.ts`

---

## Data Flow Architecture

### Config Generation Flow

```
User Action (Menu: "Generate CoMapeo Category")
  ↓
generateCoMapeoConfig.ts (Entry Point)
  ↓
dialog.ts → Show language selection dialog
  ↓
User selects target languages
  ↓
processDataForCoMapeo() orchestration:
  │
  ├─→ spreadsheetData.ts → Get all sheet data
  │
  ├─→ translation.ts → Auto-translate sheets (if languages selected)
  │
  ├─→ validation.ts → Validate sheet data
  │
  ├─→ processMetadata.ts → Generate metadata + package.json
  │
  ├─→ processFields.ts → Convert Details sheet to fields
  │   └─→ validation.ts → Validate each field
  │
  ├─→ processPresets.ts → Convert Categories sheet to presets
  │   └─→ validation.ts → Validate each category
  │
  └─→ processTranslations.ts → Aggregate all translation sheets
  │
  ↓
CoMapeoConfig object created
  ↓
driveService.ts → saveConfigToDrive()
  ├─→ Create folder structure in Drive
  ├─→ Save JSON files (fields, presets, metadata, package.json)
  ├─→ iconProcessor.ts → Process and save icons
  │   └─→ iconApi.ts → Fetch icons from API
  └─→ Save translations
  ↓
driveService.ts → saveDriveFolderToZip()
  └─→ Create ZIP archive of all files
  ↓
apiService.ts → sendDataToApiAndGetZip()
  └─→ POST ZIP to external API
  └─→ Receive .comapeocat file
  └─→ saveZipToDrive() → Save to "builds" folder
  ↓
dialog.ts → Show success dialog with download link
  ↓
User downloads .comapeocat file
```

---

### Import Flow

```
User Action (Menu: "Import Category File")
  ↓
importDropzone.ts → Show file upload UI
  ↓
User uploads .comapeocat file
  ↓
importCategory.ts (Entry Point)
  ↓
importProgressHandler.ts → Show progress dialog
  ↓
extractTarFile.ts → Extract tar archive to Drive temp folder
  ↓
parseFiles.ts → Parse all JSON config files
  │
  ├─→ Read metadata.json
  ├─→ Read package.json
  ├─→ Read fields/*.json
  ├─→ Read presets/*.json
  └─→ Read messages/*.json (translations)
  ↓
parseIconSprite.ts → Extract individual SVG icons from sprite
  ↓
applyConfiguration.ts (Orchestrator)
  │
  ├─→ clearValidations.ts → Clear existing validations
  │
  ├─→ applyMetadata.ts → Set metadata in spreadsheet
  │
  ├─→ applyCategories.ts → Populate Categories sheet
  │
  ├─→ applyFields.ts → Populate Details sheet
  │
  ├─→ applyTranslations.ts → Populate translation sheets
  │
  └─→ addDetailsDropdown.ts → Add field type dropdowns
  ↓
Cleanup: Delete temp folder from Drive
  ↓
dialog.ts → Show success dialog
  ↓
User sees imported config in spreadsheet
```

---

### Icon Generation Flow

```
User Action (Menu: "Generate Icons")
  ↓
icons.ts → generateIconsConfig()
  ↓
spreadsheetData.ts → Get category names from Categories sheet
  ↓
driveService.ts → getConfigFolder() → Get or create config folder
  ↓
iconProcessor.ts → processIcons()
  │
  ├─→ For each category:
  │   │
  │   ├─→ iconApi.ts → searchIcons() → Search icon API
  │   │   └─→ Return first matching icon
  │   │
  │   ├─→ iconApi.ts → fetchIcon() → Download SVG icon
  │   │   └─→ Retry 3 times with exponential backoff
  │   │
  │   └─→ Save SVG to Drive icons folder
  │
  └─→ Return icon metadata
  ↓
dialog.ts → Show success dialog with folder link
  ↓
User sees icons in Drive folder
```

---

### Translation Flow

```
User Action (Menu: "Manage Languages & Translate")
  ↓
dialog.ts → Show combined language management dialog
  ↓
User selects auto-translate targets and optional custom languages
  ↓
translation.ts → addCustomLanguagesToTranslationSheets()
  ↓
translation.ts → autoTranslateSheetsBidirectional()
  │
  ├─→ Validate target languages
  │
  ├─→ For each translation sheet:
  │   │
  │   ├─→ createTranslationSheet() or ensureLanguageColumnsExist()
  │   │
  │   └─→ translateSheetBidirectional()
  │       │
  │       ├─→ For each row in sheet:
  │       │   │
  │       │   ├─→ Read source text (column A)
  │       │   │
  │       │   └─→ For each target language:
  │       │       │
  │       │       └─→ LanguageApp.translate() → Google Translate API
  │       │           └─→ Write translation to target column
  │       │
  │       └─→ Skip cells that already have translations
  │
  └─→ Translation sheets:
      ├─→ Category Translations
      ├─→ Detail Label Translations
      ├─→ Detail Helper Text Translations
      └─→ Detail Option Translations
  ↓
dialog.ts → Show success dialog
  ↓
User sees translations in spreadsheet
```

---

### Validation Flow

```
User Action (Menu: "Lint")
  ↓
lint.ts → validateSheet()
  │
  ├─→ spreadsheetData.ts → Get all sheet data
  │
  ├─→ validation.ts → validateSheetData()
  │   │
  │   ├─→ Check required sheets exist
  │   ├─→ Check required columns exist
  │   ├─→ validateFieldDefinition() for each field
  │   └─→ validateCategoryDefinition() for each category
  │
  ├─→ validateSheetConsistency()
  │   │
  │   ├─→ Check translation sheets have matching row counts
  │   ├─→ Check translation sheets have matching language columns
  │   └─→ Highlight inconsistencies in red
  │
  └─→ Collect all errors and warnings
  ↓
dialog.ts → Show validation results
  ↓
User sees highlighted errors in spreadsheet
```

---

### Cleanup Flow

```
User Action (Menu: "Cleanup")
  ↓
cleanup.ts → cleanupSheet()
  │
  ├─→ spreadsheetData.ts → Get all sheet data
  │
  ├─→ Remove whitespace-only cells
  │
  └─→ Fix data inconsistencies
  ↓
cleanup.ts → cleanupOldTempFolders()
  │
  ├─→ driveService.ts → getConfigFolder()
  │
  ├─→ Find temp folders matching pattern:
  │   - temp-comapeocat-extract-*
  │   - comapeocat-extract-temp-*
  │
  ├─→ Check folder age (default: > 24 hours)
  │
  └─→ Move old folders to trash
  ↓
dialog.ts → Show cleanup results
  ↓
User sees cleaned spreadsheet and Drive
```

---

## Module Dependency Graph

### Core Module Dependencies

```
generateCoMapeoConfig.ts
├── spreadsheetData.ts
│   ├── data/languagesFallback.ts
│   └── validation.ts
├── translation.ts
│   └── spreadsheetData.ts
├── validation.ts
│   ├── spreadsheetData.ts
│   └── utils.ts
├── generateConfig/processMetadata.ts
│   └── utils.ts
├── generateConfig/processFields.ts
│   ├── utils.ts
│   └── validation.ts
├── generateConfig/processPresets.ts
│   ├── utils.ts
│   └── validation.ts
├── generateConfig/processTranslations.ts
│   ├── spreadsheetData.ts
│   └── utils.ts
├── driveService.ts
│   ├── generateIcons/iconProcessor.ts
│   │   └── generateIcons/iconApi.ts
│   │       └── apiService.ts
│   ├── utils.ts
│   └── logger.ts
├── apiService.ts
│   ├── driveService.ts (saveZipToDrive)
│   └── logger.ts
├── dialog.ts
│   ├── text/dialog.ts
│   └── utils.ts
├── logger.ts
└── utils.ts
```

---

### Import Module Dependencies

```
importCategory.ts
├── importDropzone.ts
├── importCategory/extractTarFile.ts
│   ├── importCategory/debugLogger.ts
│   └── utils.ts
├── importCategory/parseFiles.ts
│   ├── importCategory/debugLogger.ts
│   └── types.ts
├── importCategory/parseIconSprite.ts
│   └── importCategory/debugLogger.ts
├── importCategory/applyConfiguration.ts
│   ├── importCategory/applyMetadata.ts
│   ├── importCategory/applyCategories.ts
│   ├── importCategory/applyFields.ts
│   ├── importCategory/applyTranslations.ts
│   ├── importCategory/clearValidations.ts
│   ├── importCategory/addDetailsDropdown.ts
│   ├── importCategory/debugLogger.ts
│   ├── importCategory/importProgressHandler.ts
│   └── utils.ts
├── importCategory/importProgressHandler.ts
├── dialog.ts
│   ├── text/dialog.ts
│   └── utils.ts
└── logger.ts
```

---

### Icon Generation Dependencies

```
icons.ts
├── generateIcons/iconProcessor.ts
│   └── generateIcons/iconApi.ts
│       └── apiService.ts
├── spreadsheetData.ts
│   ├── data/languagesFallback.ts
│   └── validation.ts
├── driveService.ts
│   ├── generateIcons/iconProcessor.ts (circular via processIcons)
│   ├── utils.ts
│   └── logger.ts
├── dialog.ts
│   ├── text/dialog.ts
│   └── utils.ts
└── utils.ts
```

---

### Validation & Cleanup Dependencies

```
lint.ts
├── spreadsheetData.ts
│   ├── data/languagesFallback.ts
│   └── validation.ts
├── validation.ts
│   ├── spreadsheetData.ts
│   └── utils.ts
├── dialog.ts
│   ├── text/dialog.ts
│   └── utils.ts
└── logger.ts

cleanup.ts
├── spreadsheetData.ts
│   ├── data/languagesFallback.ts
│   └── validation.ts
├── driveService.ts
│   ├── generateIcons/iconProcessor.ts
│   ├── utils.ts
│   └── logger.ts
├── dialog.ts
│   ├── text/dialog.ts
│   └── utils.ts
└── logger.ts
```

---

## Critical Dependencies

### Circular Dependencies

**⚠️ Circular Dependency Warning**:

```
driveService.ts → iconProcessor.ts → iconApi.ts → apiService.ts
                                                          ↓
                                                   saveZipToDrive()
                                                          ↓
                                                   driveService.ts
```

**Resolution**: The circular dependency is resolved because:
- `iconApi.ts` only uses `getApiUrl()` from `apiService.ts`
- `apiService.ts` only uses `saveZipToDrive()` from `driveService.ts`
- These functions don't call back into the modules that depend on them
- Google Apps Script's global scope allows this pattern

**Alternative**: Extract `getApiUrl()` to a separate `config.ts` module to eliminate the circular dependency.

---

### Shared Utility Dependencies

All modules depend on:
- **utils.ts**: Core utility functions (slugify, field type mapping)
- **logger.ts**: Logging infrastructure
- **types.ts**: TypeScript type definitions

---

### Google Apps Script API Dependencies

All modules depend on Google Apps Script runtime APIs:
- SpreadsheetApp (most common)
- DriveApp (file operations)
- UrlFetchApp (HTTP requests)
- Utilities (ZIP, sleep, date formatting)
- LanguageApp (translation)
- PropertiesService (configuration)
- CacheService (caching)

---

## Dependency Best Practices

### Guidelines

1. **Minimize Circular Dependencies**: Keep data flow unidirectional where possible
2. **Centralize Utilities**: Use `utils.ts`, `logger.ts`, and `validation.ts` for shared functionality
3. **Isolate External Dependencies**: Wrap external APIs in dedicated modules (`apiService.ts`, `iconApi.ts`)
4. **Modular Processing**: Keep processing modules focused on single responsibility
5. **Clear Data Flow**: Maintain clear orchestration in entry point modules

### Module Design Patterns

- **Entry Points**: Orchestrate workflows (generateCoMapeoConfig.ts, importCategory.ts)
- **Processors**: Transform data (processFields.ts, processPresets.ts, processTranslations.ts)
- **Services**: Interface with external systems (apiService.ts, driveService.ts)
- **Utilities**: Shared helper functions (utils.ts, logger.ts, validation.ts)
- **Data**: Pure data modules (languagesFallback.ts, dialog text files)

---

## Testing Dependencies

### Test Modules

Test modules depend on:
- **All core modules**: For end-to-end testing
- **test/testHelpers.ts**: Test infrastructure (backup/restore, assertions, test runner)
- **Google Apps Script APIs**: For spreadsheet manipulation in tests

Test helper dependencies:
- `logger.ts`: Logging
- `types.ts`: Type definitions
- No circular dependencies with production code

---

## Version History

- **2025-10-12**: Initial comprehensive dependency documentation
- Documented 54+ source files
- Mapped 6 major data flows
- Identified 1 circular dependency with resolution
- Listed 8 Google Apps Script API dependencies
- Listed 3 external HTTP API dependencies

---

**See Also**:
- [Architecture Documentation](../reference/architecture.md)
- [Module Reviews](./reviews/README.md)
- [Coding Assistant Guide](assistant-guide.md) - Development guidance
