# Linting Improvements Worklist

This document captures the current state of the spreadsheet linting logic and the concrete improvements needed so another developer can pick them up.

## 1. Current State
- `npm run lint` invokes `bunx biome lint --write --unsafe .`, so code style is handled by Biome. Domain-specific linting lives in `src/lint.ts` and is surfaced through `lintAllSheets`.
- The lint script normalizes capitalization, highlights duplicate IDs, marks empty required cells, and flags malformed Google Drive URLs, but it does not exert deeper semantic validation of the spreadsheet content.
- Translation linting only trims whitespace and capitalizes first letters; structural issues are only discovered later in `processTranslations`, after generation has already started.

## 2. High-Priority Fixes
1. **Missing Icons**  
   - Specification in `spreadsheet-format.md` requires every category to provide an icon.  
   - The current lint does not error when the icon column is empty. Add a rule that:  
     - Flags blank or whitespace icons as errors.  
     - Optionally verifies that Drive URLs resolve (call `DriveApp.getFileById` inside a try/catch) and highlights cells when access fails.
2. **Details Type Handling**  
   - `getFieldType` treats blank or any string starting with `"s"` as a single-select (`selectOne`), but lint currently only accepts `t`, `n`, or `m`, creating false positives for `"select"` cells.  
   - Update the lint rule to accept blank, `"s"`, and `"select*"` as valid single-select indicators; normalize stored values if desired.
3. **Select Option Requirements**  
   - Single- and multi-select fields (blank/`s*/m*`) must have options. Add lint coverage that:  
     - Flags missing options (`Options` column empty) for these types.  
     - Ensures option lists are non-empty after trimming.  
     - Optionally warns if numeric/text fields still provide options (likely a user mistake).
4. **Translation Sheet Consistency**  
   - Ensure every translation sheet (`Category Translations`, `Detail Label Translations`, `Detail Helper Text Translations`, `Detail Option Translations`) has the same header set and order as the primary sheet.  
   - Verify each translation sheet row count matches its source (`Categories` or `Details`) and highlight discrepancies.  
   - For option translations, ensure the number of comma-separated options matches the base field’s option count; highlight mismatches.

## 3. Additional Safeguards to Consider
- Flag unreferenced detail rows (details that no category uses).  
- Validate the `Universal` flag column accepts only `TRUE/FALSE` (or blank) to prevent typos.  
- Warn on duplicate translated labels/options which would create duplicate slugs.  
- Ensure translation headers resolve to known language codes (`getAllLanguages`) or match the `"Name - ISO"` pattern.  
- Check that every details/category column count matches template expectation to catch manual column insertions.

## 4. Implementation Notes
- Extend `lintSheet` with additional per-column validators; prefer marking issues with background colors and console logs to align with existing UX.  
- For translation checks, read the companion sheet data in bulk (similar to `processTranslations`) to avoid repeated Apps Script API calls.  
- Unit tests (if feasible) should be added under `src/test` with mock sheet data to cover new rules, mirroring existing testing patterns.  
- Update any user-facing docs (`spreadsheet-format.md`, README) once new lint behaviours are in place so teams know what to fix.

## 5. Open Questions
- Should missing icons block the pipeline (`lintAllSheets` returns failure) or remain a warning? Clarify with product before implementation.  
- How strict should translation header matching be when custom languages are added mid-project (e.g., allowing extra descriptive columns)? Decide whether to warn or error.
