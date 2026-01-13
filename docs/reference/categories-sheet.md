# Categories sheet

Define the main observation types users will record in the field.

## Columns

### Name (Column A, required)

- Category name in your primary language.
- The **background color** of this cell becomes the category color in CoMapeo.
- Used as the border color in the category list and the dot color on the map.
- Examples: `River`, `Building`, `Animal Sighting`.

### Icon (Column B, required)

Accepted formats:

- Inline SVG (recommended)
- Plain text keyword (auto-lookup)
- Drive URL (`https://drive.google.com/file/d/FILE_ID/view`)
- Cell image
- Data URI
- HTTPS URL

See [Categories sheet tasks](../how-to/categories-sheet-tasks.md#add-icons).

PNG files are converted to SVG during export. PNG sprites are not fully supported.

### Fields (Column C)

Comma-separated list of field names this category uses. Field names must exist in the Details sheet.

Example: `Name, Width, Condition`

This column may be labeled **Details** in older templates.

### Applies (Column D)

Where this category is used:

- `observation`
- `track`
- `observation, track`
- Abbreviations `o`, `t` are accepted

**Requirement:** At least one category must include `track`.

If the column is missing, the plugin auto-creates it with `observation, track` for the first row.

### Category ID (Column E)

Auto-generated unique ID used during import/export. Avoid manual edits.

Changing an ID after data collection can break links to existing observations in CoMapeo.

## Notes

- Do not place hex colors in **Applies**. Colors are set via the background color of column A.
