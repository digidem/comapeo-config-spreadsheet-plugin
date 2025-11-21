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
| Column A | Column B | Column C | Column D |
|----------|----------|----------|----------|
| Name     | Icon URL | Fields   | Color    |
| Trees    | http://... | species, diameter | (background color) |

### Details Sheet
| Column A | Column B | Column C | Column D | Column E | Column F |
|----------|----------|----------|----------|----------|----------|
| Name     | Helper Text | Type | Options | | Universal |
| Species  | Select tree species | s | Oak, Pine | | FALSE |
| Diameter | Enter trunk diameter | n | | | FALSE |

**Type codes:**
- `t` = text
- `n` = number
- `s` = select (single choice)
- `m` = multiselect (multiple choice)

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

For more information on clasp, refer to the [@google/clasp documentation](https://github.com/google/clasp).
