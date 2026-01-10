# comapeo-config-spreadsheet-plugin v2.0.0

A Google Sheets plugin for generating and importing `.comapeocat` category files for CoMapeo projects.

## What's New in v2.0.0

- **JSON-only API**: Removed ZIP workflow entirely. The plugin now sends JSON directly to the API.
- **Import functionality**: Import existing `.comapeocat` files back into the spreadsheet for editing.
- **Category ordering**: Categories are built in exact spreadsheet order using `setCategorySelection`.
- **Simplified codebase**: Removed all ZIP-related code for better performance and maintainability.

## Features

- **Build**: Generate `.comapeocat` files from spreadsheet data
- **Import**: Load existing `.comapeocat` or `.mapeosettings` files for editing
- **Auto-translation**: Automatically translate categories and fields using Google Translate
- **Icon generation**: Generate icons using https://icons.earthdefenderstoolkit.com or provide your own SVG/PNG icons
- **Validation**: Comprehensive linting and validation of spreadsheet data
- **Dual-name language support**: Set primary language using English OR native names (e.g., "Portuguese" or "Português")

## API Usage

### Build Endpoint

The plugin uses `POST /build` with JSON payload:

```
POST http://your-server:3000/build
Content-Type: application/json
```

#### Request Body

```json
{
  "metadata": {
    "name": "Forest Monitoring",
    "version": "1.0.0",
    "description": "Configuration for forest surveys",
    "builderName": "comapeo-config-spreadsheet-plugin",
    "builderVersion": "2.0.0"
  },
  "categories": [
    {
      "id": "trees",
      "name": "Trees",
      "color": "#4CAF50",
      "defaultFieldIds": ["species", "diameter"]
    }
  ],
  "fields": [
    {
      "id": "species",
      "name": "Species",
      "type": "select",
      "options": [
        { "value": "oak", "label": "Oak" },
        { "value": "pine", "label": "Pine" }
      ]
    },
    {
      "id": "diameter",
      "name": "Diameter (cm)",
      "type": "number"
    }
  ],
  "icons": [
    {
      "id": "trees",
      "svgUrl": "https://example.com/tree-icon.svg"
    }
  ],
  "translations": {
    "es": {
      "categories": {
        "trees": { "name": "Arboles" }
      },
      "fields": {
        "species": {
          "name": "Especie",
          "options": { "oak": "Roble", "pine": "Pino" }
        }
      }
    }
  }
}
```

#### Response

- **Success (200)**: Binary `.comapeocat` file
  - `Content-Type: application/octet-stream`
  - `Content-Disposition: attachment; filename="name.comapeocat"`

- **Error**: JSON response
  ```json
  {
    "error": "VALIDATION_ERROR",
    "message": "Invalid configuration",
    "details": { "errors": ["Missing required field: name"] }
  }
  ```

## Category Ordering

Categories are processed in the exact order they appear in the spreadsheet. The plugin calls `setCategorySelection([...])` with an array of category IDs in spreadsheet order to preserve this ordering.

## Spreadsheet Structure

### Categories Sheet
| Column A | Column B | Column C | Column D | Column E | Column F |
|----------|----------|----------|----------|----------|----------|
| Name     | Icon URL | Fields   | Applies  | Category ID | Icon ID  |
| Trees    | http://... | species, diameter | observation, track | trees | trees |

- **Column A (Name)**: Category name (Required)
- **Column B (Icon URL)**: SVG/PNG data or URL to icon (Required) - supports Drive URLs, data URIs, inline SVG, or auto-generated from https://icons.earthdefenderstoolkit.com
- **Column C (Fields)**: Comma-separated list of field names from Details sheet
- **Column D (Applies)**: What this category applies to: `observation`, `track`, or both (comma-separated). Accepts shorthand: `o`, `t`. Defaults to `observation` if blank. **At least one category must include `track`.**
- **Column E (Category ID)**: Category ID (auto-generated from name if blank)
- **Column F (Icon ID)**: Icon ID (auto-generated from Category ID if blank)

### Details Sheet
| Column A | Column B | Column C | Column D | Column E | Column F |
|----------|----------|----------|----------|----------|----------|
| Name     | Helper Text | Type | Options | Field ID | Universal |
| Species  | Select tree species | s | Oak, Pine | species | FALSE |
| Diameter | Enter trunk diameter | n | | diameter | FALSE |

- **Column A (Name)**: Field name (Required)
- **Column B (Helper Text)**: Help text shown to users
- **Column C (Type)**: Single-character type code (see below). Defaults to `s` (select) if blank.
- **Column D (Options)**: For select/multiselect, comma-separated options (Required for type `s` or `m`)
- **Column E (Field ID)**: Field ID (auto-generated from name if blank)
- **Column F (Universal)**: TRUE if field appears in all categories automatically

**Type codes:**
- `t` = text (single line)
- `T` = textarea (multi-line)
- `n` = number
- `i` = integer
- `s` or blank = select (single choice dropdown)
- `m` = multiselect (multiple choice)
- `b` = boolean
- `d` = date
- `D` = datetime
- `p` = photo
- `l` = location

## Installation

1. Install clasp globally:
```bash
npm install -g @google/clasp
```

2. Login to your Google account:
```bash
clasp login
```

3. Enable the Google Apps Script API in your Google Cloud Console.

4. Push your local changes:
```bash
clasp push
```

5. Open in the Apps Script editor:
```bash
clasp open
```

## Development

```bash
# Watch mode - auto-push on changes
npm run dev

# Manual push
npm run push

# Lint code
npm run lint

# Push to all configured projects
npm run push:all
```

## Testing

Run tests from the Apps Script editor console:

```javascript
runAllTests();
```

Tests cover:
- Build payload creation
- Category ordering preservation
- Field type mapping
- Import parsing
- API error handling

## Menu Options

1. **Manage Languages & Translate** - Auto-translate content to multiple languages or add manual-only languages
2. **Generate Category Icons** - Generate icons from https://icons.earthdefenderstoolkit.com
3. **Generate CoMapeo Category** - Build `.comapeocat` file
4. **Import Category File** - Import existing `.comapeocat` or `.mapeosettings` file
5. **Lint Sheets** - Validate spreadsheet data with color-coded error highlighting
6. **Reset Spreadsheet** - Clear translations and metadata
7. **Help** - Show documentation

## Sharing Configurations

After generating a `.comapeocat` file:
1. The file is saved to your computer's Downloads folder
2. Upload it to Google Drive (or any cloud storage)
3. Share the Drive link with CoMapeo users
4. Users can download directly on their phone from the Drive link and import into CoMapeo

## License

See LICENSE file for details.

For more information on using clasp, refer to the [@google/clasp documentation](https://github.com/google/clasp).

## Project Documentation

All architectural references, process guides, and sprint notes live under [`docs/`](docs/README.md). Start with the documentation index to find the right reference quickly.
