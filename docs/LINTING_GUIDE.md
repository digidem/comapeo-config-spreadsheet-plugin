# CoMapeo Category Set Spreadsheet Plugin - Linting Guide

This guide expands on the linting overview in the user guide. For general setup and workflow, see [USER_GUIDE.md](../USER_GUIDE.md).

## Data Validation (Linting)

Linting is the process of checking your spreadsheet for errors BEFORE generating a configuration. This saves time by catching problems early.

**📸 Screenshot placeholder:** *Lint Sheets menu option highlighted*

### Running the Linter

1. Click **CoMapeo Tools** → **Lint Sheets**
2. Wait for validation to complete (usually 5-15 seconds)
3. Review the completion dialog:

**📸 Screenshot placeholder:** *Linting completion dialog with color-coded legend*

4. Fix highlighted issues, then run **Lint Sheets** again to verify fixes

**Critical:** Fix ALL bright red errors before generating - these will cause failures!

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

#### 🔴 Light Red Background = Invalid or Duplicate Values
**What it means:** Data is present but invalid format/type, or duplicates exist where uniqueness is required

**Where:**
- Categories: Name column (duplicate category names)
- Details: Type column (invalid type code), Options column (missing options for select fields), Universal column (value other than TRUE/FALSE)
- Details: Name column (duplicate field names)
- Translation headers: Unrecognized header format
- Translation sheets: Option count mismatch (Detail Option Translations)

**Examples:**
- Field type is `x` (should be `t`, `n`, `m`, or `s`)
- Single choice field has no options
- Universal column contains "Yes" instead of "TRUE"
- Two categories both named "River"
- Detail Option Translations has 3 options but source has 4
- Translation header is "Spanish (es)" instead of a language name, ISO code, or "Name - ISO" format

**How to fix:**
- Correct field types to valid codes (`t`, `n`, `m`, `s`, or blank)
- Add options for single/multiple choice fields
- Change Universal to `TRUE`, `FALSE`, or leave blank
- Rename duplicates to unique values or delete duplicate rows
- Fix option count mismatches in translations (ensure same number of comma-separated values)
- Update translation headers to a supported format

---

#### 🟠 Orange Text = HTTP Icon URL Warning
**What it means:** Icon URL uses HTTP instead of HTTPS (security warning)

**Where:** Categories sheet, Icon column (font color, not background)

**How to fix:** Update the URL to use HTTPS if possible

---

### Categories Sheet Validation

**📸 Screenshot placeholder:** *Categories sheet with various validation highlights*

**What gets checked:**

1. **Name column (A):**
   - ✅ Auto-capitalizes first letter
   - 🟡 Required - must not be empty
   - 🔴 Duplicate check - each name must be unique

2. **Icon column (B):**
   - 🟡 Required - must have a value
   - ✅ Accepts ANY non-empty text:
     - **Inline SVG** - Direct SVG code (recommended)
     - **Plain text** (e.g., `river`, `building`) - Used to search icon API
     - **Drive URLs** - Custom icons from your Drive
     - **Cell images** - Embedded images in cells
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
   - Auto-created if missing (defaults to `observation, track` for first row)
   - Accepts: `observation`, `track`, or both (comma-separated)
   - Also accepts abbreviations: `o`, `t`
   - ⚠️ **At least one category MUST include `track`** or generation will fail
   - Invalid values (like hex codes) are treated as empty → defaults to `observation`
   - This is NOT a color column! Colors come from Name column background

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
   - 🔴 Duplicate check - each name must be unique

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
     - `s`/`select` or blank = select-one (single choice checkbox)

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
   - 🔴 Must be a language name (English or native), an ISO/BCP-47 code (including hyphenated tags), or "Name - ISO" format
   - Examples of valid headers:
     - `Spanish` ✅
     - `Español` ✅
     - `es` ✅
     - `Español - es` ✅
     - `Portuguese - pt-BR` ✅
     - `pt-BR` ✅
     - `Português - pt` ✅
     - `Spanish (es)` ❌ (should be `Spanish`, `es`, or `Spanish - es`)

3. **All cells:**
   - ✅ Auto-capitalize first letter
   - ✅ Remove whitespace-only cells

4. **Row counts:**
   - 🟡 Translation sheet should have same row count as source
   - Yellow highlight on first row if mismatch

5. **Option counts (Detail Option Translations only):**
   - 🔴 Each translation must have same number of comma-separated options as source
   - Example: If source has "Small, Medium, Large" (3 options), translation must have 3 options

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
- Possibly light red if option counts don't match in Detail Option Translations

**Action:** Ensure option lists have matching counts across source and translations

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
   - 🔴 Light red - fix before generating
   - 🟡 Yellow - fix before generating
   - 🟠 Orange text (HTTP icon URLs) - fix when possible

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

## Linting Shows Errors I Don't Understand

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
