# Add icons

Icons can be added in several formats. Inline SVG from the icon app is the most reliable option.

## Recommended: inline SVG (best results)

1. Go to https://icons.earthdefenderstoolkit.com
2. Search for a category name (e.g., `river`, `building`).
3. Choose an icon and color.
4. Click **Copy SVG**.
5. Paste the SVG directly into the **Icon** column (B).

Example:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
<path fill="#194d33" fill-rule="evenodd" d="..."/>
</svg>
```

## Alternative: plain text lookup

1. Type a simple keyword in the **Icon** column (e.g., `river`, `forest`).
2. During export, the plugin searches https://icons.earthdefenderstoolkit.com.

This is faster but can return less accurate matches.

## Generate icons (menu)

1. Open **CoMapeo Tools → Generate Category Icons**.
2. Choose from previewed icons.
3. Icons are saved to Drive and the **Icon** column is updated with Drive URLs.

Tips:

- Search works best with common English terms (e.g., `river`, `building`).
- Requires an internet connection for the icon API.
- You can edit icons afterward at https://icons.earthdefenderstoolkit.com.

## Supported formats

- Inline SVG (recommended)
- Plain text keywords (auto lookup)
- Drive URLs (`https://drive.google.com/file/d/FILE_ID/view`)
- Cell images (paste into the cell)
- Data URIs (`data:image/svg+xml,...`)
- HTTPS URLs
- SVG and PNG files (PNG is converted to SVG)

## Troubleshooting

- If icons fail, run linting and fix any red text in the Icon column.
- If using Drive URLs, confirm the file is shared with “View” access.
