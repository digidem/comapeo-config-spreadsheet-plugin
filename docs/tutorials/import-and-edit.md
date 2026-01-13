# Import and edit a config

Use this when you want to update an existing `.comapeocat` or `.mapeosettings` file.

## Before you start

- This **replaces all current spreadsheet data**. Make a copy first.
- Import can take 1-2 minutes for large configs.

## Steps

1. In your spreadsheet, open **CoMapeo Tools → Import category file**.
2. Choose a `.comapeocat` or `.mapeosettings` file.
3. Click **Upload** and wait for the import to finish.

## After import

- Review the **Categories** and **Details** sheets.
- Run linting to catch any issues.
- Rebuild dropdown chips for Categories → Fields if needed (Google Sheets limitation):
  - Right-click column C → Data validation → Dropdown → add field names.

## What gets imported

- Categories, fields, icons, translations, and metadata
- Category colors (as background colors in column A)
- Applies values and IDs

## Icon handling notes

- Inline SVG stays inline.
- Drive-based icons are uploaded to a permanent Drive folder.
- SVG sprites are split into individual icons during import.
- PNG sprites are not fully supported; individual PNGs and SVGs are supported.

Next: [Run linting](../how-to/run-linting.md) and [Generate a config](../how-to/generate-config.md).
