# Translation sheets

Translation sheets store localized values for categories, field labels, helper text, and options.

## Sheet types

- Category Translations
- Detail Label Translations
- Detail Helper Text Translations
- Detail Option Translations

## Structure

- **Column A** is auto-synced from the source sheet via formula.
- **Columns B+** are translation columns for each language.

Do not remove the formulas in column A.

Example formula: `=Categories!A2:A100`

## Header formats

Supported header formats include:

- Language name: `Spanish`, `Español`, `Portuguese`, `Português`
- ISO/BCP-47 code: `es`, `pt`, `quz`, `pt-BR`, `zh-Hans`
- Name + code: `Spanish - es`, `Português - pt`

Invalid example: `Spanish (es)`

## Legacy layout

Some older sheets include:

- Column B = ISO
- Column C = Source

These columns are informational and ignored. Translations start at Column D.

## Formula templates

- Category Translations: `=Categories!A2:A[lastRow]`
- Detail Label Translations: `=Details!A2:A[lastRow]`
- Detail Helper Text Translations: `=Details!B2:B[lastRow]`
- Detail Option Translations: `=Details!D2:D[lastRow]`

## Option counts

For **Detail Option Translations**, each translation must have the same number of comma-separated options as the source.
