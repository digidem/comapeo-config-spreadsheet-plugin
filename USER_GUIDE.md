# CoMapeo Configuration Spreadsheet Plugin - User Guide

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

The CoMapeo Configuration Spreadsheet Plugin allows you to create and manage CoMapeo field data collection configurations directly in Google Sheets. This tool transforms your spreadsheet data into `.comapeocat` files that can be loaded into the CoMapeo mobile app for field data collection.

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
- The CoMapeo Config Spreadsheet template: https://docs.google.com/spreadsheets/d/1bvtbSijac5SPz-pBbeLBhKby6eDefwweLEBmjAOZnlk/edit?usp=drivesdk

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

- **Icon** (Column B, Required): Icon reference for your category
  - **Recommended: Simple text** for icon search (most common):
    - Examples: `river`, `building`, `tree`, `forest`, `animal`
    - Plugin searches https://icons.earthdefenderstoolkit.com automatically
    - No need for .svg extension
  - **Or use Drive URL** for custom icons:
    - Format: `https://drive.google.com/file/d/FILE_ID/view`
    - Supports SVG and PNG files (PNG converted to SVG)
  - **Or paste directly:**
    - Embedded image in cell (processed via icon API)
    - Inline SVG code: `<svg>...</svg>`
    - Data URI: `data:image/svg+xml,...`
    - HTTPS URL: `https://example.com/icon.svg`

- **Fields** (Column C): Comma-separated list of field names this category uses
  - Example: `Name, Width, Depth, Water quality`
  - Fields must exist in the Details sheet
  - Also called "Details" in some versions

- **Applies** (Column D, Auto-created): Where this category can be used
  - Options: `observation`, `track`, or both (comma-separated)
  - Examples:
    - `observation` - regular observations only
    - `track` - GPS tracks only
    - `observation, track` - both types
  - Default: `observation`
  - If missing, plugin auto-creates this column

- **Category ID** (Column E, Auto-created): Unique identifier for the category
  - Auto-generated if not present
  - Used for importing/exporting
  - Usually you don't need to edit this

**Example row:**
| Name | Icon | Fields | Applies | Category ID |
|------|------|--------|---------|-------------|
| River | river | Name, Width, Depth | observation | river-001 |

**Note about colors:** Set the background color of the Name cell (Column A) to define the category color. This color appears in the CoMapeo app.

**📸 Screenshot placeholder:** *Categories sheet with colored Name cells showing different category colors*

**Note about icons - JUST USE SIMPLE TEXT!**
The easiest way is to just type a descriptive word in the Icon column:
- Examples: `river`, `building`, `tree`, `forest`, `animal`, `path`, `water`
- Plugin automatically searches https://icons.earthdefenderstoolkit.com
- No need for .svg extension or URLs
- Works during both "Generate Category Icons" menu and final export

**Alternative icon methods** (less common):
- **Drive URL**: Upload custom icon to Drive, paste link
- **Cell image**: Paste image directly into cell
- **Inline SVG/Data URI**: For advanced users

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
  - Blank or `s` or `select` - Single choice (dropdown)
  - Case insensitive: `TEXT`, `Text`, `text` all work

- **Options** (Column D, Required for select fields): Comma-separated choices
  - Example: `Small, Medium, Large`
  - Example: `Good, Fair, Poor`
  - Required if Type is blank, `s`, or `m`
  - Optional for `t` and `n` types

- **(Column E)**: Reserved - leave blank

- **Universal** (Column F): Whether field appears for all categories
  - `TRUE` - Available to all categories automatically
  - `FALSE` or blank - Only for categories that list this field
  - Must be exactly `TRUE` or `FALSE` (not "Yes", "No", etc.)

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

**📸 Screenshot placeholder:** *Translation sheet showing Name, ISO, Source Language columns plus target language columns (es, pt, etc.)*

#### 3. Category Translations
Translations of category names

#### 4. Detail Label Translations
Translations of field names

#### 5. Detail Helper Text Translations
Translations of the helper text/questions

#### 6. Detail Option Translations
Translations of dropdown/multiple choice options

**Translation Sheet Structure:**
- **Column A**: Auto-synced from source sheet (Categories or Details) via formula
- **Column B**: ISO language code (informational)
- **Column C**: Source language text (informational)
- **Columns D+**: Target language translations
  - Header can be ISO code (`es`, `pt`) or "Language - ISO" format (`Español - es`)

**Important:** Column A uses formulas like `=Categories!A2:A100` to stay in sync. Don't delete these formulas!

---

### Other Tabs

#### 7. Metadata Sheet (auto-generated)
Contains configuration metadata like dataset ID, name, version, and primary language.

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

**📸 Screenshot placeholder:** *Categories sheet with Applies column showing observation, track values*

1. In the **Applies** column (D), specify where each category can be used:
   - `observation` - For point observations (most common)
   - `track` - For GPS tracks/routes
   - `observation, track` - For both

**Example:**
| Name | Icon | Fields | Applies |
|------|------|--------|---------|
| River | | Name, Width, Condition | observation |
| Trail | | Name, Condition | track |
| Wildlife sighting | | Name | observation |

**Note:** If this column doesn't exist, the plugin will create it automatically with default value `observation`.

---

### Step 6: Add Icons

**EASY WAY - Just Type Names (Recommended):**

**📸 Screenshot placeholder:** *Categories sheet Icon column with simple text: river, building, tree*

1. In the **Icon** column (Column B), just type descriptive words:
   - `river`, `building`, `tree`, `forest`, `animal`, `path`, `water`
   - No need for .svg extension
   - No URLs needed
2. During generation, plugin automatically searches https://icons.earthdefenderstoolkit.com
3. Done! Icons will be found and included automatically

**ALTERNATIVE - Use "Generate Category Icons" Menu:**

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
- ✅ **Plain text** (e.g., `river`) - Recommended!
- ✅ **Drive URLs** - For custom icons
- ✅ **Cell images** - Paste image into cell
- ✅ **Inline SVG** - For advanced users
- ✅ **SVG and PNG files** - PNG converted to SVG

---

### Step 7: Set Category Colors

**📸 Screenshot placeholder:** *Categories sheet with colored background cells in Name column*

1. In the **Categories** sheet, select cells in the **Name** column (Column A)
2. Click the **Fill Color** button in the toolbar
3. Choose a color for each category

**The background color you set becomes the category color in CoMapeo!**

**Color Tips:**
- Use distinct colors for easy identification
- Consider colorblind-friendly palettes
- Test colors on different devices
- Bright colors work better than pastels

---

### Step 8: Add Translations (Optional)

**📸 Screenshot placeholder:** *Language selection dialog with checkboxes for multiple languages*

1. Click **CoMapeo Tools** → **Manage Languages & Translate**
2. In the dialog:
   - **Section 1**: Check languages you want to auto-translate
   - **Section 2**: Enter language codes for manual-only languages
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
2. Review highlighted cells:
   - **🔴 Bright Red with White Text** = CRITICAL error (will cause generation to fail)
   - **🟡 Yellow** = Required field missing or warning
   - **🔴 Red Background** = Invalid value
   - **🔴 Red Text** = Invalid URL or reference
   - **🩷 Pink** = Duplicate value
   - **🟠 Orange** = Duplicate translation slug

3. Fix all issues (see [Linting section](#data-validation-linting) for details)
4. Run **Lint Sheets** again to verify fixes

**Critical:** Fix ALL bright red errors before generating - these will cause failures!

---

### Step 10: Generate CoMapeo Configuration

**📸 Screenshot placeholder:** *CoMapeo Tools menu with "Generate CoMapeo Category" highlighted*

1. Click **CoMapeo Tools** → **Generate CoMapeo Category**
2. Confirm you want to proceed
3. If you have translations, select which languages to include:

**📸 Screenshot placeholder:** *Language selection dialog for export*

4. Monitor the progress dialog:

**📸 Screenshot placeholder:** *Progress dialog showing stages: Processing, Generating, Packaging*

**Generation stages:**
- Processing translations
- Generating configuration files
- Creating icon sprite
- Packaging configuration
- Uploading to packaging server

5. When complete, the `.comapeocat` file downloads automatically to your Downloads folder

**📸 Screenshot placeholder:** *Success dialog with download confirmation*

---

### Step 11: Share and Load Configuration into CoMapeo

**Sharing the Configuration:**

**📸 Screenshot placeholder:** *Uploading .comapeocat file to Google Drive*

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

**Loading on Mobile Device:**

**📸 Screenshot placeholder:** *Mobile device showing downloading from Drive link*

1. **On mobile device**, open the Drive link you received
2. **Download the file** from Google Drive to your phone
3. **Open CoMapeo app**
4. Go to **Settings → Configuration**
5. Tap **"Import Configuration"**
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
   - Enter language codes (e.g., `qu` for Quechua)
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

2. **Language selection:**
   - If translations exist, choose which languages to include
   - Primary language always included

3. **Processing:**
   - Generates configuration JSON files
   - Creates icon sprite from all icons
   - Packages translations
   - Creates metadata

4. **Packaging:**
   - Combines all files into .comapeocat archive
   - Sends to packaging server
   - Downloads result to your computer

**Common issues:**
- **"Missing required fields"** → Run Lint Sheets to find empty required fields
- **"Invalid icon URL"** → Check that icons are accessible
- **"Translation mismatch"** → Translation sheets need to be re-synced (see Linting section)
- **"Timeout"** → Large configurations may take time; try again
- **"No track categories"** → Warning that track viewer will be empty; add "track" to Applies column

**Success indicators:**
- Progress dialog completes all stages
- `.comapeocat` file downloads automatically
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

**See detailed [Data Validation (Linting)](#data-validation-linting) section below**

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
- **Turn on legacy compatibility:** Enables compatibility mode for older CoMapeo versions
- **Generate CoMapeo Category (Debug):** Exports raw files to Google Drive for debugging

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

Linting is the process of checking your spreadsheet for errors BEFORE generating a configuration. This saves time by catching problems early.

**📸 Screenshot placeholder:** *Lint Sheets menu option highlighted*

### Running the Linter

1. Click **CoMapeo Tools** → **Lint Sheets**
2. Wait for validation to complete (usually 5-15 seconds)
3. Review the completion dialog:

**📸 Screenshot placeholder:** *Linting completion dialog with color-coded legend*

### Understanding Color Codes

The linter highlights cells with different colors based on error severity:

**📸 Screenshot placeholder:** *Example of each color code in spreadsheet*

#### 🔴 Bright Red Background + White Text = CRITICAL ERROR
**What it means:** Primary column mismatch between source and translation sheets

**Where:** Translation sheets, column A only

**Example:** Categories sheet has "Animal" but Category Translations sheet has "Animal Terrs"

**Why it's critical:** This will cause translation lookup failures and generation will FAIL

**How to fix:**
1. Translation sheets use formulas like `=Categories!A2:A100` to auto-sync
2. If these formulas break, values diverge and translations fail
3. Fix by re-entering the formula or using Debug → Fix Translation Mismatches (if available)
4. See "Translation Sheet Mismatches" section below for detailed instructions

---

#### 🟡 Yellow = Required Field Missing or Warning
**What it means:**
- Required data is missing
- Unreferenced details (fields not used by any category)
- Translation row count doesn't match source sheet

**Where:**
- Categories: Name or Icon columns
- Details: Name or Type columns
- Translation sheets: Row count warnings

**Examples:**
- Empty category name
- Missing icon reference
- Field defined but not used by any category
- Translation sheet has different number of rows than source

**How to fix:**
- Fill in missing required data
- Delete unreferenced fields OR add them to a category's Fields column
- Add/remove rows in translation sheets to match source

---

#### 🔴 Red Background = Invalid Value
**What it means:** Data is present but invalid format or type

**Where:**
- Categories: Icon column (invalid references)
- Details: Type column (invalid type code), Options column (missing options for select fields)
- Details: Universal column (value other than TRUE/FALSE)
- Translation headers: Invalid language codes

**Examples:**
- Field type is `x` (should be `t`, `n`, `m`, or `s`)
- Dropdown field has no options
- Universal column contains "Yes" instead of "TRUE"
- Translation header is "spanish" instead of "es" or "Español - es"

**How to fix:**
- Correct field types to valid codes (`t`, `n`, `m`, `s`, or blank)
- Add options for dropdown/multiple choice fields
- Change Universal to `TRUE`, `FALSE`, or leave blank
- Fix translation headers to valid language codes or "Language - ISO" format

---

#### 🔴 Red Text = Invalid URL or Reference
**What it means:** URL or cross-reference is broken

**Where:**
- Categories: Icon column (font color, not background)
- Categories: Fields column (invalid field references)

**Examples:**
- Icon URL doesn't point to a file that exists
- Fields column references "Width" but no field named "Width" exists in Details sheet

**How to fix:**
- Verify icon reference is valid (Drive URL, icon name, inline SVG, etc.)
- Fix field name spelling in Fields column
- Add missing field to Details sheet

**Tip:** Hover over red text cells to see notes with specific error details

---

#### 🩷 Pink = Duplicate Value
**What it means:** Same value appears multiple times where uniqueness is required

**Where:**
- Categories: Name column (duplicate category names)
- Details: Name column (duplicate field names)
- Translation sheets: Option count mismatch

**Examples:**
- Two categories both named "River"
- Two fields both named "Width"
- Detail Option Translations has 3 options but source has 4

**How to fix:**
- Rename duplicates to unique values
- Delete duplicate rows
- Fix option count mismatches in translations (ensure same number of comma-separated values)

---

#### 🟠 Orange = Duplicate Translation Slug
**What it means:** Two translations will create the same internal identifier

**Where:** Translation sheets, any translation column

**Example:**
- One row has "Animal"
- Another row has "Animal!"
- Both create slug "animal" causing a conflict

**How to fix:**
- Make translations more distinct
- Avoid special characters that get stripped during slug generation
- Use more descriptive translations

---

### Categories Sheet Validation

**📸 Screenshot placeholder:** *Categories sheet with various validation highlights*

**What gets checked:**

1. **Name column (A):**
   - ✅ Auto-capitalizes first letter
   - 🟡 Required - must not be empty
   - 🩷 Duplicate check - each name must be unique

2. **Icon column (B):**
   - 🟡 Required - must have a value
   - ✅ Accepts ANY non-empty text:
     - **Plain text** (e.g., `river`, `building`) - Used to search icon API (most common!)
     - **Drive URLs** - Custom icons from your Drive
     - **Cell images** - Embedded images in cells
     - **Inline SVG** - Direct SVG code
     - **Data URIs** - SVG data URIs
     - **HTTPS URLs** - External icon URLs
   - 🟠 HTTP URLs show orange warning (should use HTTPS for security)
   - 🔴 Only shows red for:
     - Empty/missing value
     - Invalid Drive URLs (file doesn't exist or no access)

3. **Fields column (C):**
   - 🔴 (Red text) All field names must exist in Details sheet
   - Auto-formats comma-separated lists
   - Capitalization enforced

4. **Applies column (D):**
   - Auto-created if missing
   - Accepts: `observation`, `track`, or both (comma-separated)
   - Also accepts abbreviations: `o`, `t`
   - Default: `observation`

5. **Category ID column (E):**
   - Auto-created if missing
   - Used for import/export
   - Usually don't need to edit manually

---

### Details Sheet Validation

**📸 Screenshot placeholder:** *Details sheet with various validation highlights*

**What gets checked:**

1. **Name column (A):**
   - ✅ Auto-capitalizes first letter
   - 🟡 Required - must not be empty
   - 🟡 Yellow highlight if field is not used by any category
   - 🩷 Duplicate check - each name must be unique

2. **Helper Text column (B):**
   - ✅ Auto-capitalizes first letter
   - Optional - can be empty

3. **Type column (C):**
   - ✅ Accepts: `t`, `n`, `m`, `s` (case-insensitive)
   - ✅ Can be blank (defaults to select-one)
   - 🔴 Invalid if any other value
   - Type meanings:
     - `t`/`text` = text (free-form)
     - `n`/`number` = number
     - `m`/`multiple` = multiple-select (checkboxes)
     - `s`/`select` or blank = select-one (dropdown)

4. **Options column (D):**
   - ✅ Auto-capitalizes and formats comma lists
   - 🔴 Required for select-one and multiple-select fields
   - 🔴 Invalid if select field has no options
   - Optional for text and number fields

5. **Column E:**
   - Reserved - leave blank
   - No validation

6. **Universal column (F):**
   - Accepts: `TRUE`, `FALSE`, or blank
   - 🔴 Invalid for any other value (e.g., "Yes", "No", "yes", "1", "0")
   - Must be exactly `TRUE` or `FALSE`

---

### Translation Sheet Validation

**📸 Screenshot placeholder:** *Translation sheet with validation highlights*

**What gets checked:**

1. **Column A (Primary column):**
   - 🔴 **CRITICAL:** Must exactly match source sheet
   - 🔴 Bright red + white text if mismatch
   - Auto-synced via formula (normally): `=Categories!A2:A100`
   - If formula breaks, you get bright red highlighting

2. **Headers (Row 1):**
   - 🔴 Must be valid language codes or "Name - ISO" format
   - 🟠 ISO code in "Name - ISO" format must be valid
   - Examples of valid headers:
     - `es` ✅
     - `pt` ✅
     - `Español - es` ✅
     - `Português - pt` ✅
     - `spanish` ❌ (should be `es` or `Español - es`)

3. **All cells:**
   - ✅ Auto-capitalize first letter
   - ✅ Remove whitespace-only cells

4. **Row counts:**
   - 🟡 Translation sheet should have same row count as source
   - Yellow highlight on first row if mismatch

5. **Option counts (Detail Option Translations only):**
   - 🩷 Each translation must have same number of comma-separated options as source
   - Example: If source has "Small, Medium, Large" (3 options), translation must have 3 options

6. **Duplicate slugs:**
   - 🟠 Checks if two different translations create the same internal identifier
   - Orange highlight for duplicates

---

### Common Linting Scenarios

#### Scenario 1: Fresh Spreadsheet
**What you'll see:**
- 🟡 Yellow highlights on empty required fields (Name, Icon in Categories; Name, Type in Details)
- All other cells clean

**Action:** Fill in required data

---

#### Scenario 2: After Adding Icons
**What you'll see:**
- 🔴 Red text on icon references if they're invalid
- Otherwise clean

**Action:** Verify all icon references are valid

---

#### Scenario 3: After Auto-Translation
**What you'll see:**
- Usually all clean
- Possibly 🟠 orange if similar words translate the same way

**Action:** Review orange highlights and make translations more distinct

---

#### Scenario 4: After Import
**What you'll see:**
- Possibly 🔴 bright red in translation sheets if formulas got broken during import
- Possibly 🟡 yellow for unreferenced fields

**Action:**
1. Fix translation mismatches (see next section)
2. Review and clean up unreferenced fields

---

### Fixing Translation Sheet Mismatches

**📸 Screenshot placeholder:** *Translation sheet showing bright red highlighting in column A*

**The Problem:**
Translation sheets use formulas to auto-sync with source sheets:
```
=Categories!A2:A50
```

If this formula breaks or values diverge, generation will fail with translation lookup errors.

**How to detect:**
1. Run Lint Sheets
2. Look for bright red cells with white text in translation sheets
3. Check completion dialog mentions "CRITICAL translation mismatch"

**How to fix (Manual):**

For **Category Translations**:
1. Open Category Translations sheet
2. Select cells in column A (below header, e.g., A2:A100)
3. Delete content
4. In cell A2, enter formula:
   ```
   =Categories!A2:A100
   ```
   (Adjust row count to match your Categories sheet last row)

**Formulas for each translation sheet:**
- **Category Translations:** `=Categories!A2:A[lastRow]`
- **Detail Label Translations:** `=Details!A2:A[lastRow]`
- **Detail Helper Text Translations:** `=Details!B2:B[lastRow]`
- **Detail Option Translations:** `=Details!D2:D[lastRow]`

**After fixing formulas:**
1. Run Lint Sheets again
2. Verify bright red highlighting is gone
3. Re-translate if translations were lost (Manage Languages & Translate)

---

### Best Practices for Clean Data

1. **Lint early, lint often**
   - Run linter after every major change
   - Catch errors before they cascade

2. **Fix errors in priority order:**
   - 🔴 Bright red (CRITICAL) - fix immediately
   - 🔴 Red - fix before generating
   - 🟡 Yellow - fix before generating
   - 🩷 Pink - fix before generating
   - 🟠 Orange - fix if causing issues

3. **Use consistent naming:**
   - Keep category/field names simple and unique
   - Avoid special characters
   - Be consistent across all sheets

4. **Verify icons thoroughly:**
   - Test that icons are accessible
   - Preview icons before generating

5. **Review translations:**
   - Don't rely solely on auto-translate
   - Have native speakers review
   - Check that option counts match

6. **Keep backups:**
   - Make a copy before major changes
   - Export/download configurations regularly
   - Use File → Version history to track changes

---

## Troubleshooting

### Generation Fails

**Problem:** "Generate CoMapeo Category" fails with errors

**Solutions:**
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
1. ✅ **Easiest fix:** Just use plain text in Icon column (e.g., `river`, `building`, `tree`)
2. ✅ Plugin automatically searches https://icons.earthdefenderstoolkit.com during generation
3. ✅ No need for .svg extension or URLs
4. ✅ If using Drive URLs:
   - Check URL format is correct: `https://drive.google.com/file/d/FILE_ID/view`
   - Ensure you have "View" permission on icon files
   - Both SVG and PNG files work (PNG converted to SVG)
5. ✅ Run Lint Sheets - red text indicates Drive access issues or empty values
6. ✅ Orange warning on HTTP URLs is just a security notice (still works)

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
1. ✅ Verify file is `.comapeocat` or `.mapeosettings` format
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

**Problem:** Colored highlights but not sure what's wrong

**Solutions:**
1. ✅ Hover over cells with red text for detailed notes
2. ✅ Check this guide's color code legend
3. ✅ Review specific sheet validation section
4. ✅ Check browser console:
   - View → Developer → JavaScript Console
   - Look for specific error messages
5. ✅ Make a copy and test fixing one error at a time
6. ✅ Ask for help with specific cell/error description

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
