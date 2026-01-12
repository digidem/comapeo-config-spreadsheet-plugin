# Category Generation Process (v2)

**Status**: Current (v2 JSON build flow)

This document describes the current category generation pipeline. For user-facing steps, see `USER_GUIDE.md`.

## Overview

The v2 generator builds a JSON payload from spreadsheet data and sends it to the API (`/v2`). The API returns a packaged `.comapeocat` ZIP, which is saved to Google Drive.

## Entry Points

- **Generate CoMapeo Category**: `generateCoMapeoCategory()` (menu)
- **Debug: Export Raw Files**: `generateCoMapeoCategoryDebug()` (menu)
  - Runs the standard generator in v2; raw export is deprecated (see `USER_GUIDE.md`)
- **Manage Languages & Translate**: `translateCoMapeoCategory()` (separate translation workflow)

## Pipeline (v2)

1. **Pre-checks + Lint**
   - Detect translation mismatches and prompt to fix.
   - Run `lintAllSheets(false)` to validate data.
2. **Read Spreadsheet Data**
   - `getSpreadsheetData()` builds a `SheetData` object from Categories/Details/Translations.
3. **Build JSON Payload**
   - `createBuildPayload()` in `src/builders/payloadBuilder.ts`.
4. **API Build**
   - `sendBuildRequest()` in `src/apiService.ts` sends JSON to `/v2`.
   - API returns `.comapeocat` ZIP as a binary response.
5. **Save & Notify**
   - Save the `.comapeocat` to Drive (also saves a zipped copy for sharing).
   - Show success dialog with a Drive link.

## Payload Shape (Summary)

The JSON payload includes:
- `metadata`
- `categories`
- `fields`
- `icons`
- `translations`

For schema details, see `src/builders/payloadBuilder.ts` and `src/types.ts`.

## Error Handling

- **Translation mismatches**: Detected before linting; users can auto-fix or abort.
- **Lint failures**: Highlighted in sheets; generation stops on critical issues.
- **API errors**: Retried with exponential backoff (see `RETRY_CONFIG` in `src/config.ts`).

## Related Files

- `src/generateCoMapeoConfig.ts` (orchestrator)
- `src/builders/payloadBuilder.ts` (payload construction)
- `src/apiService.ts` (API request/response handling)
- `src/lint.ts` (validation)
- `src/translation.ts` (language management)
- `src/spreadsheetData.ts` (data extraction)
- `docs/reference/comapeocat-format.md` (archive structure)
