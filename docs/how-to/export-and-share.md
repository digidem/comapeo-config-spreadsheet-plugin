# Export and share

## Run linting

1. Open **CoMapeo Tools → Lint Sheets**.
2. Wait for validation to finish (usually 5-15 seconds).
3. Fix highlighted cells.
4. Run **Lint Sheets** again to confirm all issues are resolved.

Fix bright red (critical) errors before generating.

### Priority order

1. Bright red background + white text (critical)
2. Light red background (invalid/duplicate values)
3. Yellow (missing required data or warnings)
4. Red text (invalid references or URLs)
5. Orange text (HTTP warning)

See [Linting rules](../reference/linting-rules.md) for color meanings.

## Generate a config

### Before you generate

- Run linting and fix all errors.
- Ensure at least one category has `track` in **Applies**.
- Check that all icons are accessible.
- If you use translations, run **Manage Languages & Translate** first so sheets are up to date.

### Steps

1. Open **CoMapeo Tools → Generate CoMapeo Category**.
2. Confirm the prompt.
3. Wait for the progress dialog to complete.

### What happens

- Sheets are validated.
- JSON is generated for categories, fields, icons, and translations.
- The build API packages the config and returns a `.comapeocat` file.
- The file is saved to your Google Drive.

Typical stages:

- Validating and linting sheets
- Building the JSON payload
- Packaging and saving the file

### Common issues

- Missing required fields → Run linting.
- Invalid icon URL → Check icon references or use inline SVG.
- Translation mismatch → Fix column A formulas.
- Timeout → Large configs can take longer; try again.

## Share and load a config

### Share the file

When generation completes, the `.comapeocat` file is already saved in your Google Drive.

1. Open Google Drive and locate the file.
2. Right-click → **Get link**.
3. Change access to **Anyone with the link can view**.
4. Share the link by email, chat, or another channel.

You can also share the `.zip` copy if it was created.

### Load into CoMapeo

1. On the device, open the Drive link.
2. Download the `.comapeocat` file.
3. In CoMapeo, go to **Menu → Coordinator Tools → Update Project Categories → Import**.
4. Select **Import Categories** and choose the file.
5. Verify categories, icons, and translations in the app.

### Alternative transfer options

- Email the file as an attachment
- Use other cloud storage (Dropbox, OneDrive)
- Transfer via USB
