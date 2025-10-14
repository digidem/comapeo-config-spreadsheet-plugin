# Performance Improvement Checklist

> 🚨 **Safety First:** The top priority for every optimization is maintaining existing behaviour. Do not ship a change until you have tested the affected workflow end-to-end and confirmed it introduces **no regressions or new bugs**.

After completing any task below:

1. Run or simulate the “Generate CoMapeo Category” flow.
2. Verify linting, translations, Drive export, and packaging still produce the expected outputs.
3. Document the test evidence and tick the item in this checklist.

---

- [x] **Batch Spreadsheet Writes in Linting (`src/lint.ts`)**  
  *Gain:* Dramatically reduces per-cell `setBackground/setValue` calls during `lintAllSheets`, cutting spreadsheet round-trips for large sheets.  
  *Risk:* Medium — batching needs to preserve all current highlighting/notes, so comprehensive before/after sheet comparisons are required.  
  *Tested:* `npm run lint`

- [x] **Cache Detail Slugs During Category Validation (`src/lint.ts`)**  
  *Gain:* Eliminates repeated reads of the entire Details sheet while validating each category row.  
  *Risk:* Low — ensure cache invalidation within the lint pass so edits within the same run are respected.  
  *Tested:* `npm run lint`

- [x] **Batch Translation Updates (`src/translation.ts`)**  
  *Gain:* Replace per-cell translation writes with `setValues`, and cache repeated phrases per language to shrink LanguageApp calls.  
  *Risk:* Medium — must keep column alignment and avoid overwriting pre-filled translations or formulas.  
  *Tested:* `npm run lint`

- [x] **Hoist Language Lookups in Translation Loop (`src/translation.ts`)**  
  *Gain:* Prevents redundant `getAllLanguages()` calls for every target language, shaving repeated network/cache hits.  
  *Risk:* Low — confirm the hoisted map still reflects any runtime updates (e.g. newly added custom columns).  
  *Tested:* `npm run lint`

- [x] **Reuse Generated Icons Across Pipeline (`src/generateCoMapeoConfig.ts`, `src/driveService.ts`)**  
  *Gain:* Avoids double icon generation and duplicate external API requests during Drive export.  
  *Risk:* Medium — ensure Drive writes still emit all required size variants and that in-sheet icon URLs stay consistent.  
  *Tested:* `npm run lint`

- [x] **Make Drive Sync Delay Conditional (`src/driveService.ts`)**  
  *Gain:* Removes the unconditional 2 s pause when Drive has already committed files.  
  *Risk:* Low — confirm no race conditions when immediately downloading the package after export.  
  *Tested:* `npm run lint`

- [ ] **Cache Successful Preflight Results (`src/preflightValidation.ts`)**  
  *Gain:* Skips repeated Drive/API connectivity checks when rerunning the generator within a short window.  
  *Risk:* Medium — stale cache entries must not hide real outages; add short TTLs and bypass cache on explicit “retry” actions.

- [ ] **Instrumentation & Timing Logs (`src/generateCoMapeoConfig.ts` & helpers)**  
  *Gain:* Adds structured timing logs around major steps to quantify wins and spot remaining hotspots.  
  *Risk:* Low — keep log volume manageable to avoid hitting Apps Script log limits.

---

**Priorities**
1. Finish remaining safeguards: Preflight result caching and instrumentation to monitor gains.  
2. Revisit Drive/API flows for additional batching opportunities after verifying real-world timings.
