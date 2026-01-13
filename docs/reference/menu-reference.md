# Menu reference

The **CoMapeo Tools** menu provides all plugin functionality.

## Language and translation

- **Manage Languages & Translate**: Adds translation columns and auto-translates empty cells.
  - Use this when adding new languages or after changing names.
  - See [Translations](../how-to/translations.md#add-languages).

## Icons

- **Generate Category Icons**: Searches the icon database and saves selections to Drive.
  - Best for quick icon coverage; inline SVG is still the most reliable.
  - See [Categories sheet tasks](../how-to/categories-sheet-tasks.md#add-icons).

## Export and import

- **Generate CoMapeo Category**: Builds a `.comapeocat` file from the spreadsheet.
  - Runs validation and packages icons, translations, and metadata.
  - See [Export and share](../how-to/export-and-share.md#generate-a-config).
- **Import category file**: Imports a `.comapeocat` or `.mapeosettings` file.
  - **Warning:** This replaces all current sheet data.
  - See [Import and maintenance](../how-to/import-and-maintenance.md#import-and-edit-a-config).

## Validation

- **Lint Sheets**: Validates data and highlights issues.
  - Use before every export.
  - See [Export and share](../how-to/export-and-share.md#run-linting).

## Maintenance

- **Reset Spreadsheet**: Removes translation sheets and metadata.
  - **Warning:** This cannot be undone.
  - See [Import and maintenance](../how-to/import-and-maintenance.md#reset-the-spreadsheet).

## Debug (advanced)

- **Create Test Spreadsheet**
- **Test Runner**
- **Capture Baseline Performance Metrics**
- **Turn on legacy compatibility**
- **Generate CoMapeo Category (Debug)**

These tools are intended for developers and administrators.

## Help & about

- **Help**: Quick tips and links to documentation.
- **About / Version**: Shows the plugin version and repository link.
