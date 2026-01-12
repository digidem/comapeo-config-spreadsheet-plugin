# PR #26 - Review Comments Progress Tracker

**Pull Request:** Add USER_GUIDE.md with complete end-user documentation
**Status:** ✅ Research Complete - Ready for Implementation

**Last Updated:** 2026-01-12

---

## Summary

| Status                 | Count |
| ---------------------- | ----- |
| ✅ Research Complete   | 12    |
| ⏳ Ready to Implement  | 12    |
| ❓ Needs Clarification | 0     |

---

## ✅ All Clarifications Received

**Item 1**: Category color appears as border on category selection screen + dot color on map

**Item 2/4**: Preferred workflow is using icons.earthdefenderstoolkit.com app and copying inline SVG (NOT the menu workflow)

**Item 8**: Legacy config info available at https://docs.mapeo.app/complete-reference-guide/customization-options/custom-configurations/creating-custom-configurations/coding-configuration

All items are now ready for implementation.

---

## USER_GUIDE.md Review Comments

### ⏳ Item 1: Line 61 - Category Color Display in App

**Comment:** "Should explain how this is reflected on the app: category border color and marker color"

**Current Text (line 61):**

```markdown
- The background color of cells in this column sets the category color (not a separate column)
```

**Clarification from @luandro:**
Category color appears as:

- **Border** around categories on the category selection screen
- **Dot color** for observation markers on the map

**Proposed Change:**

```markdown
- The background color of cells in this column sets the category color (not a separate column)
- This color appears in the CoMapeo app as:
  - **Border color** around categories on the category selection screen
  - **Dot color** for observation markers on the map
```

**Status:** ⏳ Ready to implement

---

### ⏳ Item 2: Line 67 - Icon Search Tool Workflow

**Comment:** "Should have a better suggestion for user to use the icon search tool as preferred workflow"

**Current Text (lines 64-67):**

```markdown
- **Icon** (Column B, Required): Icon reference for your category
  - **Recommended: Simple text** for icon search (most common):
    - Examples: `river`, `building`, `tree`, `forest`, `animal`
    - Plugin searches https://icons.earthdefenderstoolkit.com automatically
```

**Findings from Code Investigation:**

- The "icon search tool" refers to the **"Generate Category Icons" menu item** (CoMapeo Tools → Generate Category Icons)
- **Two distinct workflows exist**:

1. **Menu Workflow** (recommended):
   - Process: User clicks menu → Interactive preview → Manual selection → Drive storage → URL reference
   - APIs: `https://icons.earthdefenderstoolkit.com/api/search` + `https://icons.earthdefenderstoolkit.com/api/generate`
   - Features: Visual browsing, manual selection, pre-flight validation, saved to Drive
   - Quality: Best results through manual selection
   - Dialog texts reference: "Icon Generator App" for further refinement

2. **Text Workflow** (alternative, currently labeled "Recommended"):
   - Process: Type text → During config generation → API search → Automatic assignment
   - API: Same search API but called during final export
   - Quality: PR review comment states "auto icon generates bad results"
   - Fallback: Generic marker icon if search fails

**Evidence from Dialog Texts (`src/text/dialog.ts:128`):**

```
"Check the generated icons in the icons folder and modify them using the <a href='https://icons.earthdefenderstoolkit.com' target='_blank'>Icon Generator App</a> if necessary."
```

**Root Issue:**
Current documentation labels the text workflow as "Recommended" and "EASY WAY" when:

1. The PR review explicitly states the auto-icon generates bad results
2. The menu workflow provides better quality through manual selection
3. The menu workflow is more robust with validation and user confirmation

**Clarification from @luandro:**
The preferred workflow is:

1. Use https://icons.earthdefenderstoolkit.com application directly
2. Copy the inline SVG output in the format:
   ```html
   <svg
     xmlns="http://www.w3.org/2000/svg"
     width="200"
     height="200"
     viewBox="0 0 200 200"
   >
     <path fill="#194d33" fill-rule="evenodd" d="..." />
   </svg>
   ```
3. Paste the inline SVG directly into the Icon column

This is **NOT** the "Generate Category Icons" menu workflow - it's manually using the web app and pasting inline SVG code.

**Proposed Restructure:**

````markdown
- **Icon** (Column B, Required): Icon reference for your category
  - **Recommended: Use Earth Defenders Toolkit Icon App** (best results):
    1. Visit https://icons.earthdefenderstoolkit.com
    2. Search for your category name (e.g., "river", "forest", "building")
    3. Select the best matching icon and choose your color
    4. Copy the SVG code (click "Copy SVG")
    5. Paste the inline SVG directly into the Icon column
       Example format:
    ```svg
    <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>
    <path fill='#194d33' fill-rule='evenodd' d='...'/>
    </svg>
    ```
  - **Alternative: Simple text** for automatic lookup (may not find best match):
    - Examples: `river`, `building`, `tree`, `forest`, `animal`
    - Plugin searches https://icons.earthdefenderstoolkit.com during export
    - ⚠️ Automatic search may not find the best icon match - manual selection recommended
````

**Status:** ⏳ Ready to implement

---

### ⏳ Item 3: Lines 96, 103 - Category ID Changes and App Reflection

**Comment (line 96):** "Should explain how if changed it'll reflect on the app"
**Comment (line 103):** "How reflects on app"

**Current Text (lines 93-96):**

```markdown
- **Category ID** (Column E, Auto-created): Unique identifier for the category
  - Auto-generated if not present
  - Used for importing/exporting
  - Usually you don't need to edit this
```

**Current Text (line 103):**

```markdown
**Note about colors:** Set the background color of the Name cell (Column A) to define the category color. This color appears in the CoMapeo app.
```

**Findings:**

- Category ID is generated via `createPresetSlug()` in `processPresets.ts:62`
- Used as a unique identifier in the `.comapeocat` file
- If changed, existing observations in the CoMapeo app may lose their category association

**Proposed Change for line 96:**

```markdown
- **Category ID** (Column E, Auto-created): Unique identifier for the category
  - Auto-generated if not present
  - Used for importing/exporting
  - ⚠️ **Important:** If you change this ID after observations have been collected, those observations will no longer be linked to this category in the CoMapeo app
  - Usually you don't need to edit this
```

**Status:** ⏳ Ready to implement

---

### ⏳ Item 4: Lines 117, 315, 332 - Icon Searcher App Workflow

**Comment (line 117):** "Prioritize icon searcher app workflow, the 'just name' flow for auto icon generates bad results"
**Comment (line 315):** "Prioritize the Icons app workflow for better results"
**Comment (line 332):** "Not advanced, should be primary with the icon app"

**Current Text (lines 114-117):**

```markdown
**Alternative icon methods** (less common):

- **Drive URL**: Upload custom icon to Drive, paste link
- **Cell image**: Paste image directly into cell
- **Inline SVG/Data URI**: For advanced users
```

**Current Text (lines 311-332):**

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

**Clarification from @luandro:**
The preferred workflow is using the https://icons.earthdefenderstoolkit.com application directly and copying inline SVG code (NOT the "Generate Category Icons" menu).

**Proposed Restructure:**

````markdown
### Adding Icons to Categories

**RECOMMENDED - Use Earth Defenders Toolkit Icon App:**

This method gives you the best results by letting you visually browse and select icons.

1. Visit https://icons.earthdefenderstoolkit.com
2. For each category, search for relevant terms (e.g., "river", "forest", "building")
3. Select the best matching icon and choose your category color
4. Click "Copy SVG" to copy the inline SVG code
5. Paste the SVG code directly into the Icon column (Column B)

Example format:

```svg
<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>
<path fill='#194d33' fill-rule='evenodd' d='...'/>
</svg>
```
````

**ALTERNATIVE - Simple Text (Automatic Lookup):**

1. In the **Icon** column (Column B), type descriptive words:
   - Examples: `river`, `building`, `tree`, `forest`, `animal`
   - No need for .svg extension or URLs
2. During export, plugin automatically searches https://icons.earthdefenderstoolkit.com
3. ⚠️ Automatic search may not find the best icon match - manual selection is recommended

**ADVANCED - Manual Custom Icons:**

1. Upload SVG or PNG to your Google Drive
2. Right-click → Get link → Copy
3. Paste Drive URL in Icon column

````

**Status:** ⏳ Ready to implement

---

### ⏳ Item 5: Line 145 - Remove "Optional" Text

**Comment:** "Not optional, should not be there"

**Current Text (lines 141-145):**
```markdown
- **Options** (Column D, Required for select fields): Comma-separated choices
  - Example: `Small, Medium, Large`
  - Example: `Good, Fair, Poor`
  - Required if Type is blank, `s`, or `m`
  - Optional for `t` and `n` types
````

**Findings from Code Investigation:**

- In `src/utils.ts:166-181`, the `getFieldOptions()` function:
  ```typescript
  function getFieldOptions(typeString: string, optionsString: string, fieldKey?: string) {
    const fieldType = getFieldType(typeString);
    if (fieldType === "number" || fieldType === "text") return undefined;  // ← Returns undefined!
    return optionsString.split(",")...
  }
  ```
- For `t` (text) and `n` (number) field types, the function **returns `undefined`** regardless of what's in the Options column
- The validation logic in `src/validation.ts:326-358` confirms text/number fields don't need options
- Test data in `src/test/fields.json` shows text fields always have `"options": []` (empty array)

**Root Issue:**
The word "optional" is misleading because:

1. It suggests users can choose whether to fill in the Options column for text/number fields
2. In reality, the system **completely ignores** any values in the Options column for these field types
3. "Optional" implies the value might be used, but it's not - it's always discarded

**Proposed Correction:**

```markdown
- **Options** (Column D, Required for select fields): Comma-separated choices
  - Example: `Small, Medium, Large`
  - Example: `Good, Fair, Poor`
  - Required if Type is blank, `s`, or `m`
  - Ignored if Type is `t` or `n` (text and number fields don't use options)
```

**Status:** ⏳ Ready to implement

---

### ⏳ Item 6: Line 147 - Why Column E is Reserved

**Comment:** "Why?"

**Current Text (line 147):**

```markdown
- **(Column E)**: Reserved - leave blank
```

**Context:** This is in the Details Sheet section, describing column structure.

**Findings from Code Investigation:**

- Column E is the **Field ID** column, which stores unique identifiers (`tagKey`) for each field
- In `src/generateConfig/processFields.ts:53`, field IDs are generated:
  ```typescript
  const tagKey = createFieldTagKey(detail[0], index);
  ```
- The `createFieldTagKey()` function in `src/utils.ts:107-109` auto-generates slugs from field names:
  ```typescript
  function createFieldTagKey(fieldName: string, index?: number): string {
    return buildSlugWithFallback(
      fieldName,
      "field",
      typeof index === "number" ? index : 0,
    );
  }
  ```
- Examples: "Water Quality" → `"water-quality"`, "GPS Location" → `"gps-location"`
- Field IDs are used throughout the codebase for:
  - Building field mappings in `payloadBuilder.ts`
  - Maintaining translation associations
  - API communication with external services
  - Ensuring consistency during import/export round-trips

**Root Issue:**
"Reserved - leave blank" provides no explanation of:

1. What the column actually contains (Field IDs)
2. How IDs are generated (auto-created from field names)
3. Why they're important (consistency during round-trip operations)
4. That users shouldn't edit them manually (system-managed)

**Proposed Correction:**

```markdown
- **Field ID** (Column E, Auto-generated): Unique identifier for each field
  - Auto-generated from field name if blank (e.g., "Water Quality" → "water-quality")
  - Used internally by CoMapeo for field references
  - Required for maintaining consistency during import/export
  - **Do not edit manually** - system manages this automatically
```

**Status:** ⏳ Ready to implement

---

### ⏳ Item 7: Line 187 - ISO Code Format

**Comment:** "Missing bcp47 info"

**Current Text (line 187):**

```markdown
- Header can be ISO code (`es`, `pt`) or "Language - ISO" format (`Español - es`)
```

**Findings from Code Investigation:**

- Looking at `src/languageLookup.ts` and related files
- Recent commit: "Fix linter to accept BCP-47 regional language codes" (28cc425)
- System uses BCP-47 format which accepts:
  - Basic ISO 639-1: `en`, `es`, `pt`
  - With region: `en-US`, `pt-BR`, `zh-Hans`

**Proposed Change:**

```markdown
- Header can use ISO 639-1 code (`es`, `pt`) or BCP-47 format with region (`pt-BR`, `zh-Hans`)
- Or "Language - ISO" format (`Español - es`, `Português - pt-BR`)
- Supported formats: ISO 639-1 (2-letter codes), BCP-47 regional codes (e.g., `pt-BR`)
```

**Status:** ⏳ Ready to implement

---

### ⏳ Item 8: Line 196 - Missing Legacy Config Documentation

**Comment:** "Missing legacy config, review this"

**Current Text (lines 195-196):**

```markdown
#### 7. Metadata Sheet (auto-generated)

Contains configuration metadata like dataset ID, name, version, and primary language.
```

**Context:** This section describes the Metadata sheet but doesn't mention legacy formats.

**Clarification from @luandro:**
Legacy config information is available at:
https://docs.mapeo.app/complete-reference-guide/customization-options/custom-configurations/creating-custom-configurations/coding-configuration

**Proposed Addition:**

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

**Status:** ⏳ Ready to implement

---

### ⏳ Item 9: Line 378 - Indigenous Language ISO Code URL

**Comment:** "Example is indigenous, and give the url for finding the correct iso code"

**Current Text (line 378):**

```markdown
- **Section 2**: Enter language codes for manual-only languages
```

**Context:** This is in the translation management section.

**Findings from Code Investigation:**

- User needs authoritative sources for indigenous language ISO codes
- SIL ISO 639-3 is the authoritative database for all world languages
- Ethnologue and Glottolog provide additional indigenous language resources

**Proposed Change:**

```markdown
- **Section 2**: Enter language codes for manual-only languages
  - Use ISO 639-1 or BCP-47 format (e.g., `quz` for Quechua, `gn` for Guarani)
  - Find indigenous language codes:
    - [SIL ISO 639-3 Code Table](https://iso639-3.sil.org/)
    - [Ethnologue](https://www.ethnologue.com/)
    - [Glottolog](https://glottolog.org/)
  - For regional variants, use BCP-47 format (e.g., `quz-PE` for Peruvian Quechua)
```

**Status:** ⏳ Ready to implement

---

### ⏳ Item 10: Line 591 - Drive URL Sharing for Phone

**Comment:** "Or share the drive url to be downloaded on phone"

**Current Text (line 591):**

```markdown
- Downloads result to your computer
```

**Context:** This is in the "Export Category File" section.

**Findings from Code Investigation:**

- In `src/driveService.ts`, files are saved to Drive via `saveFileToDrive()` function
- Export process saves `.comapeocat` files to a configured Drive folder
- Files in Drive can be shared via URL for direct download on mobile devices
- The file is automatically saved to Drive during export

**Updated Proposed Change:**

```markdown
- Downloads result to your computer
- **Also saved to Drive:** File is automatically saved to your Google Drive folder
- **For mobile:** Share the Drive URL to download directly on your phone
```

**Status:** ⏳ Ready to implement

---

### ⏳ Item 11: Line 632 - Dropdown Column Manual Setup

**Comment:** "Should have note for manually setting the column as dropdown"

**Current Text (line 632):**

```markdown
4. The plugin will:
   - Extract all files from the archive
   - Parse configuration data
```

**Context:** This is in the Import Category File section.

**Findings from Code Investigation:**

- In `src/importCategory/dialogTexts.ts:56-67`, there's a success message explaining dropdown setup
- The **Details → Applies** column (Column C) needs dropdown configuration for multi-select chips
- Google Apps Script API has limitations for programmatically setting up multi-select dropdowns
- Users must manually configure: Right-click column → Data validation → Dropdown → Add values
- This is already documented in the import success dialog, but not in USER_GUIDE.md

**Updated Proposed Addition:**

```markdown
**After Import:**

- Some columns may require manual setup:
  - **Details Sheet → Applies column (C)**: Set as dropdown with multi-select chips enabled
  - Steps: Right-click column C → Data validation → Dropdown → Add your category names
  - This enables chips UI for selecting which categories each field applies to
```

**Status:** ⏳ Ready to implement

---

## docs/README.md Review Comments

### ⏳ Item 12: Line 13 - Developer Reference Section

**Comment:** "Is this needed? Seems confusing"

**Current Text (line 12-13):**

```markdown
## 🛠️ Developer Reference

Technical documentation for contributors, maintainers, and AI assistants.
```

**Analysis:**

- This heading introduces the Developer Reference section
- The line 12 heading is clear ("Developer Reference")
- Line 13 is a sub-headline that could potentially be redundant

**Proposed Options:**

1. Remove line 13 entirely (heading is self-explanatory)
2. Keep as-is (provides context about target audience)
3. Replace with: "Documentation for contributors and maintainers working on the plugin codebase."

**Findings from Sub-Agent Investigation:**

- The heading "🛠️ Developer Reference" is self-explanatory
- The sub-headline is redundant and doesn't add value
- Mention of "AI assistants" feels out of place in user-facing documentation
- Agent recommendation: **REMOVE** line 13 entirely

**Decision:** Remove the sub-headline to reduce confusion and improve clarity.

**Status:** ⏳ Ready to implement

---

## Next Steps

✅ **All 12 items are ready for implementation!**

**Ready to Implement (12 items):**

- Item 1: Category color display - border on category selection screen + dot color on map
- Item 2: Icon workflow - use icons.earthdefenderstoolkit.com app, copy inline SVG (NOT menu workflow)
- Item 3: Category ID warning about breaking observation links
- Item 4: Icon workflow restructuring in step-by-step section (same as Item 2 - use icon app directly)
- Item 5: Options field - change "optional" to "ignored" for text/number types
- Item 6: Column E - replace "Reserved" with Field ID explanation
- Item 7: ISO code format documentation (BCP-47 support)
- Item 8: Legacy config - add reference to docs.mapeo.app URL
- Item 9: Indigenous language code URLs (SIL, Ethnologue, Glottolog)
- Item 10: Drive URL sharing for mobile download
- Item 11: Dropdown column manual setup after import
- Item 12: Remove redundant sub-headline in docs/README.md

---

## ✅ Questions Resolved

All questions have been answered by @luandro:

1. **Item 1**: Category color appears as border on category selection screen + dot color on map
2. **Item 2/4**: Preferred workflow is using icons.earthdefenderstoolkit.com app and copying inline SVG
3. **Item 8**: Legacy config info available at https://docs.mapeo.app/.../coding-configuration

---

## Implementation Priority Order

### Phase 1: High Priority (Items 2, 3, 4)

- Item 2: Icon workflow reference in column description
- Item 3: Category ID warning (critical for data integrity)
- Item 4: Icon workflow step-by-step section

### Phase 2: Medium Priority (Items 1, 5, 6, 11)

- Item 1: Category color display explanation
- Item 5: Options field accuracy
- Item 6: Field ID explanation
- Item 11: Dropdown setup instructions

### Phase 3: Low Priority (Items 7, 8, 9, 10, 12)

- Item 7: ISO code format detail
- Item 8: Legacy config reference
- Item 9: Indigenous language resources
- Item 10: Drive sharing info
- Item 12: Remove redundant text

---

## Code References

During implementation, these files may be referenced for additional context:

- `src/generateConfig/processPresets.ts:62` - Category ID generation
- `src/generateConfig/processPresets.ts:86` - Color extraction
- `src/utils.ts:107-109` - Field ID generation
- `src/utils.ts:166-181` - Options field handling
- `src/importCategory/dialogTexts.ts:56-67` - Dropdown setup instructions
- `src/languageLookup.ts` - ISO code handling
- `src/driveService.ts` - Drive file saving
