# comapeo-config-spreadsheet-plugin v2.0.0

A Google Sheets plugin for generating and importing `.comapeocat` category files for CoMapeo projects.

## What's New in v2.0.0

- **JSON build flow**: The plugin sends a JSON build request to the v2 API, which returns a packaged `.comapeocat` (ZIP) file.
- **Import functionality**: Import existing `.comapeocat` files back into the spreadsheet for editing.
- **Category ordering**: Categories are built in exact spreadsheet order using `setCategorySelection`.
- **Simplified packaging**: Local ZIP creation is no longer part of the generation flow; packaging happens on the API side.

## Features

- **Build**: Generate `.comapeocat` files from spreadsheet data
- **Import**: Load existing `.comapeocat` or `.mapeosettings` files for editing
- **Auto-translation**: Automatically translate categories and fields using Google Translate
- **Icon generation**: Generate icons using https://icons.earthdefenderstoolkit.com or provide your own SVG/PNG icons
- **Validation**: Comprehensive linting and validation of spreadsheet data
- **Dual-name language support**: Set primary language using English OR native names (e.g., "Portuguese" or "Português")

## API Usage

### Build Endpoint

The plugin uses the v2 JSON build endpoint:

```
POST http://your-server:3000/v2
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
  "locales": ["en"],
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

The User Guide is the canonical source for sheet tabs, columns, and rules. See `USER_GUIDE.md` (Understanding Your Spreadsheet).

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

After generating a `.comapeocat` file, the plugin saves it to a Drive folder and provides a link for sharing. See `USER_GUIDE.md` for the current end-to-end sharing steps.

## License

See LICENSE file for details.

For more information on using clasp, refer to the [@google/clasp documentation](https://github.com/google/clasp).

## Project Documentation

- **User Guide is the source of truth** for user-facing behavior and spreadsheet structure: see [`USER_GUIDE.md`](USER_GUIDE.md).
- All architectural references, process guides, and sprint notes live under [`docs/`](docs/README.md). Start with the documentation index to find the right reference quickly.
