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
- The CoMapeo Config Spreadsheet template (provided by your administrator)

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

**📸 Screenshot placeholder:** *Categories sheet showing columns: Name, Icon, Details, Color, Geometry*

**Columns:**
- **Name** (Required): Category name in your primary language
  - Examples: "River", "Building", "Animal Sighting"

- **Icon** (Required): Google Drive URL to your category icon
  - Must be an SVG file
  - Format: `https://drive.google.com/file/d/FILE_ID/view`

- **Details**: Comma-separated list of field names this category uses
  - Example: `Name, Width, Depth, Water quality`
  - Fields must exist in the Details sheet

- **Color**: Hex color code for the category
  - Example: `#FF5733`
  - Used for visual identification in the app

- **Geometry**: Type of map feature
  - Options: `point`, `area`, or `vertex`
  - Leave blank for default (point)

**Example row:**
| Name | Icon | Details | Color | Geometry |
|------|------|---------|-------|----------|
| River | https://drive.google.com/.../view | Name, Width, Depth | #0066CC | area |

---

#### 2. Details Sheet
**Purpose:** Define all the data fields that can be associated with categories.

**📸 Screenshot placeholder:** *Details sheet showing columns: Name, Helper Text, Type, Options, (blank), Universal*

**Columns:**
- **Name** (Required): Field name
  - Examples: "Name", "Width", "Status"

- **Helper Text**: Question or instruction shown to users
  - Example: "What is the width in meters?"
  - Helps users understand what data to enter

- **Type**: Determines input method
  - `t` or `text` - Free-form text input
  - `n` or `number` - Numeric input
  - `m` or `multiple` - Multiple choice (checkboxes)
  - Blank or `s` - Single choice (dropdown)

- **Options** (Required for dropdown/multiple choice): Comma-separated choices
  - Example: `Small, Medium, Large`
  - Example: `Good, Fair, Poor`

- **(Column 5)**: Reserved - leave blank

- **Universal**: Whether field appears for all categories
  - `TRUE` - Available to all categories automatically
  - `FALSE` or blank - Only for specified categories

**Example rows:**
| Name | Helper Text | Type | Options | | Universal |
|------|-------------|------|---------|---|-----------|
| Width | What is the width in meters? | n | | | FALSE |
| Status | What is the current status? | | Active, Inactive, Unknown | | FALSE |
| Equipment | What equipment is being used? | m | Drilling rig, Chainsaw, Pump | | FALSE |

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
- **Column A**: Auto-synced from source sheet (Categories or Details)
- **Column B**: ISO language code (informational)
- **Column C**: Source language text (informational)
- **Columns D+**: Target language translations
  - Header can be ISO code (`es`, `pt`) or "Language - ISO" format (`Español - es`)

---

### Other Tabs

#### 7. Metadata Sheet (auto-generated)
Contains configuration metadata like dataset ID, name, and version.

**📸 Screenshot placeholder:** *Metadata sheet showing Key-Value pairs*

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
   - Leave columns B-E empty for now (we'll add icons and colors later)

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
| Name | Helper Text | Type | Options |
|------|-------------|------|---------|
| Name | What is the name? | t | |
| Width | What is the width in meters? | n | |
| Condition | What is the current condition? | | Excellent, Good, Fair, Poor |
| Tree species | Select tree species | m | Oak, Pine, Maple, Birch |

---

### Step 4: Link Fields to Categories

**📸 Screenshot placeholder:** *Categories sheet with Details column filled showing comma-separated field lists*

1. Return to **Categories** sheet
2. In the **Details** column (C), list which fields each category uses:

**Example:**
| Name | Icon | Details |
|------|------|---------|
| River | | Name, Width, Condition |
| Building | | Name, Condition |
| Forest | | Name, Tree species |

---

### Step 5: Search and Add Icons

**📸 Screenshot placeholder:** *CoMapeo Tools menu with "Generate Category Icons" highlighted*

1. Click **CoMapeo Tools** → **Generate Category Icons**
2. Confirm the action
3. The plugin will:
   - Search for icons matching your category names
   - Display options in a preview dialog
   - Save selected icons to your Google Drive
   - Add Drive URLs to the Icon column

**📸 Screenshot placeholder:** *Icon selection dialog showing search results with thumbnails*

**Alternative - Manual Icon Upload:**
1. Upload SVG icons to your Google Drive
2. Right-click each icon → Get link → Copy link
3. Paste the link in the **Icon** column for that category

**Important:** Icons must be SVG format (not PNG or JPG)

---

### Step 6: Set Category Colors

**📸 Screenshot placeholder:** *Categories sheet with Color column showing hex codes and colored cells*

1. In the **Categories** sheet, **Color** column:
   - Enter hex color codes (e.g., `#FF5733`)
   - Or use Google Sheets' color picker:
     - Select cells in column A (category names)
     - Click Fill Color in toolbar
     - The plugin will detect these background colors

**Color Tips:**
- Use distinct colors for easy identification
- Consider colorblind-friendly palettes
- Test colors on different devices

---

### Step 7: Add Translations (Optional)

**📸 Screenshot placeholder:** *Language selection dialog with checkboxes for multiple languages*

1. Click **CoMapeo Tools** → **Manage Languages & Translate**
2. Check languages you want to translate to
3. Click "Translate"
4. The plugin will:
   - Create translation sheets
   - Auto-translate using Google Translate
   - You can manually refine translations afterward

**📸 Screenshot placeholder:** *Category Translations sheet showing auto-filled translations*

**Manual Translation:**
1. Open any translation sheet
2. Edit cells in target language columns
3. Leave cells blank to auto-translate later

---

### Step 8: Validate Your Data (Linting)

**📸 Screenshot placeholder:** *Categories sheet with highlighted cells showing validation errors*

Before generating, check for errors:

1. Click **CoMapeo Tools** → **Lint Sheets**
2. Review highlighted cells:
   - **Yellow** = Required field missing
   - **Red** = Invalid value
   - **Red text** = Invalid URL or reference
   - **Pink** = Duplicate value
   - **Orange** = Duplicate translation slug
   - **Bright red with white text** = Critical error that will cause generation to fail

3. Fix all issues (see [Linting section](#data-validation-linting) for details)
4. Run **Lint Sheets** again to verify fixes

---

### Step 9: Generate CoMapeo Configuration

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
- Uploading to server

5. When complete, the `.comapeocat` file downloads automatically

**📸 Screenshot placeholder:** *Success dialog with download confirmation*

---

### Step 10: Load Configuration into CoMapeo

**📸 Screenshot placeholder:** *Mobile device showing CoMapeo app with config import screen*

1. **Transfer the file** to your mobile device:
   - Email to yourself
   - Upload to cloud storage (Dropbox, Google Drive)
   - Use USB cable

2. **Open in CoMapeo:**
   - Open the CoMapeo app
   - Go to Settings → Configuration
   - Tap "Import Configuration"
   - Select your `.comapeocat` file

3. **Verify:**
   - Check that all categories appear
   - Test that icons display correctly
   - Try creating a test observation

**📸 Screenshot placeholder:** *CoMapeo app showing imported categories with icons*

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

**📸 Screenshot placeholder:** *Language management dialog with two sections - languages to translate and manual languages*

1. **Select languages to auto-translate:**
   - Check languages you want Google Translate to handle
   - These will be auto-filled in translation sheets

2. **Add manual-only languages:**
   - Enter language codes for languages you'll translate manually
   - These columns will be added but left blank

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
- Use manual-only for languages not well-supported by Google Translate

**📸 Screenshot placeholder:** *Completion dialog showing "Translation Complete - All sheets have been translated successfully"*

---

### Generate Category Icons

**What it does:** Automatically finds and adds icons for your categories.

**When to use:**
- You haven't added icons yet
- You want to find alternative icon options
- You're creating a new configuration

**How it works:**

**📸 Screenshot placeholder:** *Icon generation process showing search → preview → save*

1. Reads category names from Categories sheet
2. Searches icon database for each name
3. Shows preview of available icons
4. Saves selected icons to your Google Drive
5. Updates Icon column with Drive URLs

**Tips:**
- Icon search works best with common English terms
- You can manually upload custom icons afterward
- Icons must be SVG format

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
   - Checks icon URLs
   - Verifies field references

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
- **"Invalid icon URL"** → Check that icons are SVG and Drive links are correct
- **"Translation mismatch"** → Translation sheets need to be re-synced (see Linting section)
- **"Timeout"** → Large configurations may take time; try again

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
   - Extract individual icons from sprite
   - Upload icons to your Google Drive
   - Populate all spreadsheet tabs
   - Import translations if present

**📸 Screenshot placeholder:** *Import progress showing extraction → parsing → uploading icons → populating sheets*

**What gets imported:**
- ✅ All categories with names and metadata
- ✅ All fields with types and options
- ✅ Icons (extracted and saved to Drive)
- ✅ Translations for all languages
- ✅ Colors and geometry types
- ✅ Metadata (dataset ID, version, etc.)

**Tips:**
- Make a backup copy of your spreadsheet first
- Import may take 1-2 minutes for large configurations
- Review imported data with Lint Sheets after import
- Icons will be saved to a folder in your Google Drive

---

### Lint Sheets

**What it does:** Validates all data in your spreadsheet and highlights errors.

**When to use:**
- Before generating a configuration (recommended!)
- After making significant changes
- After importing a configuration
- When troubleshooting errors

**See detailed [Data Validation (Linting)](#data-validation-linting) section below**

---

### Reset Spreadsheet

**What it does:** Removes all translations, metadata, and resets the spreadsheet to empty template state.

**⚠️ WARNING:** This action cannot be undone!

**When to use:**
- Starting a completely new configuration
- Clearing out imported data you don't want
- Troubleshooting major spreadsheet issues

**What gets removed:**
- ❌ All translation sheets
- ❌ Metadata sheet
- ❌ All icon Drive URLs (but icons remain in your Drive)

**What remains:**
- ✅ Categories sheet structure
- ✅ Details sheet structure
- ✅ Category and field names you entered

**Process:**
1. Click **Reset Spreadsheet**
2. Confirm (this is your last chance to cancel!)
3. Translation and metadata sheets are deleted
4. Categories and Details sheets are cleared of URLs/metadata but structure remains

---

### Debug Menu

Advanced features for troubleshooting and testing:

**📸 Screenshot placeholder:** *Debug submenu expanded*

- **Export Raw Files:** Creates a Google Drive folder with individual JSON files for debugging
- **Create Test Spreadsheet:** Generates test data for regression testing
- **Test Runner:** Runs automated tests
- **Capture Baseline Metrics:** Records performance benchmarks
- **Turn on legacy compatibility:** Enables compatibility mode for older CoMapeo versions

**When to use:**
- Plugin developer or system administrator
- Troubleshooting generation issues
- Reporting bugs with detailed information

---

### Help & About

- **Help:** Opens help dialog with quick tips
- **About / Version:** Shows plugin version and repository link

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

**Where:** Translation sheets, column A

**Example:** Categories sheet has "Animal" but Category Translations sheet has "Animal Terrs"

**Why it's critical:** This will cause translation lookup failures and generation will fail

**How to fix:**
1. Click **CoMapeo Tools** → **Debug** → **Fix Translation Mismatches** (if available)
2. Or manually re-sync formulas in translation sheets
3. See "Translation Sheet Mismatches" section below

---

#### 🟡 Yellow = Required Field Missing or Warning
**What it means:**
- Required data is missing
- Unreferenced details (fields not used by any category)
- Translation row count doesn't match source sheet

**Where:**
- Categories: Name or Icon columns
- Details: Name column
- Translation sheets: Row count warnings

**Examples:**
- Empty category name
- Missing icon URL
- Field defined but not used by any category

**How to fix:**
- Fill in missing required data
- Delete or add unreferenced fields to a category
- Add/remove rows in translation sheets to match source

---

#### 🔴 Red Background = Invalid Value
**What it means:** Data is present but invalid format or type

**Where:**
- Categories: Icon column (invalid URLs)
- Details: Type column (invalid type code), Options column (missing options for select fields)
- Details: Universal column (value other than TRUE/FALSE)
- Translation headers: Invalid language codes

**Examples:**
- Icon URL is not SVG
- Icon URL is not a valid Google Drive link
- Field type is `x` (should be `t`, `n`, `m`, or `s`)
- Dropdown field has no options
- Universal column contains "Yes" instead of "TRUE"

**How to fix:**
- Fix icon URLs to point to SVG files on Google Drive
- Correct field types to valid codes
- Add options for dropdown/multiple choice fields
- Change Universal to TRUE, FALSE, or leave blank
- Fix translation headers to valid language codes

---

#### 🔴 Red Text = Invalid URL or Reference
**What it means:** URL or cross-reference is broken

**Where:**
- Categories: Icon column (font color, not background)
- Categories: Details column (invalid field references)

**Examples:**
- Icon URL doesn't point to a file that exists
- Icon URL points to PNG instead of SVG
- Details column references "Width" but no field named "Width" exists

**How to fix:**
- Verify icon file exists and you have access
- Upload correct SVG icon and update URL
- Fix field name spelling in Details column
- Add missing field to Details sheet

**Tip:** Hover over red text cells to see notes with specific error details

---

#### 🩷 Pink = Duplicate Value
**What it means:** Same value appears multiple times where uniqueness is required

**Where:**
- Categories: Name column (duplicate category names)
- Details: Name column (duplicate field names)
- Categories: Fields column (invalid field references)
- Translation sheets: Option count mismatch

**Examples:**
- Two categories both named "River"
- Two fields both named "Width"
- Detail Option Translations has 3 options but source has 4

**How to fix:**
- Rename duplicates to unique values
- Delete duplicate rows
- Fix option count mismatches in translations

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
- Avoid special characters that get stripped
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
   - 🔴 Must be SVG file (not PNG/JPG)
   - 🔴 Must be valid Google Drive URL
   - 🔴 (Red text) URL must be accessible
   - Hover over red text for specific error

3. **Details column (C):**
   - 🔴 (Red text) All field names must exist in Details sheet
   - Auto-formats comma-separated lists
   - Capitalization enforced

4. **Color column (D):**
   - No specific validation
   - Accepts hex codes (#FF5733)

5. **Geometry column (E):**
   - Accepts: point, area, vertex, or blank
   - No highlighting for invalid values (future enhancement)

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
     - `t` = text (free-form)
     - `n` = number
     - `m` = multiple-select
     - `s` or blank = select-one (dropdown)

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
   - 🔴 Invalid for any other value (e.g., "Yes", "No", "yes")

---

### Translation Sheet Validation

**📸 Screenshot placeholder:** *Translation sheet with validation highlights*

**What gets checked:**

1. **Column A (Primary column):**
   - 🔴 **CRITICAL:** Must exactly match source sheet
   - 🔴 Bright red + white text if mismatch
   - Auto-synced via formula (normally)

2. **Headers (Row 1):**
   - 🔴 Must be valid language codes or "Name - ISO" format
   - 🟠 ISO code in "Name - ISO" format must be valid
   - Examples of valid headers:
     - `es` ✅
     - `pt` ✅
     - `Español - es` ✅
     - `Português - pt` ✅
     - `spanish` ❌ (should be `es`)

3. **All cells:**
   - ✅ Auto-capitalize first letter
   - ✅ Remove whitespace-only cells

4. **Row counts:**
   - 🟡 Translation sheet should have same row count as source
   - Yellow highlight if mismatch

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
- 🟡 Yellow highlights on empty required fields
- All other cells clean

**Action:** Fill in required data

---

#### Scenario 2: After Adding Icons
**What you'll see:**
- 🔴 Red text on icon URLs if files aren't accessible or aren't SVG
- Otherwise clean

**Action:** Verify all icon URLs point to valid SVG files on Google Drive

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

If this formula breaks or values diverge, generation will fail.

**How to detect:**
1. Run Lint Sheets
2. Look for bright red cells with white text in translation sheets
3. Check completion dialog mentions "CRITICAL translation mismatch"

**How to fix (Automatic):**
Some versions have a menu option:
1. **CoMapeo Tools** → **Debug** → **Fix Translation Mismatches**
2. Choose whether to re-translate afterward
3. Plugin re-syncs formulas and optionally re-translates

**How to fix (Manual):**

For **Category Translations**:
1. Open Category Translations sheet
2. Select column A cells (below header)
3. Delete content
4. In cell A2, enter formula:
   ```
   =Categories!A2:A100
   ```
   (Adjust row count to match your Categories sheet)
5. Repeat for all translation sheets

**Formulas for each sheet:**
- **Category Translations:** `=Categories!A2:A[lastRow]`
- **Detail Label Translations:** `=Details!A2:A[lastRow]`
- **Detail Helper Text Translations:** `=Details!B2:B[lastRow]`
- **Detail Option Translations:** `=Details!D2:D[lastRow]`

**After fixing formulas:**
1. Run Lint Sheets again
2. Verify bright red highlighting is gone
3. Re-translate if needed

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
   - 🟠 Orange - fix if causing translation issues

3. **Use consistent naming:**
   - Keep category/field names simple and unique
   - Avoid special characters
   - Be consistent across all sheets

4. **Verify icons thoroughly:**
   - Always use SVG format
   - Test that Drive links are accessible
   - Preview icons before generating

5. **Review translations:**
   - Don't rely solely on auto-translate
   - Have native speakers review
   - Check that option counts match

6. **Keep backups:**
   - Make a copy before major changes
   - Export/download configurations regularly

---

## Troubleshooting

### Generation Fails

**Problem:** "Generate CoMapeo Category" fails with errors

**Solutions:**
1. ✅ Run **Lint Sheets** first
2. ✅ Fix ALL red and bright red highlights
3. ✅ Verify all icons are SVG files on Google Drive
4. ✅ Check that field references in Categories match Details exactly
5. ✅ Make sure translation sheets have no bright red cells
6. ✅ Try generating with fewer languages selected
7. ✅ Check internet connection (required for packaging server)

---

### Icons Not Working

**Problem:** Icons don't appear or show errors

**Solutions:**
1. ✅ Verify icons are SVG format (not PNG, JPG)
2. ✅ Check Drive URLs are complete and correct format
3. ✅ Ensure you have "View" permission on icon files
4. ✅ Try re-uploading icon to Drive and getting fresh link
5. ✅ Use "Generate Category Icons" instead of manual upload
6. ✅ Run Lint Sheets and fix all red text in Icon column

---

### Translations Missing

**Problem:** Translations don't appear in exported config

**Solutions:**
1. ✅ Verify languages were selected during generation
2. ✅ Check translation sheets exist and have data
3. ✅ Run Lint Sheets - fix bright red translation mismatches
4. ✅ Re-run "Manage Languages & Translate"
5. ✅ Verify translation sheet column A matches source sheet exactly

---

### Import Doesn't Work

**Problem:** "Import category file" fails or doesn't populate sheets

**Solutions:**
1. ✅ Verify file is `.comapeocat` or `.mapeosettings` format
2. ✅ Try a different configuration file to test
3. ✅ Check file size isn't too large (>50MB may timeout)
4. ✅ Ensure you have Google Drive storage space for icons
5. ✅ Check browser console for specific errors
6. ✅ Try refreshing spreadsheet and importing again

---

### Language Not Recognized

**Problem:** Error says language is not supported when setting primary language

**Solutions:**
1. ✅ Check spelling - try both English and native names
2. ✅ Try different case - `PORTUGUESE` vs `portuguese` vs `Portuguese`
3. ✅ Review error message examples of valid names
4. ✅ Check list of 142 supported languages
5. ✅ Use full language name, not just code ("Portuguese" not just "pt")

**Supported format examples:**
- ✅ `Portuguese` or `Português`
- ✅ `Spanish` or `Español`
- ✅ `French` or `Français`
- ❌ `pt`, `es`, `fr` (codes don't work in cell A1)

---

### Slow Performance

**Problem:** Operations take a long time or timeout

**Solutions:**
1. ✅ Reduce number of categories/fields
2. ✅ Generate with fewer languages at once
3. ✅ For import, be patient (can take 1-2 minutes)
4. ✅ Close other browser tabs
5. ✅ Clear Google Sheets cache:
   - File → Reload
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
   - View → Developer tools → Console
   - Look for specific error messages
5. ✅ Make a copy and test fixing one error at a time
6. ✅ Ask for help with specific cell/error description

---

### Formulas Broken in Translation Sheets

**Problem:** Translation sheets don't auto-sync with source

**Solutions:**
1. ✅ Check if column A has formulas (click cell, look at formula bar)
2. ✅ Re-enter formulas manually (see "Fixing Translation Sheet Mismatches" section)
3. ✅ Or use Debug menu → Fix Translation Mismatches
4. ✅ Make sure source sheet has data in expected rows
5. ✅ Adjust formula row range to match your data

---

### Categories/Fields Missing After Import

**Problem:** Import completed but some data is missing

**Solutions:**
1. ✅ Check original `.comapeocat` file is complete
2. ✅ Verify import completion message said "success"
3. ✅ Look in all tabs - data may be in different sheet
4. ✅ Check browser console for import warnings
5. ✅ Some old formats may not import all data
6. ✅ Try importing into a fresh spreadsheet copy

---

## Tips for Success

### Before You Start
- ✅ Make a copy of the template
- ✅ Plan your categories and fields on paper first
- ✅ Gather or create icons before starting
- ✅ Decide which languages you need

### During Configuration
- ✅ Start with Categories and Details, add icons and translations later
- ✅ Test with one or two categories first
- ✅ Run Lint Sheets frequently
- ✅ Use meaningful, descriptive names
- ✅ Keep it simple - start small, expand later

### Before Generating
- ✅ Run Lint Sheets one last time
- ✅ Fix ALL errors (especially bright red)
- ✅ Verify all icons are SVG
- ✅ Test a small language subset first
- ✅ Make a backup copy of spreadsheet

### After Generating
- ✅ Test configuration in CoMapeo app immediately
- ✅ Create a test observation for each category
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

- **CoMapeo Documentation:** https://docs.comapeo.app/
- **Plugin Repository:** https://github.com/digidem/comapeo-config-spreadsheet-plugin
- **Google Sheets Help:** https://support.google.com/docs/

---

## Support

For questions or issues:
1. Review this guide thoroughly
2. Check browser console for detailed error messages
3. Run Lint Sheets to identify specific problems
4. Contact your system administrator
5. Report bugs at the plugin repository

---

**Document Version:** 2.0
**Last Updated:** 2026-01-10
**Plugin Version:** 2.0.0
