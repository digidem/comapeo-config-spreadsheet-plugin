# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Google Apps Script plugin that generates CoMapeo configuration files (`.comapeocat`) from Google Spreadsheets. The plugin allows users to manage field definitions, presets, icons, translations, and metadata through a spreadsheet interface, then export them as properly formatted CoMapeo configuration packages.

## Development Commands

### clasp (Google Apps Script CLI)
This project uses `@google/clasp` for Google Apps Script development.

**Setup (first time only):**
```bash
npm install -g @google/clasp
clasp login
# Enable Google Apps Script API in Google Cloud Console
```

**Development workflow:**
```bash
# Watch mode - auto-push changes to Google Apps Script
npm run dev

# Manual push to Google Apps Script
npm run push

# Push to multiple Apps Script projects (uses .clasp.all.json)
npm run push:all

# Open project in Apps Script editor
clasp open
```

**Linting:**
```bash
npm run lint
```

## Architecture

### Core Data Flow

The plugin follows a multi-stage pipeline:

1. **Spreadsheet Data → Internal Representation** (`src/spreadsheetData.ts`)
   - Reads data from structured sheets (Categories, Details, translations)
   - Returns `SheetData` object with all sheet contents

2. **Internal Representation → CoMapeo Config** (`src/generateCoMapeoConfig.ts`)
   - Entry point: `generateCoMapeoConfig()` triggers language selection dialog
   - Main processor: `processDataForCoMapeo()` orchestrates all processing steps
   - Outputs `CoMapeoConfig` object with metadata, fields, presets, icons, and translations

3. **Config → Drive Folder → ZIP** (`src/driveService.ts`, `src/apiService.ts`)
   - Saves structured config files to Google Drive
   - Creates ZIP archive
   - Sends to external API for final packaging

### Processing Modules (`src/generateConfig/`)

Each processor handles a specific part of the CoMapeo configuration:

- **`processFields.ts`**: Converts spreadsheet field definitions to `CoMapeoField[]`
- **`processPresets.ts`**: Converts category definitions to `CoMapeoPreset[]`
- **`processMetadata.ts`**: Generates metadata and package.json
- **`processTranslations.ts`**: Aggregates all translation sheets into `CoMapeoTranslations` messages object

### Translation System (`src/translation.ts`)

- **Bidirectional translation**: Source language ↔ target languages via Google Translate API
- **Multi-sheet support**: Handles Categories, Details helper text, and Detail options
- **Language management**: Primary language in cell A1, additional languages in columns
- **Translation functions**:
  - `translateSheetBidirectional()`: Translates sheet to/from selected languages
  - `autoTranslateSheetsBidirectional()`: Batch translates all sheets

### Import System (`src/importCategory/`)

Reverse flow: imports existing `.comapeocat` files back into spreadsheet format.

**Key modules:**
- **`extractTarFile.ts`**: Extracts tar archives to Google Drive temp folder
- **`parseFiles.ts`**: Parses JSON config files and extracts data
- **`parseIconSprite.ts`**: Extracts individual SVG icons from icon sprite
- **`applyConfiguration.ts`**: Main orchestrator - applies parsed config to spreadsheet
- **`applyCategories.ts`**, **`applyFields.ts`**, **`applyTranslations.ts`**: Sheet-specific writers

### Icon Generation (`src/generateIcons/`)

- **`iconApi.ts`**: Fetches SVG icons from external icon API
- **`iconProcessor.ts`**: Processes and optimizes SVG icons for CoMapeo

### Validation & Cleanup (`src/lint.ts`, `src/cleanup.ts`)

- **Linting**: Validates field types, required columns, data formats, and highlights errors
- **HTML Validation**: Prevents "Malformed HTML content" errors in dialogs
  - `validateHtmlContent()`: Core HTML validation with tag matching
  - `validateDialogHtml()`: Pre-flight validation before showing dialogs
  - `testHtmlValidation()`: Test suite for validation functions
- **Cleanup**: Removes whitespace-only cells, fixes data inconsistencies
- Both can run standalone via menu or as part of config generation

### UI Layer (`src/dialog.ts`, `src/text/`)

- **`dialog.ts`**: Generates HTML dialogs for user interactions
  - `generateDialog()`: Main dialog generator with built-in HTML validation
  - `validateAndSanitizeMessage()`: Sanitizes message content before dialog creation
  - `escapeHtml()`: Escapes user input to prevent XSS attacks
- **`text/menu.ts`**, **`text/dialog.ts`**: Localized text strings for UI
- **Dialog types**: Progress modals, language selection, success/error messages

### Types (`src/types.ts`)

Core TypeScript interfaces:
- `CoMapeoField`, `CoMapeoPreset`, `CoMapeoIcon`: Config structure
- `CoMapeoTranslations`: Translation messages format
- `CoMapeoMetadata`, `CoMapeoPackageJson`: Package metadata
- `CoMapeoConfig`: Complete configuration object
- `SheetData`: Spreadsheet data representation

## Key Patterns

### Error Handling (`src/errorHandling.ts`)
- All major operations wrapped in try-catch with user-friendly error dialogs
- Automatic retry logic for API calls (3 attempts with exponential backoff)
- Progress dialogs update user on multi-step operations

### Google Apps Script Specifics
- **CRITICAL**: Apps Script doesn't support ES6 `import`/`export` statements
  - All `.ts` files are compiled into a single global scope
  - Use `export` for TypeScript type checking, but reference globals directly at runtime
  - Use `typeof` checks for optional global references (e.g., `if (typeof VERSION !== 'undefined')`)
  - **Never use** `import { foo } from './bar'` in files that run in Apps Script
- All functions are global (no module exports/imports in Apps Script environment)
- Type references via `/// <reference path="..." />` for cross-file type awareness
- Uses Google Apps Script APIs: `SpreadsheetApp`, `DriveApp`, `LanguageApp`, `UrlFetchApp`
- Script properties for persistent state across executions

### Menu System
Custom menu in spreadsheet UI provides access to all plugin functions:
- Generate CoMapeo Category (main export flow)
- Import Category File (reverse import)
- Translate CoMapeo Category (batch translation)
- Generate Icons (icon fetching/processing)
- Lint/Clean operations

### Sheet Structure Requirements

The spreadsheet must follow specific structure:
- **Categories sheet**: Category definitions with name, icon, color, geometry
- **Details sheet**: Field definitions with name, type, helper text, options
- **Translation sheets**: Category Translations, Detail Helper Text Translations, Detail Option Translations
- **Metadata cells**: Dataset ID, name, version in specific locations
- **Language columns**: Primary language in column A, additional languages in subsequent columns

## Development Notes

- Use `clasp push --watch` for live development with auto-sync
- Test changes directly in Google Sheets via custom menu
- The `push:all` script deploys to multiple Apps Script projects defined in `.clasp.all.json`
- Icons are fetched from external API and stored as SVG strings
- Translation uses Google's LanguageApp API (free, built into Apps Script)
- Final configuration is sent to external API endpoint for packaging

## Documentation Structure

All technical documentation lives in the **`context/`** directory. Reference these files for comprehensive information:

### Architecture & System Design
- **[`context/ARCHITECTURE.md`](./context/ARCHITECTURE.md)** - Complete system architecture, data flow, and module organization
  - 9-stage pipeline for config generation
  - File structure and responsibilities
  - External API dependencies
  - **Use when**: Understanding system design, onboarding, or planning major features

### Feature Documentation
- **[`context/CAT_GEN.md`](./context/CAT_GEN.md)** - Category generation process details
  - Stage-by-stage analysis of export pipeline
  - Debugging strategies and test functions
  - Performance benchmarks
  - **Use when**: Working on export functionality or troubleshooting generation issues

- **[`context/IMPORT_CAT.md`](./context/IMPORT_CAT.md)** - Import category feature documentation
  - Reverse engineering process for .comapeocat files
  - Icon extraction strategies
  - Translation structure handling
  - **Use when**: Working on import functionality or debugging imports

### File Formats & Data Structures
- **[`context/COMAPEOCAT_FORMAT.md`](./context/COMAPEOCAT_FORMAT.md)** - .comapeocat file format specification
  - ZIP archive structure (197 files)
  - Icon variants and naming conventions
  - Performance considerations for large icon sets
  - **Use when**: Understanding or debugging file format issues

- **[`context/spreadsheet-format.md`](./context/spreadsheet-format.md)** - Spreadsheet data structure rules
  - Categories and Details sheet structure
  - Field types and validation rules
  - Translation sheet format
  - **Use when**: Validating spreadsheet data or building features that read/write sheets

### User Documentation
- **[`context/USER_GUIDE.md`](./context/USER_GUIDE.md)** - End-user documentation
  - Creating new configurations
  - Exporting and importing workflows
  - Translation management
  - Troubleshooting common issues
  - **Use when**: Understanding user workflows or writing user-facing features

### Technical Constraints & Patterns
- **[`context/PNG_SPRITE_LIMITATIONS.md`](./context/PNG_SPRITE_LIMITATIONS.md)** - PNG sprite parsing limitations
  - Why PNG sprites can't be parsed in Apps Script
  - Supported alternatives (individual PNGs, SVG sprites)
  - Workarounds and solutions
  - **Use when**: Planning icon features or debugging import issues

- **[`context/PERFORMANCE_FIX_SUMMARY.md`](./context/PERFORMANCE_FIX_SUMMARY.md)** - File indexing optimization pattern
  - O(n×m) → O(n+m) optimization using Map indexing
  - Before/after comparison with performance gains
  - **Use when**: Optimizing file operations or similar search patterns

- **[`context/HTML_VALIDATION.md`](./context/HTML_VALIDATION.md)** - HTML validation strategy for dialogs
  - Prevents "Malformed HTML content" errors
  - Stack-based tag matching algorithm
  - Integration with dialog generation system
  - Test suite and debugging guide
  - **Use when**: Working with dialog generation, debugging HTML errors, or adding new dialog types

### Navigation
See **[`context/README.md`](./context/README.md)** for a complete overview and guidance on when to reference each file.
