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

## Workflow

The plugin follows a specific workflow for generating CoMapeo configuration files:

### 1. Spreadsheet Setup

The plugin expects a Google Spreadsheet with specific sheets:

- `Categories`: Defines the main categories (presets) for data collection.
- `Details`: Defines the fields for data collection.
- `Category Translations`: Translations for category names.
- `Detail Label Translations`: Translations for field labels.
- `Detail Helper Text Translations`: Translations for field helper text.
- `Detail Option Translations`: Translations for field options.
- `Metadata`: (Optional) Contains metadata about the configuration.

### 2. Menu Options

When the spreadsheet is opened, the plugin adds a custom menu with several options:

- **Manage Languages & Translate**: Lets users choose auto-translate targets and add custom language columns across all translation sheets.
- **Generate Icons**: Generates icons for categories.
- **Generate CoMapeo Category**: Creates the final CoMapeo configuration file.
- **Lint All Sheets**: Validates and formats the data in all sheets.
- **Clean All Sheets**: Removes unnecessary data and formatting.
- **Open Help Page**: Opens a help page with instructions.

### 3. Configuration Generation Process

When the user selects "Generate CoMapeo Category", the following process occurs:

1. **Auto Translation**: The plugin automatically translates any missing translations.
2. **Linting**: The plugin validates and formats the data in all sheets.
3. **Data Collection**: The plugin collects all data from the spreadsheet.
4. **Processing**: The data is processed into a CoMapeo configuration object:
   - Fields are processed from the Details sheet.
   - Presets (categories) are processed from the Categories sheet.
   - Icons are processed from the Categories sheet and external icon APIs.
   - Metadata is processed from the Metadata sheet or created if it doesn't exist.
   - Translations are processed from the translation sheets.
5. **Saving to Drive**: The configuration is saved to Google Drive as a folder structure.
6. **Zipping**: The folder is zipped into a single file.
7. **API Processing**: The zip file is sent to an external API for final processing.
8. **Result**: The user is presented with a link to the final `.comapeocat` file.

### 4. Icon Generation Process

When the user selects "Generate Icons", the following process occurs:

1. **Data Collection**: The plugin collects category data from the Categories sheet.
2. **Icon Search**: For each category, the plugin searches for an appropriate icon using an external API.
3. **Icon Generation**: The plugin generates SVG icons with the appropriate colors.
4. **Saving**: The icons are saved to Google Drive and linked in the spreadsheet.

### 5. Translation Process

When the user selects "Manage Languages & Translate", the following process occurs:

1. **Language Detection**: The plugin detects the primary language of the spreadsheet.
2. **Custom Language Columns (Optional)**: Any manual languages entered in the dialog are added to every translation sheet so they can be filled in later.
3. **Translation**: The plugin uses Google Translate to translate content to the selected auto-translate languages.
4. **Updating Sheets**: The translation sheets are updated with the translated content.

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
