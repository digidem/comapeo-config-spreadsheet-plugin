# CoMapeo Category Set Spreadsheet Plugin - User Guide

## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
- [Understanding Your Spreadsheet](#understanding-your-spreadsheet)
- [Basic Workflow](#basic-workflow)
- [Menu Features](#menu-features)
- [Data Validation (Linting)](#data-validation-linting)
- [Troubleshooting](#troubleshooting)

---

## Overview

The CoMapeo Category Set Spreadsheet Plugin allows you to create and manage CoMapeo field data collection configurations directly in Google Sheets. This tool transforms your spreadsheet data into `.comapeocat` files that can be loaded into the CoMapeo mobile or desktop app for field data collection.

**What you can do:**
- Define observation categories (e.g., River, Building, Animal)
- Create custom data fields (e.g., Name, Width, Status)
- Add icons and colors for each category
- Manage translations for multiple languages
- Export configurations ready for CoMapeo
- Import existing configurations for editing

---

## Getting Started

### Prerequisites
- A Google account with access to Google Sheets
- The CoMapeo Category Set Spreadsheet template: https://docs.google.com/spreadsheets/d/1bvtbSijac5SPz-pBbeLBhKby6eDefwweLEBmjAOZnlk/edit?usp=drivesdk

### First Steps
1. **Make a copy** of the template spreadsheet
   - File → Make a copy
   - Give it a descriptive name (e.g., "Wildlife Monitoring Config")

2. **Familiarize yourself** with the spreadsheet tabs (see next section)

3. **Set your primary language** (see Understanding Your Spreadsheet)

---

## Understanding Your Spreadsheet

Your spreadsheet contains several tabs, each serving a specific purpose:

**📸 Screenshot placeholder:** *Overview of all spreadsheet tabs shown in bottom tab bar*

### Core Data Tabs

#### 1. Categories Sheet
**Purpose:** Define the main observation types users will record in the field.

**📸 Screenshot placeholder:** *Categories sheet showing columns: Name, Icon, Fields, Applies, Category ID*

**Columns:**
- **Name** (Column A, Required): Category name in your primary language
  - Examples: "River", "Building", "Animal Sighting"
  - The background color of cells in this column sets the category color (not a separate column)
  - This color appears in the CoMapeo app as:
    - **Border color** around categories on the category selection screen
    - **Dot color** for observation markers on the map

- **Icon** (Column B, Required): Icon reference for your category
  - **Recommended: Use Earth Defenders Toolkit Icon App** (best results):
    1. Visit https://icons.earthdefenderstoolkit.com
    2. Search for your category name (e.g., "river", "forest", "building")
    3. Select the best matching icon and choose your color
    4. Click "Copy SVG" to copy the inline SVG code
    5. Paste the SVG code directly into the Icon column

    Example format:
    ```svg
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <path fill="#194d33" fill-rule="evenodd" d="..."/>
    </svg>
    ```
  - **Alternative: Simple text** for automatic lookup:
    - Examples: `river`, `building`, `tree`, `forest`, `animal`
    - Plugin searches https://icons.earthdefenderstoolkit.com during export
    - ⚠️ Automatic search may not find the best icon match
  - **Other supported formats:**
    - **Drive URL**: `https://drive.google.com/file/d/FILE_ID/view` (SVG or PNG; PNG converted to SVG)
    - **Cell image**: Paste an image directly into the cell
    - **Data URI**: `data:image/svg+xml,...`
    - **HTTPS URL**: `https://example.com/icon.svg`

- **Fields** (Column C): Comma-separated list of field names this category uses
  - Example: `Name, Width, Depth, Water quality`
  - Fields must exist in the Details sheet
  - Also called "Details" in some versions

- **Applies** (Column D, Auto-created): Where this category can be used
  - ⚠️ **CRITICAL: At least one category MUST include "track"!**
  - Options: `observation`, `track`, or both (comma-separated)
  - Abbreviations: `o`, `t`, `o, t` also work
  - Examples:
    - `observation` - regular observations only
    - `track` - GPS tracks only (required for at least one category!)
    - `observation, track` - both types
  - Default: `observation, track` (auto-created for first row if missing)
  - **DO NOT put hex color codes here!** Colors come from Name column background

- **Category ID** (Column E, Auto-created): Unique identifier for the category
  - Auto-generated if not present
  - Used for importing/exporting
  - ⚠️ **Important:** If you change this ID after observations have been collected, those observations will no longer be linked to this category in the CoMapeo app
  - Usually you don't need to edit this

**Example row:**
| Name | Icon | Fields | Applies | Category ID |
|------|------|--------|---------|-------------|
| River | river | Name, Width, Depth | observation | river-001 |

**Note about colors:** Set the background color of the Name cell (Column A) to define the category color. This color appears in the CoMapeo app as the category border color and the map dot color.

**📸 Screenshot placeholder:** *Categories sheet with colored Name cells showing different category colors*

**Note about icons - RECOMMENDED: Use inline SVG**
The best results come from pasting inline SVG from the Icon App directly:
- Visit https://icons.earthdefenderstoolkit.com, pick an icon + color, then click "Copy SVG"
- Paste the SVG directly into the Icon column
- Plain text still works for automatic lookup, but results may be less accurate

**Other supported formats** (less common):
- **Drive URL**: Upload custom icon to Drive, paste link
- **Cell image**: Paste image directly into cell
- **Data URI**: `data:image/svg+xml,...`

---

#### 2. Details Sheet
**Purpose:** Define all the data fields that can be associated with categories.

**📸 Screenshot placeholder:** *Details sheet showing columns: Name, Helper Text, Type, Options, (blank), Universal*

**Columns:**
- **Name** (Column A, Required): Field name
  - Examples: "Name", "Width", "Status"

- **Helper Text** (Column B): Question or instruction shown to users
  - Example: "What is the width in meters?"
  - Helps users understand what data to enter

- **Type** (Column C): Determines input method
  - `t` or `text` - Free-form text input
  - `n` or `number` - Numeric input
  - `m` or `multiple` - Multiple choice (checkboxes)
  - Blank or `s` or `select` - Single choice (checkbox)
  - Case insensitive: `TEXT`, `Text`, `text` all work

- **Options** (Column D, Required for select fields): Comma-separated choices
  - Example: `Small, Medium, Large`
  - Example: `Good, Fair, Poor`
  - Required if Type is blank, `s`, or `m`
  - Ignored if Type is `t` or `n` (text and number fields don't use options)

- **Field ID** (Column E, Auto-generated): Unique identifier for each field
  - Auto-generated from field name if blank (e.g., "Water Quality" → "water-quality")
  - Used internally by CoMapeo for field references
  - Required for maintaining consistency during import/export
  - **Do not edit manually** - system manages this automatically

- **Universal** (Column F): Whether field appears for all categories
  - `TRUE` - Available to all categories automatically
  - `FALSE` or blank - Only for categories that list this field
  - Must be exactly `TRUE` or `FALSE` (not "Yes", "No", etc.)
  - ⚠️ **Not implemented in CoMapeo app** — This field currently has no effect

**Example rows:**
| Name | Helper Text | Type | Options | | Universal |
|------|-------------|------|---------|---|-----------|
| Width | What is the width in meters? | n | | | FALSE |
| Status | What is the current status? | | Active, Inactive, Unknown | | FALSE |
| Equipment | What equipment is being used? | m | Drilling rig, Chainsaw, Pump | | FALSE |
| Notes | Additional observations | t | | | TRUE |

---

### Translation Tabs

These tabs store translations for each language you support. They are automatically created when you add new languages.

**📸 Screenshot placeholder:** *Translation sheet showing source column plus target language columns (es, pt, etc.)*

#### 3. Category Translations
Translations of category names

#### 4. Detail Label Translations
Translations of field names

#### 5. Detail Helper Text Translations
Translations of the helper text/questions

#### 6. Detail Option Translations
Translations of multiple choice options

**Translation Sheet Structure:**
- **Column A**: Auto-synced from source sheet (Categories or Details) via formula
- **Columns B+**: Target language translations
  - Header can use:
    - **Language name** (`Spanish`, `Español`, `Portuguese`, `Português`) → mapped via built-in aliases
    - **Raw ISO/BCP-47 code** (`es`, `pt`, `quz`, `pt-BR`, `zh-Hans`)
    - **"Name - ISO" format** (`Spanish - es`, `Español - es`, `Português - pt`, `Quechua - quz`, `Portuguese - pt-BR`)
  - Supported codes: ISO 639-1 (2-letter), ISO 639-2/3 (3-letter), BCP-47 tags with region/script (e.g., `pt-BR`, `zh-Hans`)
  - **Legacy layout:** Some older sheets include **Column B = ISO** and **Column C = Source**. These columns are informational and ignored; translations start at Column D.

**Important:** Column A uses formulas like `=Categories!A2:A100` to stay in sync. Don't delete these formulas!

---

### Other Tabs

#### 7. Metadata Sheet (auto-generated)
Contains configuration metadata like dataset ID, name, version, and primary language.

**Legacy Format Support (Metadata "LEGACY" flag):**

- The Metadata sheet can include a `legacyCompat` key (this is the "LEGACY" flag).
- Set it to `TRUE` to support **older versions of this plugin** and keep existing `categoryId` values valid in the newest format.
- Set it to `FALSE` (or leave it out) for current behavior.
- You can toggle this automatically via **Debug Menu → Turn on legacy compatibility**, which writes `legacyCompat` as `TRUE`/`FALSE` in Metadata.
- This flag only affects **export/build** behavior and how `categoryId` values are handled.

**📸 Screenshot placeholder:** *Metadata sheet showing Key-Value pairs*

**Common keys:**
- `datasetId` - Unique ID for this configuration
- `name` - Configuration name
- `version` - Version number
- `primaryLanguage` - Primary language name

---

## Basic Workflow

Follow these steps to create a CoMapeo configuration from start to finish:

### Step 1: Set Your Primary Language

**📸 Screenshot placeholder:** *Categories sheet with cell A1 highlighted showing "Portuguese" or "Português"*

1. Open the **Categories** sheet
2. Click on cell **A1**
3. Enter your primary language name
   - You can use English name: `Portuguese`, `Spanish`, `French`
   - OR native name: `Português`, `Español`, `Français`
   - Case doesn't matter: `PORTUGUESE` and `portuguese` both work

**Tip:** If you get an error, check your spelling against supported languages (142 languages available)

---

### Step 2: Define Your Categories

**📸 Screenshot placeholder:** *Categories sheet filled with example data for River, Building, Forest*

1. In the **Categories** sheet, starting at row 2:
   - Enter category names in column A
   - Leave columns B-E empty for now (we'll add icons and other data later)

**Example:**
| Name |
|------|
| River |
| Building |
| Forest |
| Wildlife sighting |

---

### Step 3: Define Your Fields

**📸 Screenshot placeholder:** *Details sheet filled with various field types*

1. In the **Details** sheet, starting at row 2:
   - Add all fields you'll need across all categories
   - Define the type and options for each field

**Example:**
| Name | Helper Text | Type | Options | | Universal |
|------|-------------|------|---------|---|-----------|
| Name | What is the name? | t | | | FALSE |
| Width | What is the width in meters? | n | | | FALSE |
| Condition | What is the current condition? | | Excellent, Good, Fair, Poor | | FALSE |
| Tree species | Select tree species | m | Oak, Pine, Maple, Birch | | FALSE |

---

### Step 4: Link Fields to Categories

**📸 Screenshot placeholder:** *Categories sheet with Fields column filled showing comma-separated field lists*

1. Return to **Categories** sheet
2. In the **Fields** column (C), list which fields each category uses:

**Example:**
| Name | Icon | Fields |
|------|------|---------|
| River | | Name, Width, Condition |
| Building | | Name, Condition |
| Forest | | Name, Tree species |

---

### Step 5: Set "Applies To" Values

**⚠️ CRITICAL: At least one category MUST have "track" in the Applies column, or generation will fail!**

**📸 Screenshot placeholder:** *Categories sheet with Applies column showing observation, track values*

1. In the **Applies** column (Column D), specify where each category can be used:
   - `observation` - For point observations (most common)
   - `track` - For GPS tracks/routes
   - `observation, track` - For both
   - Can also use abbreviations: `o`, `t`, `o, t`

2. **REQUIRED:** At least one category must include `track` (or `t`)
   - CoMapeo's track viewer requires this
   - If no category has `track`, generation fails with error

**Example:**
| Name | Icon | Fields | Applies |
|------|------|--------|---------|
| River | | Name, Width, Condition | observation |
| Trail | | Name, Condition | track |
| Wildlife sighting | | Name | observation |

**Note:**
- If this column doesn't exist, the plugin will create it automatically with default value `observation, track` for the first row
- You'll need to set it appropriately for your use case
- **DO NOT put hex color codes in this column!** Colors come from the background color of the Name column (Column A)

---

### Step 6: Add Icons

**RECOMMENDED - Use Earth Defenders Toolkit Icon App (Inline SVG):**

This method gives you the best results by letting you visually browse and select icons.

1. Visit https://icons.earthdefenderstoolkit.com
2. For each category, search for relevant terms (e.g., "river", "forest", "building")
3. Select the best matching icon and choose your category color
4. Click "Copy SVG" to copy the inline SVG code
5. Paste the SVG code directly into the Icon column (Column B)

Example format:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
<path fill="#194d33" fill-rule="evenodd" d="..."/>
</svg>
```

**ALTERNATIVE - Simple Text (Automatic Lookup):**

1. In the **Icon** column (Column B), type descriptive words:
   - Examples: `river`, `building`, `tree`, `forest`, `animal`
   - No need for .svg extension or URLs
2. During export, plugin automatically searches https://icons.earthdefenderstoolkit.com
3. ⚠️ Automatic search may not find the best icon match

**OPTIONAL - Use "Generate Category Icons" Menu:**

**📸 Screenshot placeholder:** *CoMapeo Tools menu with "Generate Category Icons" highlighted*

1. Click **CoMapeo Tools** → **Generate Category Icons**
2. Plugin searches for each category name
3. Shows preview with icon options
4. Saves selected icons to your Google Drive
5. Updates Icon column with Drive URLs

**ADVANCED - Manual Custom Icons:**

1. Upload SVG or PNG to your Google Drive
2. Right-click → Get link → Copy
3. Paste Drive URL in Icon column

**Format Support:**
- ✅ **Inline SVG** - Recommended (best results)
- ✅ **Plain text** (e.g., `river`) - Automatic lookup
- ✅ **Drive URLs** - For custom icons
- ✅ **Cell images** - Paste image into cell
- ✅ **Data URIs** - SVG data URIs
- ✅ **HTTPS URLs** - External SVG URLs
- ✅ **SVG and PNG files** - PNG converted to SVG

---

### Step 7: Set Category Colors

**📸 Screenshot placeholder:** *Categories sheet with colored background cells in Name column*

**⚠️ IMPORTANT: Colors come from the BACKGROUND COLOR of the Name column (Column A)!**

**There is NO separate Color column! DO NOT put hex codes in Column D (that's the Applies column)!**

**How to set colors:**
1. In the **Categories** sheet, select cells in the **Name** column (Column A)
2. Click the **Fill Color** button in the Google Sheets toolbar
3. Choose a background color for each category

**The background color you set becomes the category color in CoMapeo!**

**Color Tips:**
- Use distinct colors for easy identification
- Consider colorblind-friendly palettes
- Test colors on different devices
- Bright colors work better than pastels
- **DO NOT type hex codes (like #FF0000) anywhere!** Use the Fill Color button instead

---

### Step 8: Add Translations (Optional)

**📸 Screenshot placeholder:** *Language selection dialog with checkboxes for multiple languages*

1. Click **CoMapeo Tools** → **Manage Languages & Translate**
2. In the dialog:
   - **Section 1**: Check languages you want to auto-translate
   - **Section 2**: Enter language codes for manual-only languages
    - Use ISO 639-1/639-3 or BCP-47 format (e.g., `gn` for Guarani, `quz` for Quechua)
     - Find indigenous language codes:
       - [SIL ISO 639-3 Code Table](https://iso639-3.sil.org/)
       - [Ethnologue](https://www.ethnologue.com/)
       - [Glottolog](https://glottolog.org/)
    - For regional variants, use raw BCP-47 tags in the header (e.g., `quz-PE`) or the "Name - ISO" format (e.g., `Quechua - quz-PE`)
3. Click "Translate"
4. The plugin will:
   - Create translation sheets
   - Auto-translate checked languages using Google Translate
   - Create empty columns for manual-only languages
   - You can manually refine translations afterward

**📸 Screenshot placeholder:** *Category Translations sheet showing auto-filled translations*

**Manual Translation:**
1. Open any translation sheet
2. Edit cells in target language columns
3. Leave cells blank to auto-translate later

**Important:** Auto-translations should always be reviewed by native speakers for accuracy and context!

---

### Step 9: Validate Your Data (Linting)

**📸 Screenshot placeholder:** *Categories sheet with highlighted cells showing validation errors*

Before generating, check for errors:

1. Click **CoMapeo Tools** → **Lint Sheets**
2. Fix highlighted issues, then run **Lint Sheets** again to confirm
3. See the [Linting Guide](docs/LINTING_GUIDE.md) for color codes, sheet-by-sheet checks, and fixes

**Critical:** Resolve all critical linting errors before generating.

---

### Step 10: Generate CoMapeo Category

**📸 Screenshot placeholder:** *CoMapeo Tools menu with "Generate CoMapeo Category" highlighted*

1. Click **CoMapeo Tools** → **Generate CoMapeo Category**
2. Confirm you want to proceed
3. Monitor the progress dialog:

**📸 Screenshot placeholder:** *Progress dialog showing stages: Processing, Generating, Packaging*

**Generation stages:**
- Validating and linting sheets
- Building the JSON payload
- Sending the build request to the API
- Saving the `.comapeocat` file to Drive

4. When complete, the `.comapeocat` file is saved to your Google Drive folder
   - **Shareable `.zip`:** The plugin also saves a zipped copy for easy sharing
   - **For mobile:** Share the Drive URL to download directly on your phone

**📸 Screenshot placeholder:** *Success dialog with Drive link*

---

### Step 11: Share and Load Configuration into CoMapeo

**Sharing the Configuration:**

**📸 Screenshot placeholder:** *Uploading .comapeocat file to Google Drive*

If you just generated the file, it is already saved to your Google Drive folder. You can skip upload and go straight to the shareable link.

1. **Upload to Google Drive:**
   - Go to Google Drive
   - Click "New" → "File upload"
   - Select the downloaded `.comapeocat` file

2. **Get shareable link:**
   - Right-click the file in Google Drive
   - Click "Get link"
   - Change to "Anyone with the link can view"
   - Copy the link

3. **Share the link** with CoMapeo users (email, WhatsApp, etc.)

**Loading on Mobile or Desktop:**

**📸 Screenshot placeholder:** *Device showing downloading from Drive link*

1. **On your device**, open the Drive link you received
2. **Download the file** from Google Drive to your device
3. **Open CoMapeo app**
4. Go to **Menu → Coordinator Tools → Update Project Categories → Import**
5. Select **"Import Categories"**
6. Select the downloaded `.comapeocat` file
7. **Verify:**
   - Check that all categories appear
   - Test that icons display correctly
   - Try creating a test observation

**📸 Screenshot placeholder:** *CoMapeo app showing imported categories with icons*

**Alternative sharing methods:**
- Email the file as an attachment
- Use cloud storage (Dropbox, OneDrive)
- Transfer via USB cable
- Use messaging apps that support file sharing

---

## Menu Features

The **CoMapeo Tools** menu provides all plugin functionality:

**📸 Screenshot placeholder:** *Full CoMapeo Tools menu expanded showing all options*

---

### Manage Languages & Translate

**What it does:** Adds new languages and auto-translates your configuration.

**When to use:**
- Adding support for a new language
- Updating translations after changing category/field names
- Initially translating a new configuration

**How it works:**

**📸 Screenshot placeholder:** *Language management dialog with two sections*

1. **Select languages to auto-translate:**
   - Check languages you want Google Translate to handle
   - These will be auto-filled in translation sheets

2. **Add manual-only languages:**
   - Enter language codes (e.g., `gn`, `quz`, `quz-PE`)
   - These columns will be added but left blank for manual translation

3. **Translation process:**
   - The plugin translates ALL translation sheets:
     - Category names
     - Field labels
     - Helper text
     - Field options
   - Empty cells are filled with Google Translate results
   - Existing translations are NOT overwritten

**Best practices:**
- Always review auto-translations for accuracy
- Have native speakers verify translations
- Use manual-only for languages not well-supported by Google Translate (e.g., indigenous languages)

**📸 Screenshot placeholder:** *Completion dialog showing "Translation Complete"*

---

### Generate Category Icons

**What it does:** Automatically searches for and adds icons for your categories using the Earth Defenders Toolkit icon database.

**When to use:**
- You haven't added icons yet
- You want to find alternative icon options
- You're creating a new configuration

**How it works:**

**📸 Screenshot placeholder:** *Icon generation process showing search → preview → save*

1. Reads category names from Categories sheet
2. Searches https://icons.earthdefenderstoolkit.com for each name
3. Shows preview of available icon options
4. Saves selected icons to your Google Drive
5. Updates Icon column with Drive URLs

**Tips:**
- Icon search works best with common English terms (e.g., "river", "building", "tree")
- You can manually edit icons afterward at https://icons.earthdefenderstoolkit.com
- Icons are converted to SVG format and colored to match your category color
- For best results, use the Icon App and paste inline SVG directly (see Step 6)

**Requirements:**
- Categories must have names in column A
- Internet connection for icon API access

---

### Generate CoMapeo Category

**What it does:** Creates a `.comapeocat` configuration file from your spreadsheet.

**When to use:**
- Your configuration is complete and validated
- You're ready to test in CoMapeo app
- You need to share configuration with field team

**Process:**

**📸 Screenshot placeholder:** *Step-by-step generation process diagram*

1. **Pre-flight checks:**
   - Validates required fields
   - Checks icon references
   - Verifies field references
   - Ensures at least one category has "track" in Applies (warns if missing)

2. **Translations (if present):**
   - Existing translation sheets are included automatically
   - Use **Manage Languages & Translate** to add or update languages before generating

3. **Processing:**
   - Reads sheets and builds the JSON payload
   - Packages categories, fields, icons, and translations

4. **Packaging (API):**
   - Sends the payload to the build API
   - Receives a `.comapeocat` file and saves it to your Drive folder
   - Creates a shareable `.zip` and shows a Drive link

**Common issues:**
- **"Missing required fields"** → Run Lint Sheets to find empty required fields
- **"Invalid icon URL"** → Check that icons are accessible
- **"Translation mismatch"** → Translation sheets need to be re-synced (see the [Linting Guide](docs/LINTING_GUIDE.md))
- **"Timeout"** → Large configurations may take time; try again
- **"No track categories"** → Warning that track viewer will be empty; add "track" to Applies column

**Success indicators:**
- Progress dialog completes all stages
- `.comapeocat` file is saved to Drive and linked in the success dialog
- No error messages in final dialog

---

### Import Category File

**What it does:** Imports an existing `.comapeocat` or `.mapeosettings` file into your spreadsheet for editing.

**When to use:**
- Updating an existing configuration
- Creating a variant of another configuration
- Analyzing how a configuration is structured

**⚠️ WARNING:** This will erase ALL current spreadsheet data!

**How it works:**

**📸 Screenshot placeholder:** *Import file upload dialog*

1. Click **Import category file**
2. Click "Choose File" and select your `.comapeocat` file
3. Click "Upload"
4. The plugin will:
   - Extract all files from the archive
   - Parse configuration data
   - Extract individual icons from sprite (if SVG sprite)
   - Upload icons to your Google Drive
   - Populate all spreadsheet tabs
   - Import translations if present

**After Import:**

- Some columns may require manual setup:
  - **Categories Sheet → Details column (C)**: Set as dropdown with multi-select chips enabled
  - Steps: Right-click column C → Data validation → Dropdown → Add your field names
  - This enables chips UI for selecting which fields each category uses
- Note: Google Apps Script cannot programmatically set up multi-select dropdowns

**📸 Screenshot placeholder:** *Import progress showing extraction → parsing → uploading icons → populating sheets*

**What gets imported:**
- ✅ All categories with names, applies, and metadata
- ✅ All fields with types and options
- ✅ Icons (extracted and saved to Drive, or kept as inline SVG)
- ✅ Translations for all languages
- ✅ Colors (set as background colors in Name column)
- ✅ Metadata (dataset ID, version, etc.)

**Icon handling:**
- **SVG sprites** - Individual icons extracted and uploaded to Drive
- **Individual PNGs** - Uploaded to Drive as-is
- **Inline SVG** - Kept inline in Icon column
- **PNG sprites** - Not fully supported (use individual PNGs)

**Tips:**
- Make a backup copy of your spreadsheet first
- Import may take 1-2 minutes for large configurations
- Review imported data with Lint Sheets after import
- Icons will be saved to a folder in your Google Drive

---

### Lint Sheets

**What it does:** Validates all data in your spreadsheet and highlights errors.

**When to use:**
- Before generating a configuration (highly recommended!)
- After making significant changes
- After importing a configuration
- When troubleshooting errors

**See the [Linting Guide](docs/LINTING_GUIDE.md) for detailed validation rules and fixes**

---

### Reset Spreadsheet

**What it does:** Removes all translation sheets and metadata, resetting the spreadsheet to a clean state.

**⚠️ WARNING:** This action cannot be undone!

**When to use:**
- Starting a completely new configuration
- Clearing out imported data you don't want
- Troubleshooting major spreadsheet issues

**What gets removed:**
- ❌ All translation sheets
- ❌ Metadata sheet
- ❌ Auto-created columns (Applies, Category ID)

**What remains:**
- ✅ Categories sheet with data
- ✅ Details sheet with data
- ✅ Icons remain in your Google Drive (URLs removed from sheet)

**Process:**
1. Click **Reset Spreadsheet**
2. Confirm (this is your last chance to cancel!)
3. Translation and metadata sheets are deleted
4. Auto-created columns removed
5. You can start fresh

---

### Debug Menu

Advanced features for troubleshooting and testing:

**📸 Screenshot placeholder:** *Debug submenu expanded*

- **Create Test Spreadsheet:** Generates test data for regression testing
- **Test Runner:** Runs automated tests
- **Capture Baseline Performance Metrics:** Records performance benchmarks
- **Turn on legacy compatibility:** Toggles the Metadata `legacyCompat` flag so older plugin configs keep `categoryId` valid in the newest format
- **Generate CoMapeo Category (Debug):** Runs the standard generator; raw export is deprecated

**When to use:**
- Plugin developer or system administrator
- Troubleshooting generation issues
- Reporting bugs with detailed information

---

### Help & About

- **Help:** Opens help dialog with quick tips and link to documentation
- **About / Version:** Shows plugin version number and repository link

---

## Data Validation (Linting)

Linting checks your spreadsheet for errors before generating a configuration. Run **CoMapeo Tools** → **Lint Sheets**, fix highlighted issues, and run it again to confirm.

For color codes, sheet-by-sheet validation rules, common scenarios, and translation mismatch fixes, see the [Linting Guide](docs/LINTING_GUIDE.md).

---

## Troubleshooting

### Generation Fails

**Problem:** "Generate CoMapeo Category" fails with errors

**Common Error: "At least one category must include 'track' in the Applies column"**

This is the most common generation failure! It happens when:
- No category has `track` in the Applies column (Column D)
- Column D doesn't exist or is empty
- Column D contains invalid values (like hex color codes!)

**Solutions:**
1. ✅ Open Categories sheet, find or create column D (Applies)
2. ✅ For at least one category (usually a path/trail/route category), enter: `track` or `observation, track`
3. ✅ **DO NOT put color codes in column D!** Colors come from background color of Name column (Column A)
4. ✅ Valid values: `observation`, `track`, `o`, `t`, or combinations like `observation, track`

**Other Generation Issues:**
1. ✅ Run **Lint Sheets** first
2. ✅ Fix ALL bright red highlights (critical)
3. ✅ Fix all red highlights
4. ✅ Verify all icons are accessible
5. ✅ Check that field references in Categories→Fields column match Details→Name exactly
6. ✅ Make sure translation sheets have no bright red cells
7. ✅ Try generating with fewer languages selected
8. ✅ Check internet connection (required for packaging server)

---

### Icons Not Working

**Problem:** Icons don't appear or show errors

**Solutions:**
1. ✅ **Best results:** Paste inline SVG from https://icons.earthdefenderstoolkit.com (see Step 6)
2. ✅ **Quick fallback:** Use plain text in Icon column (e.g., `river`, `building`, `tree`) — plugin auto-searches during generation (no .svg or URLs needed)
3. ✅ If using Drive URLs:
   - Check URL format is correct: `https://drive.google.com/file/d/FILE_ID/view`
   - Ensure you have "View" permission on icon files
   - Both SVG and PNG files work (PNG converted to SVG)
4. ✅ Run Lint Sheets - red text indicates Drive access issues or empty values
5. ✅ Orange warning on HTTP URLs is just a security notice (still works)

---

### Translations Missing

**Problem:** Translations don't appear in exported config

**Solutions:**
1. ✅ Verify languages were selected during generation
2. ✅ Check translation sheets exist and have data
3. ✅ Run Lint Sheets - fix bright red translation mismatches
4. ✅ Re-run "Manage Languages & Translate"
5. ✅ Verify translation sheet column A formulas are intact

---

### Import Doesn't Work

**Problem:** "Import category file" fails or doesn't populate sheets

**Solutions:**
1. ✅ Verify file is a supported import format (see **Import Category File** section)
2. ✅ Try a different configuration file to test
3. ✅ Check file size isn't too large (>50MB may timeout)
4. ✅ Ensure you have Google Drive storage space for icons
5. ✅ Check browser console for specific errors (View → Developer → JavaScript Console)
6. ✅ Try refreshing spreadsheet and importing again

---

### Language Not Recognized

**Problem:** Error says language is not supported when setting primary language in cell A1

**Solutions:**
1. ✅ Check spelling - try both English and native names
2. ✅ Try different case - `PORTUGUESE` vs `portuguese` vs `Portuguese` all work
3. ✅ Review error message examples of valid names
4. ✅ Check list of 142 supported languages
5. ✅ Use full language name, not just code ("Portuguese" not "pt" in cell A1)

**Supported format examples:**
- ✅ `Portuguese` or `Português`
- ✅ `Spanish` or `Español`
- ✅ `French` or `Français`
- ❌ `pt`, `es`, `fr` (codes don't work in cell A1 - use full names)

---

### Applies Column Issues

**Problem:** Applies column is missing or values not working

**Solutions:**
1. ✅ Plugin auto-creates Applies column if missing - just run generator
2. ✅ Valid values: `observation`, `track`, `observation, track`, or abbreviations `o`, `t`
3. ✅ At least one category should have `track` for track viewer to work
4. ✅ Check for typos (e.g., "observe" instead of "observation")

---

### Slow Performance

**Problem:** Operations take a long time or timeout

**Solutions:**
1. ✅ Reduce number of categories/fields if possible
2. ✅ Generate with fewer languages at once
3. ✅ For import, be patient (can take 1-2 minutes for large configs)
4. ✅ Close other browser tabs
5. ✅ Clear Google Sheets cache:
   - Close and reopen spreadsheet
   - Clear browser cache
6. ✅ Try during off-peak hours

---

### Linting Shows Errors I Don't Understand

See the [Linting Guide](docs/LINTING_GUIDE.md) for color codes, validation rules, and fix steps.

---

## Tips for Success

### Before You Start
- ✅ Make a copy of the template spreadsheet
- ✅ Plan your categories and fields on paper first
- ✅ Decide which languages you need
- ✅ Understand the difference between observations and tracks

### During Configuration
- ✅ Start with Categories and Details, add icons and translations later
- ✅ Test with one or two categories first
- ✅ Run Lint Sheets frequently
- ✅ Use meaningful, descriptive names
- ✅ Keep it simple - start small, expand later
- ✅ Set Applies column appropriately (observation vs track)

### Before Generating
- ✅ Run Lint Sheets one last time
- ✅ Fix ALL errors (especially bright red)
- ✅ Verify all icons are accessible
- ✅ Test a small language subset first
- ✅ Make a backup copy of spreadsheet

### After Generating
- ✅ Test configuration in CoMapeo app immediately
- ✅ Create a test observation for each category
- ✅ Test a track if you have track categories
- ✅ Verify translations display correctly
- ✅ Check icons appear properly
- ✅ Document the version in Metadata sheet

### Collaboration
- ✅ Share spreadsheet with collaborators via Google Sheets sharing
- ✅ Use "View" access for reviewers, "Edit" for contributors
- ✅ Communicate major changes to team
- ✅ Maintain version history with File → Version history
- ✅ Use Metadata sheet to track versions and changes

---

## Additional Resources

- **Earth Defenders Toolkit Icon Editor:** https://icons.earthdefenderstoolkit.com
- **CoMapeo Documentation:** https://docs.comapeo.app/
- **Template Spreadsheet:** https://docs.google.com/spreadsheets/d/1bvtbSijac5SPz-pBbeLBhKby6eDefwweLEBmjAOZnlk/edit?usp=drivesdk
- **Plugin Repository:** https://github.com/digidem/comapeo-config-spreadsheet-plugin
- **Google Sheets Help:** https://support.google.com/docs/

---

## Support

For questions or issues:
1. Review this guide thoroughly
2. Check browser console for detailed error messages (View → Developer → JavaScript Console)
3. Run Lint Sheets to identify specific problems
4. Contact your system administrator or project lead
5. Report bugs at the plugin repository

---

**Document Version:** 2.1
**Last Updated:** 2026-01-10
**Plugin Compatibility:** v2.0.0+
