# Generate a config

Use this to build a `.comapeocat` file from your spreadsheet.

## Before you generate

- Run linting and fix all errors.
- Ensure at least one category has `track` in **Applies**.
- Check that all icons are accessible.
- If you use translations, run **Manage Languages & Translate** first so sheets are up to date.

## Steps

1. Open **CoMapeo Tools → Generate CoMapeo Category**.
2. Confirm the prompt.
3. Wait for the progress dialog to complete.

## What happens

- Sheets are validated.
- JSON is generated for categories, fields, icons, and translations.
- The build API packages the config and returns a `.comapeocat` file.
- The file is saved to your Google Drive.

You will see a progress dialog for these stages.

Typical stages:

- Validating and linting sheets
- Building the JSON payload
- Packaging and saving the file

## Common issues

- Missing required fields → Run linting.
- Invalid icon URL → Check icon references or use inline SVG.
- Translation mismatch → Fix column A formulas.
- Timeout → Large configs can take longer; try again.

## After generation

- A `.comapeocat` file is saved to Drive.
- A shareable `.zip` may also be saved.
- Test the configuration in CoMapeo immediately.

Need to load it on a device? See [Create your first config](../tutorials/create-first-config.md).
