# Details sheet

Define all fields that can be associated with categories.

## Columns

### Name (Column A, required)

Field name shown to users.

Examples: `Name`, `Width`, `Status`.

### Helper Text (Column B)

Question or instruction shown to users.

Example: `What is the width in meters?`

### Type (Column C)

Determines input method:

- `t` or `text` - free-form text
- `n` or `number` - numeric input
- `m` or `multiple` - multi-select
- blank or `s` or `select` - single-select

Type values are case-insensitive.

### Options (Column D)

Comma-separated choices. Required for `select` and `multiple` types.

Example: `Good, Fair, Poor`

### Field ID (Column E)

Auto-generated unique ID. Leave blank and do not edit manually.

### Universal (Column F)

- `TRUE` - field appears for all categories
- `FALSE` or blank - only appears when listed in Categories → Fields

Note: Universal is not currently implemented in the CoMapeo app.
