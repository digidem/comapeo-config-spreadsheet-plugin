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
- **Cleanup**: Removes whitespace-only cells, fixes data inconsistencies
- Both can run standalone via menu or as part of config generation

### UI Layer (`src/dialog.ts`, `src/text/`)

- **`dialog.ts`**: Generates HTML dialogs for user interactions
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

## Context Documentation

The `context/` directory contains **essential reference documentation** for AI assistants and developers:

**Purpose**: Documents system constraints and proven optimization patterns (not implementation details).

**Files**:
1. **`PNG_SPRITE_LIMITATIONS.md`** - PNG sprite parsing limitations in Google Apps Script
   - Use when: Planning icon features or debugging import issues
   - Key insight: Apps Script can't parse PNG sprites (no image manipulation APIs)

2. **`PERFORMANCE_FIX_SUMMARY.md`** - File indexing optimization pattern
   - Use when: Optimizing file operations or similar search patterns
   - Key insight: Batch file lookups with Map index (O(n×m) → O(n+m))

See `context/README.md` for detailed guidance on when to reference these files.
