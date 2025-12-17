# comapeo-config-spreadsheet-plugin v2.0.0

A Google Sheets plugin for generating and importing `.comapeocat` category files for CoMapeo projects.

## What's New in v2.0.0

- **JSON-only API**: Removed ZIP workflow entirely. The plugin now sends JSON directly to the API.
- **Import functionality**: Import existing `.comapeocat` files back into the spreadsheet for editing.
- **Category ordering**: Categories are built in exact spreadsheet order using `setCategorySelection`.
- **Simplified codebase**: Removed all ZIP-related code for better performance and maintainability.

## Features

- **Build**: Generate `.comapeocat` files from spreadsheet data
- **Import**: Load existing `.comapeocat` files for editing
- **Auto-translation**: Automatically translate categories and fields
- **Icon generation**: Generate icons using external API
- **Validation**: Lint and validate spreadsheet data

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
| Name     | Icon URL | Fields   | ID       | Color    | Icon ID  |
| Trees    | http://... | species, diameter | trees | #4CAF50 | trees |

- **Column A (Name)**: Category name
- **Column B (Icon URL)**: SVG data or URL to icon
- **Column C (Fields)**: Comma-separated list of field names
- **Column D (ID)**: Category ID (optional, auto-generated from name if blank)
- **Column E (Color)**: Hex color code (uses background color of Column A if blank)
- **Column F (Icon ID)**: Icon ID (optional, uses Category ID if blank and icon data is present)

### Details Sheet
| Column A | Column B | Column C | Column D | Column E | Column F |
|----------|----------|----------|----------|----------|----------|
| Name     | Helper Text | Type | Options | ID | Universal |
| Species  | Select tree species | s | Oak, Pine | species | FALSE |
| Diameter | Enter trunk diameter | n | | diameter | FALSE |

- **Column A (Name)**: Field name
- **Column B (Helper Text)**: Help text shown to users
- **Column C (Type)**: Single-character type code (see below)
- **Column D (Options)**: For select/multiselect, comma-separated options
- **Column E (ID)**: Field ID (optional, auto-generated from name if blank)
- **Column F (Universal)**: TRUE if field appears in all categories

**Type codes:**
- `t` = text (single line)
- `T` = textarea (multi-line)
- `n` = number
- `i` = integer
- `s` = select (single choice)
- `m` = multiselect (multiple choice)
- `b` = boolean
- `d` = date
- `D` = datetime
- `p` = photo
- `l` = location

**Note**: Old spreadsheets using the 4-column Categories format (Name, Icon, Fields, Color) will be automatically migrated to the new 6-column format when building a config.

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

1. **Translate CoMapeo Category** - Auto-translate content
2. **Add Custom Languages** - Add new language support
3. **Generate Category Icons** - Generate icons from external API
4. **Generate CoMapeo Category** - Build `.comapeocat` file
5. **Import CoMapeo Category** - Import existing `.comapeocat` file
6. **Lint Sheets** - Validate spreadsheet data
7. **Reset Spreadsheet** - Clear translations and metadata
8. **Help** - Show documentation

## License

See LICENSE file for details.

For more information on using clasp, refer to the [@google/clasp documentation](https://github.com/google/clasp).

## Project Documentation

All architectural references, process guides, and sprint notes live under [`docs/`](docs/README.md). Start with the documentation index to find the right reference quickly.
