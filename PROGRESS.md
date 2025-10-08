# CoMapeo Config Spreadsheet Plugin - Progress Tracker

## Current Status

**Working Version**: Commit `858725e` - Menu displays correctly, basic functionality working

## Active Objectives

### 1. Fix "Skip Translations" Button ⏳
**Status**: In Progress
**Branch**: `import-category`
**Stashed**: Yes (`git stash list` to view)

**Problem**:
- "Skip Translations" button not clickable/functional
- Forces translation even when user wants to skip

**Solution Approach**:
- Identify duplicate function definitions causing UI conflicts
- Add comprehensive debug logging (`[CLIENT]`, `[SERVER]`, `[PIPELINE]`, `[TRANSLATION]` prefixes)
- Fix button event handlers to call correct server-side function

**Files Modified** (currently stashed):
- `src/dialog.ts` - Remove duplicate `skipTranslation()` function
- `src/generateCoMapeoConfig.ts` - Add `generateCoMapeoConfigSkipTranslation()` function with logging
- `src/translation.ts` - Add skip detection logging
- `src/text/dialog.ts` - Update dialog text for skip button
- `src/preflightValidation.ts` - NEW: Pre-flight validation checks
- `src/test/testSkipTranslation.ts` - NEW: Skip translation tests

**Next Steps**:
1. Restore stashed changes carefully
2. Test skip translation button functionality
3. Verify no UI breakage
4. Commit working skip translation fix

---

### 2. Improve Step 5 Performance Bottleneck 🔴
**Status**: Not Started
**Priority**: High

**Problem**:
- Step 5 (Processing data) takes extremely long even for small spreadsheets
- Sometimes hangs indefinitely and never completes
- No visibility into what's causing the delay

**Current Code** (`src/generateCoMapeoConfig.ts:47-49`):
```typescript
// Step 5: Process data
const config = processDataForCoMapeo(data);
showProcessingModalDialog(processingDialogTexts[4][locale]);
```

**Investigation Needed**:
- Profile `processDataForCoMapeo()` to identify slow operations
- Check if it's in fields, presets, icons, metadata, or translations processing
- Look for synchronous operations that could be batched
- Check for unnecessary API calls or Drive operations

**Proposed Solutions**:
1. Break Step 5 into sub-steps with progress indicators:
   - Step 5a: Processing fields
   - Step 5b: Processing presets
   - Step 5c: Processing icons
   - Step 5d: Processing metadata
   - Step 5e: Processing translations

2. Add timing logs to identify bottleneck:
   ```typescript
   const startTime = Date.now();
   const fields = processFields(data);
   console.log(`[PERF] Fields processed in ${Date.now() - startTime}ms`);
   ```

3. Optimize slow operations (TBD after profiling)

**Files to Investigate**:
- `src/generateCoMapeoConfig.ts:94-117` - Main processing function
- `src/generateConfig/processFields.ts`
- `src/generateConfig/processPresets.ts`
- `src/generateConfig/processMetadata.ts`
- `src/generateConfig/processTranslations.ts`
- `src/icons.ts` - Icon processing

---

### 3. Improve ZIP/API Phase Performance & Visibility 🔴
**Status**: Not Started
**Priority**: High

**Problem**:
- Steps 7-8 (Zipping folder + API call) often hang with no progress indication
- No way to know if it's stuck on zipping or API call
- No visibility into what's happening or where failure occurs

**Current Code** (`src/generateCoMapeoConfig.ts:56-62`):
```typescript
// Step 7: Create zip
showProcessingModalDialog(processingDialogTexts[6][locale]);
const folderZip = saveDriveFolderToZip(id);

// Step 8: Send to API and get result
const configUrl = sendDataToApiAndGetZip(folderZip, config.metadata);
```

**Proposed Solutions**:

1. **Break into granular steps with progress dialogs**:
   - Step 7: Collecting files from Drive folder
   - Step 8: Creating ZIP archive (with file count progress)
   - Step 9: Uploading ZIP to API server
   - Step 10: Waiting for API processing
   - Step 11: Downloading final package

2. **Add comprehensive logging**:
   ```typescript
   // In saveDriveFolderToZip()
   console.log(`[ZIP] Collecting ${fileCount} files from folder...`);
   console.log(`[ZIP] Creating archive (${totalSize} bytes)...`);
   console.log(`[ZIP] Archive created in ${elapsed}ms`);

   // In sendDataToApiAndGetZip()
   console.log(`[API] Uploading ${zipSize} bytes to ${apiUrl}...`);
   console.log(`[API] Upload complete, waiting for processing...`);
   console.log(`[API] Response received: ${responseCode}`);
   ```

3. **Add timeout handling and retry logic**:
   - Detect timeout vs. network errors vs. API errors
   - Implement exponential backoff for retries
   - Show meaningful error messages to user

4. **Add file count/size progress indicators**:
   - Show "Zipping 45/120 files..." during archive creation
   - Show upload progress if possible
   - Estimated time remaining

**Files to Modify**:
- `src/driveService.ts:1-43` - `saveDriveFolderToZip()` function
- `src/apiService.ts:48-170` - `sendDataToApiAndGetZip()` function
- `src/text/dialog.ts:157-237` - Update progress dialog texts

**Implementation Plan**:
1. Add granular progress steps to `processingDialogTexts` array
2. Add logging and progress tracking to `saveDriveFolderToZip()`
3. Add timeout detection and better error handling to `sendDataToApiAndGetZip()`
4. Update `generateCoMapeoConfigWithSelectedLanguages()` to show new progress steps

---

## Known Issues & Blockers

### Issue 1: ES6 Imports Break Apps Script ✅ FIXED
**Resolution**: Commit `858725e`

**Problem**:
- ES6 `import` statements in `index.ts` caused syntax errors
- Prevented entire script from loading
- Menu didn't appear at all

**Root Cause**:
Google Apps Script doesn't support ES6 module imports/exports. When `clasp push` uploads the files, they're concatenated into a single script where all functions are global. The `import` statement caused a compilation error.

**Fix**:
Removed ES6 imports and used `typeof` checks to safely reference global variables:
```typescript
// Before (broken):
import { getVersionInfo, VERSION, COMMIT } from "./src/version";

// After (working):
// Note: getVersionInfo, VERSION, COMMIT are defined in src/version.ts
// Apps Script will compile all .ts files together, making them globally available
if (typeof VERSION !== 'undefined' && typeof COMMIT !== 'undefined') {
  console.log(`CoMapeo Config Spreadsheet Plugin v${VERSION} (${COMMIT})`);
}
```

**Lesson Learned**:
- Always use global scope for Apps Script
- Use `export` in individual files for TypeScript type checking
- Reference globals with `typeof` checks for safety
- Test menu appearance after any structural changes

---

## Development Notes

### Testing Strategy
1. Always test menu appearance after pushing changes
2. Check browser console for client-side errors
3. Check Apps Script logs (View > Logs) for server-side errors
4. Use `git stash` to safely test if recent changes broke functionality

### Performance Testing Approach
1. Create minimal test spreadsheet (5 categories, 10 fields)
2. Time each step with console.log
3. Identify operations taking >2 seconds
4. Profile with Apps Script execution logs
5. Test with progressively larger spreadsheets

### Debugging Commands
```bash
# View stashed changes
git stash list
git stash show -p stash@{0}

# Apply stashed changes
git stash pop

# Push to Apps Script
npm run push

# Check recent commits
git log --oneline -5
```

---

## Next Session Priorities

1. **Restore and test skip translation fix**
   - Pop stash
   - Test in clean environment
   - Verify no UI breakage
   - Commit if working

2. **Profile Step 5 performance**
   - Add timing logs to each sub-process
   - Test with various spreadsheet sizes
   - Identify slowest operation
   - Implement optimization

3. **Improve ZIP/API visibility**
   - Break into granular steps
   - Add progress indicators
   - Add comprehensive logging
   - Test with network delays

---

## Success Criteria

### Skip Translation Fix
- [ ] "Skip Translation" button is clickable
- [ ] Clicking button skips translation and proceeds with config generation
- [ ] No translation errors or forced translations
- [ ] Logging shows clear skip path in console

### Step 5 Performance
- [ ] Step 5 completes in <10 seconds for small spreadsheets (5 categories, 10 fields)
- [ ] Step 5 completes in <30 seconds for medium spreadsheets (20 categories, 50 fields)
- [ ] Progress indicators show which sub-step is running
- [ ] No indefinite hangs

### ZIP/API Performance
- [ ] User can see which step is running (collect, zip, upload, process)
- [ ] Timeout errors are detected and reported clearly
- [ ] Retry logic handles transient failures
- [ ] File count/size visible during processing
- [ ] Complete in <2 minutes for typical configs

---

**Last Updated**: 2025-10-08
**Current Commit**: `858725e` (Working baseline)
**Next Commit Target**: Skip translation fix with comprehensive logging
