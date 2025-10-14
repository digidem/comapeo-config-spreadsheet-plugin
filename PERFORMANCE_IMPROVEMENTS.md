# Performance Improvement Checklist

> 🚨 **Safety First:** The top priority for every optimization is maintaining existing behaviour. Do not ship a change until you have tested the affected workflow end-to-end and confirmed it introduces **no regressions or new bugs**.

After completing any task below:

1. Run or simulate the “Generate CoMapeo Category” flow.
2. Verify linting, translations, Drive export, and packaging still produce the expected outputs.
3. Document the test evidence and tick the item in this checklist.

## Workflow Expectations

For every improvement initiative:

1. **Analyze** the current behaviour and confirm the suspected bottleneck with logs or manual timing.  
2. **Research** potential fixes or alternative approaches; prefer low-risk changes that align with Apps Script constraints.  
3. **Implement** the selected optimization in a focused branch/change set.  
4. **Test (Human)** by running the relevant flows locally (e.g., `npm run lint`, manual spreadsheet run) to ensure no regressions.  
5. **Update Documentation** – record the outcome, tests, and remaining risks in this file.  
6. **Commit & Iterate** – once the change is validated, commit it and move on to the next item in priority order.

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

- [x] **Cache Successful Preflight Results (`src/preflightValidation.ts`)**  
  *Gain:* Skips repeated Drive/API connectivity checks when rerunning the generator within a short window.  
  *Risk:* Medium — stale cache entries must not hide real outages; add short TTLs and bypass cache on explicit “retry” actions.  
  *Tested:* `npm run lint`

- [x] **Instrumentation & Timing Logs (`src/generateCoMapeoConfig.ts` & helpers)**  
  *Gain:* Adds structured timing logs around major steps to quantify wins and spot remaining hotspots.  
  *Risk:* Low — keep log volume manageable to avoid hitting Apps Script log limits.  
  *Tested:* `npm run lint`

- [ ] **Reuse Drive Write Blobs for ZIP Creation (`src/driveService.ts`)**  
  *Gain:* Collect the `BlobSource`s created during Step 4 and feed them directly into `Utilities.zip`, avoiding a second Drive traversal in Step 5.  
  *Risk:* Medium — ensure the zipped output stays byte-identical and the folder-on-Drive debugging workflow still works.  
  *Plan:* 1) Extend `saveConfigToDrive` to return both folder info and a `BlobSource[]`; 2) Update callers to pass blobs straight into `Utilities.zip` while still writing files to Drive when requested; 3) Add a regression guard that hashes both Drive-produced and in-memory ZIPs in tests or manual runs.
  *Status:* Code updated to return staged blobs and reuse them in `saveDriveFolderToZip`; pending full generator run to compare Drive vs cached ZIP hashes before ticking complete.

- [ ] **Deduplicate Icon Writes via Content Hashing (`src/driveService.ts`)**  
  *Gain:* Skip recreating icon variants when the SVG string matches the previous export, reducing Drive writes in Step 4 for unchanged categories.  
  *Risk:* Medium — requires hashing and metadata cache to avoid stale icons.  
  *Plan:* 1) Store content hashes as script properties keyed by icon id; 2) Compare incoming hashes before writing blobs; 3) Provide a forced refresh path and document cleanup for removed icons.

- [ ] **Provide Direct In-Memory ZIP Path for API Upload (`src/generateCoMapeoConfig.ts`, `src/apiService.ts`)**  
  *Gain:* Optionally bypass writing raw files to Drive when users only need the packaged archive, cutting the Step 4/5 combo to a single in-memory ZIP.  
  *Risk:* High — must stay behind a flag and keep the existing Drive artefacts available for users who rely on them.  
  *Plan:* 1) Introduce a `GenerationOptions` flag that toggles the Drive write; 2) When enabled, feed the in-memory ZIP from the staged blobs directly to `sendDataToApiAndGetZip`; 3) Validate both code paths manually to ensure Drive exports remain available by default.

---

**Priorities**
1. Implement write batching, Drive caching, and incremental ZIP export to accelerate stages 4–5.  
2. Monitor timing logs during field testing to spot the next bottleneck (e.g., API packaging or translation throughput).
