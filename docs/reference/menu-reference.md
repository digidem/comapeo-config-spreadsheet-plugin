# Menu reference

The **CoMapeo Tools** menu provides all plugin functionality.

## Language and translation

- **Manage Languages & Translate**: Adds translation columns and auto-translates empty cells.
  - Use this when adding new languages or after changing names.
  - See [Manage languages](../how-to/manage-languages.md).

## Icons

- **Generate Category Icons**: Searches the icon database and saves selections to Drive.
  - Best for quick icon coverage; inline SVG is still the most reliable.
  - See [Add icons](../how-to/add-icons.md).

## Export and import

- **Generate CoMapeo Category**: Builds a `.comapeocat` file from the spreadsheet.
  - Runs validation and packages icons, translations, and metadata.
  - See [Generate a config](../how-to/generate-config.md).
- **Import category file**: Imports a `.comapeocat` or `.mapeosettings` file.
  - **Warning:** This replaces all current sheet data.
  - See [Import and edit a config](../tutorials/import-and-edit.md).

## Validation

- **Lint Sheets**: Validates data and highlights issues.
  - Use before every export.
  - See [Run linting](../how-to/run-linting.md).

## Maintenance

- **Reset Spreadsheet**: Removes translation sheets and metadata.
  - **Warning:** This cannot be undone.
  - See [Reset the spreadsheet](../how-to/reset-spreadsheet.md).

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
