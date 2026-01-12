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

#### Configuration Generation (v2)

Current build flow uses the payload builder:

- `builders/payloadBuilder.ts`: Builds the JSON payload sent to the `/v2` API.

Legacy (pre-v2) processors live under `src/generateConfig` and are no longer part of the main build path.

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

- `testBuildAndImport.ts`: Tests JSON build flow and import integration.

## Data Model

The plugin uses the v2 API data model defined in `types.ts`:

### Core Types (v2)

- `BuildRequest`: JSON payload sent to the `/v2` API.
- `Metadata`, `Category`, `Field`, `Icon`: Core schema objects for the build.
- `TranslationsByLocale`: Translation payload keyed by locale.

Legacy configuration types still exist for import/migration paths, but the build flow uses `BuildRequest`.

## Generation Modes

### 1. Manage Languages & Translate (Translation-Only)
**Entry Point**: `translateCoMapeoCategory()` (Menu: "Manage Languages & Translate")

- **Purpose**: Standalone translation workflow (no build)
- **Process**: Language selection dialog → Translate empty cells → Update sheets
- **Output**: Updated translation sheets only

### 2. Generate CoMapeo Category (Build)
**Entry Point**: `generateCoMapeoCategory()` (Menu: "Generate CoMapeo Category")

- **Purpose**: Build a `.comapeocat` from current spreadsheet data
- **Process**: Validate + read sheets → Build JSON payload → POST to API `/v2`
- **Output**: `.comapeocat` ZIP returned by API and saved to Google Drive

**Debug mode note:** The "Debug: Export Raw Files" menu entry runs the standard generator in v2; raw export is deprecated (see `USER_GUIDE.md`).

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
  - Runs the standard generator (v2); raw export is deprecated
- **Help** (`openHelpPage`)
  - Opens help documentation
- **About / Version** (`showVersionInfo`)
  - Display version information

**Developer Menu** (shown in development environment only):
- Test functions for format detection, translation extraction, category import, etc.
- **Clear Language Cache** - Reset cached language data

### Main Generation Pipeline (v2)

The v2 build flow is JSON-only and does not create local ZIPs:

1. **Validate & Lint**: Check sheet structure, translation mismatches, and required fields.
2. **Read Spreadsheet Data**: Build a `SheetData` object from Categories/Details/Translations.
3. **Build Payload**: Create the JSON build payload (`createBuildPayload()`).
4. **API Build**: `POST /v2` with JSON and receive a `.comapeocat` ZIP.
5. **Save & Notify**: Save the returned file to Drive and show the success dialog.

Translation creation and auto-translation are handled separately via **Manage Languages & Translate**.

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
