# PR #26 - USER_GUIDE.md Implementation Plan

**Pull Request:** Add USER_GUIDE.md with complete end-user documentation
**Status:** Ready for Implementation
**Last Updated:** 2026-01-11

---

## Overview

This document provides detailed implementation instructions for all 12 review items from PR #26. Each item includes:
- Current documentation text
- Proposed change with exact markdown
- File location and line numbers
- Implementation priority

**Total Items:** 12
**Files to Modify:**
- `USER_GUIDE.md` (11 changes)
- `docs/README.md` (1 change)

---

## Item 1: Category Color Display in App

**File:** `USER_GUIDE.md`
**Line:** 61
**Priority:** Medium

### Current Text
```markdown
- The background color of cells in this column sets the category color (not a separate column)
```

### Proposed Change
```markdown
- The background color of cells in this column sets the category color (not a separate column)
- This color appears in the CoMapeo app as:
  - **Border color** around categories on the category selection screen
  - **Dot color** for observation markers on the map
```

### Implementation Notes
- Add 2 new bullet points explaining how the color appears in the app
- Clarify that the single color value serves two visual purposes

---

## Item 2: Icon Workflow - Column Reference (lines 64-67)

**File:** `USER_GUIDE.md`
**Lines:** 64-67
**Priority:** High

### Current Text
```markdown
- **Icon** (Column B, Required): Icon reference for your category
  - **Recommended: Simple text** for icon search (most common):
    - Examples: `river`, `building`, `tree`, `forest`, `animal`
    - Plugin searches https://icons.earthdefenderstoolkit.com automatically
```

### Proposed Change
```markdown
- **Icon** (Column B, Required): Icon reference for your category
  - **Recommended: Use Earth Defenders Toolkit Icon App** (best results):
    1. Visit https://icons.earthdefenderstoolkit.com
    2. Search for your category name (e.g., "river", "forest", "building")
    3. Select the best matching icon and choose your color
    4. Copy the SVG code (click "Copy SVG")
    5. Paste the inline SVG directly into the Icon column

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
```

### Implementation Notes
- **IMPORTANT**: This is NOT the "Generate Category Icons" menu workflow
- The preferred method is manually using the web app and pasting inline SVG
- Include the SVG code block example exactly as shown (double quotes)
- Add warning icon (⚠️) to the alternative method
- Also update the "Note about icons" block below the Categories table to align with inline SVG as the recommended workflow

---

## Item 3: Category ID Warning

**File:** `USER_GUIDE.md`
**Lines:** 93-96
**Priority:** High

### Current Text
```markdown
- **Category ID** (Column E, Auto-created): Unique identifier for the category
  - Auto-generated if not present
  - Used for importing/exporting
  - Usually you don't need to edit this
```

### Proposed Change
```markdown
- **Category ID** (Column E, Auto-created): Unique identifier for the category
  - Auto-generated if not present
  - Used for importing/exporting
  - ⚠️ **Important:** If you change this ID after observations have been collected, those observations will no longer be linked to this category in the CoMapeo app
  - Usually you don't need to edit this
```

### Implementation Notes
- Add warning bullet with ⚠️ icon
- Clearly explain the consequence of changing the ID

---

## Item 4: Icon Workflow - Step-by-Step Section (lines 311-332)

**File:** `USER_GUIDE.md`
**Lines:** 311-332
**Priority:** High

### Current Text
```markdown
**EASY WAY - Just Type Names (Recommended):**

1. In the **Icon** column (Column B), just type descriptive words:
   - `river`, `building`, `tree`, `forest`, `animal`, `path`, `water`
   - No need for .svg extension
   - No URLs needed
2. During generation, plugin automatically searches https://icons.earthdefenderstoolkit.com
3. Done! Icons will be found and included automatically

**ALTERNATIVE - Use "Generate Category Icons" Menu:**

1. Click **CoMapeo Tools** → **Generate Category Icons**
2. Plugin searches for each category name
3. Shows preview with icon options
4. Saves selected icons to your Google Drive
5. Updates Icon column with Drive URLs

**ADVANCED - Manual Custom Icons:**

1. Upload SVG or PNG to your Google Drive
2. Right-click → Get link → Copy
3. Paste Drive URL in Icon column
```

### Proposed Change
```markdown
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

1. Click **CoMapeo Tools** → **Generate Category Icons**
2. Plugin searches for each category name
3. Shows preview with icon options
4. Saves selected icons to your Google Drive
5. Updates Icon column with Drive URLs

**ADVANCED - Manual Custom Icons:**

1. Upload SVG or PNG to your Google Drive
2. Right-click → Get link → Copy
3. Paste Drive URL in Icon column
```

### Implementation Notes
- Keep the "Step 6: Add Icons" heading to preserve the numbered workflow
- Remove "EASY WAY" label - replace with "RECOMMENDED"
- Emphasize the Icon App workflow as primary
- Include SVG code block example (double quotes)
- Add warning to alternative method
- Add the menu workflow as optional (not primary)
- This aligns with Item 2 - both prioritize the icon app workflow

---

## Item 5: Options Field - Remove "Optional" Text

**File:** `USER_GUIDE.md`
**Lines:** 141-145
**Priority:** Medium

### Current Text
```markdown
- **Options** (Column D, Required for select fields): Comma-separated choices
  - Example: `Small, Medium, Large`
  - Example: `Good, Fair, Poor`
  - Required if Type is blank, `s`, or `m`
  - Optional for `t` and `n` types
```

### Proposed Change
```markdown
- **Options** (Column D, Required for select fields): Comma-separated choices
  - Example: `Small, Medium, Large`
  - Example: `Good, Fair, Poor`
  - Required if Type is blank, `s`, or `m`
  - Ignored if Type is `t` or `n` (text and number fields don't use options)
```

### Implementation Notes
- Change "Optional for" to "Ignored if"
- Clarify that text/number fields don't use options at all
- This is more accurate than "optional" which implies the value might be used

---

## Item 6: Column E - Field ID Explanation

**File:** `USER_GUIDE.md`
**Line:** 147
**Priority:** Medium

### Current Text
```markdown
- **(Column E)**: Reserved - leave blank
```

### Proposed Change
```markdown
- **Field ID** (Column E, Auto-generated): Unique identifier for each field
  - Auto-generated from field name if blank (e.g., "Water Quality" → "water-quality")
  - Used internally by CoMapeo for field references
  - Required for maintaining consistency during import/export
  - **Do not edit manually** - system manages this automatically
```

### Implementation Notes
- Replace "(Column E): Reserved - leave blank" with full explanation
- Add the column name "Field ID"
- Include example of slugification
- Add "Do not edit manually" warning

---

## Item 7: ISO Code Format Documentation

**File:** `USER_GUIDE.md`
**Line:** 187
**Priority:** Low

### Current Text
```markdown
- Header can be ISO code (`es`, `pt`) or "Language - ISO" format (`Español - es`)
```

### Proposed Change
```markdown
- Header can use:
  - **Language name** (`Spanish`, `Español`, `Portuguese`, `Português`) → mapped via built-in aliases
  - **Raw ISO/BCP-47 code** (`es`, `pt`, `quz`, `pt-BR`, `zh-Hans`)
  - **"Name - ISO" format** (`Spanish - es`, `Español - es`, `Português - pt`, `Quechua - quz`)
- Supported codes: ISO 639-1 (2-letter), ISO 639-2/3 (3-letter), BCP-47 tags with region/script (e.g., `pt-BR`, `zh-Hans`)
- **Important:** For BCP-47 tags with hyphens, use the raw header (`pt-BR`) — the "Name - ISO" parser only captures alphanumeric codes and will drop the region.
```

### Implementation Notes
- Explicitly mention BCP-47 format and hyphenated tags
- Add regional/script code examples (`pt-BR`, `zh-Hans`)
- Call out the "Name - ISO" limitation (regex only captures alphanumeric tokens)
- Reference the recent commit "Fix linter to accept BCP-47 regional language codes"

---

## Item 8: Legacy Config Documentation

**File:** `USER_GUIDE.md`
**Lines:** 195-196
**Priority:** Low

### Current Text
```markdown
#### 7. Metadata Sheet (auto-generated)

Contains configuration metadata like dataset ID, name, version, and primary language.
```

### Proposed Change
```markdown
#### 7. Metadata Sheet (auto-generated)

Contains configuration metadata like dataset ID, name, version, and primary language.

**Legacy Format Support:**

- The plugin can import `.mapeosettings` files (older Mapeo format)
- During import, legacy configs are converted to the new `.comapeocat` format
- Metadata sheet preserves the original dataset ID for continuity
- For more information on legacy Mapeo configuration formats, see:
  [Mapeo Documentation - Coding Configuration](https://docs.mapeo.app/complete-reference-guide/customization-options/custom-configurations/creating-custom-configurations/coding-configuration)
```

### Implementation Notes
- Add new subsection "Legacy Format Support"
- Include link to docs.mapeo.app
- Explain automatic conversion process
- Mention dataset ID preservation

---

## Item 9: Indigenous Language ISO Code URLs

**File:** `USER_GUIDE.md`
**Line:** 378
**Priority:** Low

### Current Text
```markdown
- **Section 2**: Enter language codes for manual-only languages
```

### Proposed Change
```markdown
- **Section 2**: Enter language codes for manual-only languages
  - Use ISO 639-1/639-3 or BCP-47 format (e.g., `gn` for Guarani, `quz` for Quechua)
  - Find indigenous language codes:
    - [SIL ISO 639-3 Code Table](https://iso639-3.sil.org/)
    - [Ethnologue](https://www.ethnologue.com/)
    - [Glottolog](https://glottolog.org/)
  - For regional variants, use raw BCP-47 tags in the header (e.g., `quz-PE`)
  - Note: if using "Name - ISO" headers, avoid hyphenated tags (use raw header instead)
```

### Implementation Notes
- Add authoritative sources for indigenous language codes
- Include all three resources mentioned in research
- Provide concrete examples (Quechua, Guarani)
- Mention regional variant support (BCP-47)

---

## Item 10: Drive URL Sharing for Mobile

**File:** `USER_GUIDE.md`
**Line:** 591
**Priority:** Low

### Current Text
```markdown
- Downloads result to your computer
```

### Proposed Change
```markdown
- Downloads result to your computer
- **Also saved to Drive:** File is automatically saved to your Google Drive folder
- **For mobile:** Share the Drive URL to download directly on your phone
```

### Implementation Notes
- Add information about Drive auto-save
- Explain mobile use case
- Clarify that file is saved automatically during export

---

## Item 11: Dropdown Column Manual Setup

**File:** `USER_GUIDE.md`
**Line:** 632
**Priority:** Medium

### Current Text
```markdown
4. The plugin will:
   - Extract all files from the archive
   - Parse configuration data
```

### Proposed Addition (add after current text)
```markdown
**After Import:**

- Some columns may require manual setup:
  - **Categories Sheet → Details column (C)**: Set as dropdown with multi-select chips enabled
  - Steps: Right-click column C → Data validation → Dropdown → Add your field names
  - This enables chips UI for selecting which fields each category uses
```

### Implementation Notes
- Add new subsection "After Import"
- Explain the Details column (C) dropdown setup on Categories sheet
- Note that Google Apps Script API cannot programmatically set up multi-select dropdowns
- Reference `src/importCategory/dialogTexts.ts:56-67` where this is documented

---

## Item 12: Remove Redundant Sub-Headline

**File:** `docs/README.md`
**Lines:** 12-13
**Priority:** Low
**Status:** ✅ Already implemented (verify no further change needed)

### Current Text
```markdown
## 🛠️ Developer Reference

Technical documentation for contributors, maintainers, and AI assistants.
```

### Proposed Change
```markdown
## 🛠️ Developer Reference

### Architecture & Implementation
```

### Implementation Notes
- No change needed if `docs/README.md` already shows "### Architecture & Implementation" immediately after the Developer Reference heading

---

## Implementation Priority Order

### Phase 1: High Priority (Items 2, 3, 4)
These changes affect core user workflows and should be implemented first:
- Item 2: Icon workflow reference in column description
- Item 3: Category ID warning (critical for data integrity)
- Item 4: Icon workflow step-by-step section

### Phase 2: Medium Priority (Items 1, 5, 6, 11)
These improve clarity and prevent user errors:
- Item 1: Category color display explanation
- Item 5: Options field accuracy
- Item 6: Field ID explanation
- Item 11: Dropdown setup instructions

### Phase 3: Low Priority (Items 7, 8, 9, 10)
These provide helpful additional context:
- Item 7: ISO code format detail
- Item 8: Legacy config reference
- Item 9: Indigenous language resources
- Item 10: Drive sharing info
Note: Item 12 is already implemented; just verify.

---

## Testing Checklist

After implementation, verify:

- [ ] All code blocks render correctly
- [ ] SVG example in Item 2/4 displays properly
- [ ] Warning icons (⚠️) are visible
- [ ] Links to external resources work
- [ ] Section hierarchy is maintained
- [ ] No broken markdown syntax
- [ ] Table of contents (if present) updates correctly
- [ ] Changes align with existing documentation style
- [ ] Icon guidance is consistent across USER_GUIDE.md, LINTING_GUIDE.md, and lint dialog tip

---

## Code References

During implementation, these files may be referenced for additional context:

- `src/generateConfig/processPresets.ts:62` - Category ID generation
- `src/generateConfig/processPresets.ts:86` - Color extraction
- `src/generateConfig/processFields.ts:53` - Field ID generation
- `src/utils.ts:166-181` - Options field handling
- `src/importCategory/dialogTexts.ts:56-67` - Dropdown setup instructions
- `src/builders/payloadBuilder.ts:822-900` - Translation header parsing (name, raw ISO/BCP-47, "Name - ISO")
- `src/lint.ts:378-454` - Translation header validation rules
- `src/constants/languageAliases.ts` - Name → ISO mappings
- `src/importService.ts:861-867` - BCP-47 locale validation regex
- `src/apiService.ts:186-219` - Drive file saving for `.comapeocat`
- `src/generateIcons/svgValidator.ts:184-216` - Inline SVG validation support
