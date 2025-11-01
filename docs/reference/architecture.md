# CoMapeo Config Spreadsheet Plugin: Architecture

This document provides a comprehensive technical reference for the CoMapeo Config Spreadsheet Plugin architecture, including system design, data flow, and module organization.

**Audience**: Developers, AI assistants, and technical contributors
**For Users**: See [USER_GUIDE.md](../USER_GUIDE.md) for end-user documentation

## Overview

The CoMapeo Config Spreadsheet Plugin is a Google Apps Script application that allows users to create and manage configuration files for the CoMapeo mapping application directly from Google Spreadsheets. It streamlines the process of creating `.comapeocat` category files, which define the data collection schema for CoMapeo projects.

## Project Structure

The project is organized into several key directories and files:

### Core Files

- `index.ts`: The entry point of the application, which defines the menu structure and main functions that can be triggered from the Google Sheets UI.
- `appsscript.json`: Configuration file for the Google Apps Script project.
- `.clasp.json`: Configuration file for the Clasp CLI tool, which is used for local development and deployment.

### Source Code

The `src` directory contains the main functionality of the plugin, organized into several modules:

#### Main Functionality

- `generateCoMapeoConfig.ts`: Contains the main function for generating CoMapeo configuration files from spreadsheet data.
- `spreadsheetData.ts`: Functions for retrieving and manipulating data from the spreadsheet.
- `translation.ts`: Handles translation of content between different languages.
- `lint.ts`: Provides validation and formatting for spreadsheet data. Includes functions to clean whitespace-only cells, check for duplicates, validate required fields, and ensure proper formatting.
- `dialog.ts`: Creates and manages UI dialogs for user interaction.
- `driveService.ts`: Manages interactions with Google Drive for saving and retrieving files.
- `apiService.ts`: Handles communication with external APIs for processing configuration files.

#### Configuration Generation

The `src/generateConfig` directory contains modules for processing different aspects of the CoMapeo configuration:

- `processFields.ts`: Processes field definitions from the spreadsheet.
- `processPresets.ts`: Processes preset (category) definitions from the spreadsheet.
- `processMetadata.ts`: Processes metadata for the configuration.
- `processTranslations.ts`: Processes translations for fields, presets, and other content.

#### Icon Generation

The `src/generateIcons` directory contains modules for generating and processing icons:

- `iconProcessor.ts`: Processes icon data from the spreadsheet.
- `iconApi.ts`: Communicates with external icon APIs to generate SVG icons.

#### Utilities

- `types.ts`: TypeScript type definitions for the project.
- `text/dialog.ts`: Text content for dialogs in different languages.

### Scripts

The `src/scripts` directory contains shell scripts for deployment and management:

- `push-all.sh`: Script for pushing code to multiple Google Apps Script projects.

### Testing

The `src/test` directory contains test functions:

- `testZipToApi.ts`: Tests the functionality for sending ZIP files to the API.

## Data Model

The plugin works with a specific data model defined in `types.ts`:

### Core Types

- `CoMapeoConfig`: The main configuration object that includes metadata, package information, fields, presets, icons, and translations.
- `CoMapeoField`: Represents a data collection field in CoMapeo.
- `CoMapeoPreset`: Represents a category or preset in CoMapeo.
- `CoMapeoIcon`: Represents an icon used for categories.
- `CoMapeoTranslations`: Contains translations for all content in multiple languages.
- `CoMapeoMetadata`: Contains metadata about the configuration.
- `CoMapeoPackageJson`: Contains package.json information for the configuration.

## Generation Modes

The plugin supports **four distinct generation modes**, each optimized for different use cases:

### 1. Translation-Only Mode
**Entry Point**: `translateCoMapeoCategory()` (Menu: "Manage Languages & Translate")

- **Purpose**: Standalone translation without config generation
- **Process**: Shows language selection dialog → Translates empty cells → Updates sheets
- **Use Case**: When you want to translate content without generating a config
- **Output**: Updated spreadsheet with translations (no `.comapeocat` file created)

### 2. Main Generation Mode
**Entry Point**: `generateCoMapeoCategory()` (Menu: "Generate CoMapeo Category")

- **Purpose**: Full production workflow with language selection
- **Process**: Language selection → Auto-translate → Full pipeline → `.comapeocat` file
- **Use Case**: Primary workflow for creating CoMapeo configurations
- **Output**: Final packaged `.comapeocat` file in Google Drive

### 3. Debug Mode (With Drive Writes)
**Entry Point**: `generateCoMapeoCategoryDebug()` (Menu: "Debug: Export Raw Files")

- **Purpose**: Development and troubleshooting with raw file access
- **Process**: Skips translation → Saves raw JSON files to Drive → Full API processing
- **Use Case**: Inspecting intermediate files, debugging issues
- **Output**: Both raw files in `rawBuilds/` folder AND final `.comapeocat` file
- **Drive Structure**:
  ```
  {spreadsheet-name}/
  └── rawBuilds/
      └── {version}/
          ├── presets/      # Individual preset JSON files
          ├── fields/       # Individual field JSON files
          ├── icons/        # SVG icon files
          ├── messages/     # Translation JSON files per language
          ├── metadata.json # Configuration metadata
          └── package.json  # Package information
  ```

### 4. In-Memory Mode
**Entry Point**: `generateCoMapeoConfigInMemory()` (Developer menu only)

- **Purpose**: Fast testing and CI/CD pipelines
- **Process**: All processing in memory → No Drive writes → Direct to API
- **Use Case**: Automated testing, performance testing
- **Output**: `.comapeocat` file without intermediate Drive storage

## Workflow

### Menu Structure

When the spreadsheet is opened, `onOpen()` creates a custom menu with the following options:

**Main Menu** (`CoMapeo Tools` / `Herramientas CoMapeo`):
- **Manage Languages & Translate** (`translateCoMapeoCategory`)
  - Standalone translation workflow
- **Generate Category Icons** (`generateIcons`)
  - Icon generation for categories only
- **Separator**
- **Generate CoMapeo Category** (`generateCoMapeoCategory`)
  - Main production generation mode
- **Import category file** (`importCategoryFile`)
  - Import existing `.comapeocat` or `.mapeosettings` files
- **Separator**
- **Lint Sheets** (`lintAllSheets`)
  - Validate all sheets for issues
- **Reset Spreadsheet** (`cleanAllSheets`)
  - Clean sheets (remove translations, metadata, icons)
- **Separator**
- **Debug: Export Raw Files** (`generateCoMapeoCategoryDebug`)
  - Debug mode with raw file access
- **Help** (`openHelpPage`)
  - Opens help documentation
- **About / Version** (`showVersionInfo`)
  - Display version information

**Developer Menu** (shown in development environment only):
- Test functions for format detection, translation extraction, category import, etc.
- **Clear Language Cache** - Reset cached language data

### Main Generation Pipeline

The main generation mode follows this 8-step pipeline:

#### Step 0: Pre-Flight Validation
- **Function**: `runPreflightChecks()`
- **Purpose**: Validate spreadsheet structure and requirements before processing
- **Checks**: Sheet existence, required columns, data integrity
- **Behavior**: Shows summary dialog, allows user to continue or cancel

#### Step 1: Initialization
- **Purpose**: Setup and validation
- **Actions**:
  - Show processing modal dialog
  - Lint all sheets (`lintAllSheets(false)`)
  - Add custom language columns (if specified)
- **Note**: Validation happens BEFORE processing to catch issues early

#### Step 2: Auto-Translation (Conditional)
- **Function**: `autoTranslateSheetsBidirectional()`
- **Purpose**: Translate empty cells to selected languages
- **Trigger**: Only runs if languages were selected in Step 0
- **Process**: Bidirectional translation with Google Translate API
- **Skip**: If no languages selected, this step is skipped entirely

#### Step 3: Data Extraction
- **Function**: `getSpreadsheetData()`
- **Purpose**: Read all sheet data into structured object
- **Output**: `SheetData` object with all sheet contents
- **Timing**: After translation to include any new columns

#### Step 4: Data Processing
- **Function**: `processDataForCoMapeo()`
- **Purpose**: Transform spreadsheet data into CoMapeo configuration
- **Sub-stages**:
  - **4a**: Process Fields (`processFields()`)
  - **4b**: Process Presets (`processPresets()`)
  - **4c**: Process Icons (`processIcons()`)
  - **4d**: Process Metadata (`processMetadata()`)
  - **4e**: Process Translations (`processTranslations()`)
- **Validation**: Config schema validation before proceeding
- **Error Handling**: Icon errors stored in PropertiesService for later display

#### Step 5: Save to Drive (Conditional)
- **Function**: `saveConfigToDrive()`
- **Behavior**:
  - **In Debug Mode**: Creates folder structure with individual JSON files
  - **In In-Memory Mode**: Skipped entirely (no Drive writes)
  - **In Main Mode**: Creates minimal structure for ZIP creation
- **Progress**: Updates processing dialog with progress callbacks
- **Cleanup**: On failure, deletes created folder to prevent clutter

#### Step 6: ZIP Creation
- **Functions**:
  - `saveDriveFolderToZip()` (with Drive files)
  - `Utilities.zip()` (in-memory mode)
- **Purpose**: Package configuration into ZIP archive
- **Output**: `GoogleAppsScript.Base.Blob` representing ZIP file

#### Step 7: API Submission
- **Function**: `sendDataToApiAndGetZip()`
- **Purpose**: Send ZIP to external packaging API
- **Process**:
  - Upload ZIP blob to packaging API (`http://137.184.153.36:3000/`)
  - Wait for processing
  - Download resulting `.comapeocat` file
  - Save to Google Drive
- **Retry Logic**: Up to 3 attempts with exponential backoff
- **Progress**: Updates processing dialog during API calls

#### Step 8: Completion
- **Purpose**: Finalize and notify user
- **Actions**:
  - Show icon error report (if any errors occurred)
  - Display success dialog with download link
  - Close processing dialog

### Icon Generation Workflow

When the user selects "Generate Category Icons":

1. **Data Collection**: Reads Categories sheet
2. **Icon Processing**: For each category:
   - Check if Google Drive icon exists → Use existing
   - Check if cell has image → Process via API
   - Otherwise → Generate new icon from external API
3. **API Calls**:
   - Search: `https://icons.earthdefenderstoolkit.com/api/search`
   - Generate: `https://icons.earthdefenderstoolkit.com/api/generate`
4. **Saving**: Icons saved to Google Drive and URLs updated in spreadsheet

### Translation Workflow

When the user selects "Manage Languages & Translate" (standalone mode):

1. **Language Detection**: Reads primary language from cell A1 (supports both English and native names)
2. **Language Selection**: Shows dialog with:
   - Auto-translate checkboxes for 200+ languages
   - Custom language input fields
   - Common languages preset
3. **Custom Languages**: Adds specified language columns to all translation sheets
4. **Auto-Translation**: Translates empty cells using Google Translate API
5. **Bidirectional**: Can translate both to and from target languages
6. **Output**: Updated spreadsheet with translations (no config generation)

### Key Architectural Features

#### GenerationOptions System
```typescript
interface GenerationOptions {
  skipDriveWrites?: boolean;  // Skip Drive operations for in-memory mode
}
```

- Stored in PropertiesService for async callback support
- Required because Google Apps Script doesn't preserve global variables across `google.script.run` contexts
- Retrieved in `handleLanguageSelection()` to determine workflow

#### Locale Support
- All user-facing strings are localized
- Supported locales: English (`en`), Spanish (`es`)
- Text definitions in `src/text/menu.ts`

#### Error Handling
- Try-catch blocks at each major step
- Cleanup on failure (deleting Drive folders)
- Error logging via `getScopedLogger()`
- Icon errors stored separately for user-friendly reporting
- Graceful degradation where possible

#### Progress Tracking
- Modal processing dialog with 8 stages
- Progress callbacks: `updateProcessingDialogProgress(main, detail)`
- Real-time updates during long operations (Drive saves, API calls)

#### Pre-Flight Validation
- Runs BEFORE processing to catch issues early
- Validates sheet structure, required columns, data integrity
- Shows summary of issues with option to continue or cancel
- Prevents wasted time on invalid configurations

## Deployment

The plugin can be deployed in several ways:

### Local Development

For local development, the plugin uses the Clasp CLI tool:

1. Install Clasp: `npm install -g @google/clasp`
2. Login to Google: `clasp login`
3. Push changes: `clasp push`
4. Open the project: `clasp open`

### Multiple Projects

The plugin supports deployment to multiple Google Apps Script projects using the `.clasp.all.json` file and the `push-all.sh` script.

### GitHub Actions

The plugin includes a GitHub Actions workflow in `.github/workflows/deploy.yml` that automatically deploys the plugin when changes are pushed to the main branch or when a release is published.

## External APIs

The plugin interacts with several external APIs:

- **Icon API**: Used for searching and generating icons.
- **CoMapeo API**: Used for processing the final configuration file.

## Security Considerations

The plugin includes several security features:

- **Project Key**: A unique key can be generated for each project to ensure that configurations can only be synced with authorized projects.
- **Metadata Validation**: The plugin validates metadata to ensure that it meets the requirements for CoMapeo configurations.

## Conclusion

The CoMapeo Config Spreadsheet Plugin provides a user-friendly interface for creating and managing CoMapeo configuration files directly from Google Spreadsheets. It streamlines the process of defining data collection schemas, generating icons, and translating content, making it easier for users to create and maintain CoMapeo projects.
