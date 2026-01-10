# CoMapeo Config Spreadsheet Plugin - User Guide

## Overview

The CoMapeo Config Spreadsheet Plugin allows you to create, edit, and manage CoMapeo configuration files directly in Google Sheets. This guide covers all major workflows for working with the plugin.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating a New Configuration](#creating-a-new-configuration)
3. [Exporting a Configuration](#exporting-a-configuration)
4. [Importing an Existing Configuration](#importing-an-existing-configuration)
5. [Working with Translations](#working-with-translations)
6. [Data Validation and Linting](#data-validation-and-linting)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Plugin

Once the plugin is installed in your Google Sheet, you'll see a custom menu at the top:

**"CoMapeo Config"** → Various options for generating, importing, and managing configurations

### Sheet Structure

The spreadsheet contains several sheets:

- **Categories**: Define observation categories (presets)
- **Details**: Define field definitions for data collection
- **Category Translations**: Translations for category names
- **Detail Label Translations**: Translations for field labels
- **Detail Helper Text Translations**: Translations for helper text
- **Detail Option Translations**: Translations for dropdown options
- **Metadata**: Configuration metadata (dataset ID, name, version)

### Setting the Primary Language

**Cell A1 of the Categories sheet** determines the primary language for your configuration.

**Important**: You can now use **either the English name or the native name** of a language:
- ✅ "Portuguese" or "Português" both work for Portuguese
- ✅ "Spanish" or "Español" both work for Spanish
- ✅ "French" or "Français" both work for French
- ✅ Case-insensitive: "PORTUGUESE", "portuguese", or "Portuguese" all work

**Example:**
```
Cell A1: Portuguese    (English form)
Cell A1: Português     (Native form)
Cell A1: PORTUGUESE    (Any case)
```

All three examples above will correctly set Portuguese as the primary language.

**Supported Languages**: The plugin supports 142 languages. If you enter an unsupported language, you'll see a helpful error message with suggestions.

---

## Creating a New Configuration

### 1. Define Categories

In the **Categories** sheet:

| Column | Description | Required | Format |
|--------|-------------|----------|--------|
| Name (A) | Category name | Yes | Text (e.g., "River", "Building"). Background color of this cell sets category color. |
| Icon (B) | Icon reference | Yes | Drive URL, icon name, inline SVG, data URI, or cell image |
| Fields (C) | Comma-separated field names | No | "field1, field2, field3" (also called "Details") |
| Applies (D) | Where category can be used | Auto-created | "observation", "track", or "observation, track" |
| Category ID (E) | Unique identifier | Auto-created | Auto-generated slug |

**Example:**
```
Name: River (with blue background color #0066CC)
Icon: river (or https://drive.google.com/file/d/1abc...)
Fields: name, width, depth
Applies: observation
Category ID: river-001 (auto-generated)
```

### 2. Define Details (Fields)

In the **Details** sheet:

| Column | Description | Required | Format |
|--------|-------------|----------|--------|
| Name (A) | Field name | Yes | Text (e.g., "Name", "Width") |
| Helper Text (B) | Help text for users | No | Text question or instruction |
| Type (C) | Field type | No* | blank/"s"/"select" = dropdown, "m"/"multiple" = multi-select, "n"/"number" = number, "t"/"text" = text |
| Options (D) | Dropdown options | Yes* | Comma-separated (e.g., "Small, Medium, Large") |
| (Column E) | Reserved | No | Leave blank |
| Universal (F) | Available to all categories | No | Exactly "TRUE" or "FALSE" or blank |

\* Type defaults to dropdown if blank. Options are required for dropdown and multi-select fields. Case-insensitive.

**Example:**
```
Name: Width
Helper Text: Enter the width in meters
Type: n
Options: (blank for numbers)
Universal: FALSE
```

### 3. Add Translations (Optional)

For each translation sheet, add columns for target languages:

1. **Header Format**: Use language code (e.g., "es", "pt") or "Language Name - ISO" format (e.g., "Español - es")
2. **Populate**: Fill in translated values for each row

---

## Exporting a Configuration

### Step-by-Step

1. **Open the Menu**: Click **CoMapeo Config** → **Generate CoMapeo Category**

2. **Select Languages** (if translations exist):
   - Check boxes for languages to include
   - Click "Generate"

3. **Progress Dialog**: A progress window shows the export status:
   - Processing translations
   - Generating configuration files
   - Creating icon sprite
   - Packaging configuration

4. **Download**: When complete, the `.comapeocat` file downloads automatically

### What's Included

The exported `.comapeocat` file contains:

- `presets.json` - Category definitions
- `fields.json` - Field definitions
- `icons.svg` - Icon sprite with all category icons (or individual PNG files)
- `translations.json` - All translations for selected languages
- `metadata.json` - Configuration metadata

### Sharing the Configuration

After generating the `.comapeocat` file:

1. **Upload to Google Drive:**
   - Go to Google Drive
   - Click "New" → "File upload"
   - Select the downloaded `.comapeocat` file

2. **Get shareable link:**
   - Right-click the file in Google Drive
   - Click "Get link"
   - Change to "Anyone with the link can view"
   - Copy the link

3. **Share the link** with CoMapeo users via email, WhatsApp, SMS, etc.

4. **Users download on mobile:**
   - Open the Drive link on their phone
   - Download the file from Google Drive
   - Open CoMapeo app
   - Go to Settings → Configuration → Import Configuration
   - Select the downloaded file

---

## Importing an Existing Configuration

### Step-by-Step

1. **Open the Menu**: Click **CoMapeo Config** → **Import Category File**

2. **Upload File**:
   - Click "Choose File"
   - Select a `.comapeocat` or `.mapeosettings` file
   - Click "Upload"

3. **Processing**: The plugin will:
   - Extract the archive
   - Parse configuration files
   - Extract icons from the sprite
   - Upload icons to your Google Drive
   - Populate all spreadsheet sheets

4. **Verification**: Check that all sheets are populated correctly:
   - Categories sheet has category names and icon URLs
   - Details sheet has field definitions
   - Translation sheets have translations (if present in the file)

### Important Notes

- **Backup**: The import process clears existing data. Save a copy of your spreadsheet first!
- **Icons**: Icons are extracted and saved to your Google Drive. The icon URLs in the Categories sheet point to these Drive files.
- **Translations**: All available translations from the imported file are populated in the translation sheets.

---

## Working with Translations

### Adding a New Language

1. **Open a Translation Sheet** (e.g., Category Translations)

2. **Add Column**: Insert a new column after the last language column

3. **Add Header**: Enter the language code or "Language Name - ISO" format
   - Examples: "es", "pt", "Español - es", "Português - pt"

4. **Translate**: Fill in translations for each row

5. **Manage Languages & Translate** (Optional):
   - Click **CoMapeo Config** → **Manage Languages & Translate**
   - Select the languages to auto-translate and add any manual-only languages you want to maintain yourself
   - The plugin adds manual languages to every translation sheet and uses Google Translate for the selected targets
   - **Note**: Always review auto-translations for accuracy

### Translation Best Practices

- **Consistency**: Use the same translation across all sheets for the same term
- **Context**: Provide contextual translations appropriate for field data collection
- **Review**: Always review auto-translations with a native speaker
- **Test**: Export and test the configuration in CoMapeo to verify translations appear correctly

---

## Data Validation and Linting

### Running the Linter

The plugin includes automatic data validation:

1. **Manual Run**: Click **CoMapeo Config** → **Lint All Sheets**

2. **What It Checks**:
   - Required fields are filled in
   - Icon URLs are valid
   - Field types are correct
   - Dropdown fields have options
   - Translation sheets match source sheets
   - Universal flag is TRUE/FALSE or blank
   - No duplicate category/detail names
   - No unreferenced details
   - No duplicate slugs in translations
   - Translation headers are valid language codes

3. **Understanding Highlights**:
   - **Yellow**: Required fields missing, unreferenced details, or translation row mismatches
   - **Red**: Invalid values, missing icons, missing options, invalid Universal flags, or invalid translation headers
   - **Red text**: Invalid URLs
   - **Pink**: Duplicate values, invalid references, or option count mismatches
   - **Orange**: Duplicate slugs in translations or invalid ISO codes

### Fixing Validation Issues

1. **Review Highlights**: Check cells with colored backgrounds

2. **Check Console**: Open **Extensions** → **Apps Script** → View logs for detailed error messages

3. **Fix Issues**:
   - Fill in missing required fields (yellow)
   - Fix invalid values (red)
   - Remove duplicates (pink)
   - Resolve duplicate slugs (orange)

4. **Re-Run Linter**: Verify issues are resolved

### Auto-Cleanup

The linter automatically:
- Capitalizes first letters of category/detail names
- Formats comma-separated lists
- Removes whitespace-only cells
- Highlights issues for manual review

---

## Troubleshooting

### Export Issues

**Problem**: Export fails or produces errors

**Solutions**:
1. Run the linter to check for validation issues
2. Verify all required fields are filled in
3. Check that icon URLs are valid Google Drive URLs
4. Ensure dropdown/multi-select fields have options

### Import Issues

**Problem**: Import fails or data doesn't appear correctly

**Solutions**:
1. Verify the file is a valid `.comapeocat` or `.mapeosettings` file
2. Check the console logs for specific error messages
3. Try importing a different file to isolate the issue
4. Ensure you have permission to create files in your Google Drive

### Icon Issues

**Problem**: Icons don't appear or URLs are broken

**Solutions**:
1. Icons can be: Drive URLs, icon names (e.g., "river"), inline SVG, data URIs, or cell images
2. Use "Generate Category Icons" to auto-search https://icons.earthdefenderstoolkit.com
3. For Drive URLs, verify URLs start with `https://drive.google.com/`
4. Check that you have permission to access the icon files
5. After import, verify icons are in your Google Drive
6. Try using simple icon names instead of URLs (e.g., "river", "building", "tree")
7. Edit icons manually at https://icons.earthdefenderstoolkit.com

### Translation Issues

**Problem**: Translations are missing or incorrect

**Solutions**:
1. Verify translation sheet headers are valid language codes
2. Check that row counts match between source and translation sheets
3. For option translations, verify option counts match
4. Run the linter to check for duplicate slugs
5. Review auto-translations for accuracy and context

### Language Recognition Issues

**Problem**: Error says language is not supported

**Solutions**:
1. You can use either English or native language names (e.g., "Portuguese" or "Português")
2. Check for typos in the language name
3. Language names are case-insensitive ("PORTUGUESE" works the same as "Portuguese")
4. The error message will show you examples of valid language names
5. Supported languages include all major world languages (142 total)

**Example Valid Inputs for Common Languages**:
- Portuguese: "Portuguese", "Português", "portuguese", "PORTUGUÊS"
- Spanish: "Spanish", "Español", "SPANISH", "español"
- French: "French", "Français", "FRENCH", "français"
- German: "German", "Deutsch", "GERMAN", "deutsch"
- Chinese: "Chinese Simplified", "简体中文", "Chinese Traditional", "繁體中文"
- Japanese: "Japanese", "日本語", "JAPANESE"
- Arabic: "Arabic", "العربية", "ARABIC"

### Performance Issues

**Problem**: Slow processing or timeouts

**Solutions**:
1. Reduce the number of categories/details if possible
2. Process fewer languages at once during export
3. For large imports, be patient (can take 1-2 minutes)
4. Clear console logs and browser cache

---

## Best Practices

1. **Regular Backups**: Make a copy of your spreadsheet before major changes

2. **Lint Often**: Run the linter after making changes to catch issues early

3. **Test Exports**: Export and test configurations in CoMapeo before sharing

4. **Organize Icons**: Store all icons in a dedicated Drive folder for easy management

5. **Version Control**: Use the Metadata sheet to track configuration versions

6. **Document Changes**: Keep notes on what changed between versions

7. **Collaborate**: Share the spreadsheet with team members for collaborative editing

8. **Translation Review**: Always have native speakers review auto-translations

---

## Additional Resources

- **CoMapeo Documentation**: https://docs.comapeo.app/
- **Google Sheets Help**: https://support.google.com/docs/topic/9054603
- **Report Issues**: Check the plugin repository for issue reporting

---

## Support

For questions or issues:

1. Check this guide for common solutions
2. Review console logs for error messages
3. Verify data validation with the linter
4. Contact your system administrator or project lead

---

**Version**: 1.0.0
**Last Updated**: 2025-10-11
