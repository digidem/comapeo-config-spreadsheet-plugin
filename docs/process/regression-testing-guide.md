# Regression Testing Guide

**Created**: 2025-11-02
**Purpose**: Guide for creating and using test spreadsheets for regression testing

---

## Overview

The regression testing feature allows you to create a safe, sanitized copy of your production CoMapeo configuration spreadsheet for testing purposes. This is essential for validating code changes and bug fixes without risking production data.

## When to Use Test Spreadsheets

**ALWAYS create a test spreadsheet before:**
- Making code changes to the plugin
- Testing new features
- Running the regression test suite (Task 5)
- Debugging issues
- Validating bug fixes
- Performance testing

**NEVER test directly on production spreadsheets**

---

## Creating a Test Spreadsheet

### Via Menu

1. **Open your production spreadsheet**
2. **Click "CoMapeo Tools" menu**
3. **Select "Create Test Spreadsheet for Regression"**
4. **Review the confirmation dialog**
   - Read what will be sanitized
   - Click "Yes" to proceed or "No" to cancel
5. **Wait for processing**
   - The plugin creates a new spreadsheet
   - All data is copied and sanitized
   - Validation runs automatically
6. **Success dialog shows**
   - Test spreadsheet URL
   - Spreadsheet ID
   - Confirmation that it's ready

### Via Script (Advanced)

```javascript
// Run in Apps Script editor
const result = duplicateSpreadsheetForTesting();
console.log(`Test spreadsheet created: ${result.url}`);
```

---

## What Gets Sanitized

### Production → Test Transformations

| Production Element | Test Replacement | Example |
|-------------------|------------------|---------|
| **Dataset ID** | `comapeo-test-{DATE}` | `comapeo-wildlife` → `comapeo-test-20251102` |
| **Spreadsheet Name** | `TEST_{DATE}_{original}` | `Wildlife Survey` → `TEST_20251102_Wildlife Survey` |
| **Category Names** | `Test Category {n}` | `River` → `Test Category 1` |
| **Field Names** | `Test Field {n}` | `Width` → `Test Field 1` |
| **Google Drive URLs** | Placeholder icon | `https://drive.google.com/...` → `[PLACEHOLDER]` |
| **Icon References** | Default placeholder | Production icons → `https://drive.google.com/file/d/1n1jR7XPFBgtpn544f7PMKxN2djewl60K/view?usp=drive_link` |
| **Helper Text** | Generic text | `"What is the width?"` → `"This is test helper text for testing purposes."` |
| **Options** | `Test Option {n}` | `Small, Medium, Large` → `Test Option 1, Test Option 2, Test Option 3` |
| **Translation Content** | (Cleared) | All translations → Empty |
| **Colors** | Default blue | Any color → `#0066CC` |

### What Gets Preserved

✅ **Structure preserved:**
- Sheet names and order
- Column headers
- Field types (text, number, single choice checkbox, multi-select)
- Validation rules
- Sheet formatting

✅ **Relationships preserved:**
- Category → Field references
- Field → Option mappings
- Translation sheet structure

---

## Validation Checks

The test spreadsheet undergoes automatic validation to ensure:

### ✅ Required Checks (Errors if fail)

- [ ] Spreadsheet name starts with "TEST_"
- [ ] All 6 required sheets exist:
  - Categories
  - Details
  - Category Translations
  - Detail Label Translations
  - Detail Helper Text Translations
  - Detail Option Translations
- [ ] No production Google Drive URLs remain
- [ ] Metadata contains:
  - `dataset_id` with "test-" prefix
  - `name` with "test" in value
  - `version` field present

### ⚠️ Warning Checks (Informational)

- [ ] Category names start with "Test Category"
- [ ] Field names start with "Test Field"
- [ ] Translation sheets are empty (content cleared)
- [ ] No production-specific content remains

---

## Using Test Spreadsheets

### For Development

```javascript
// In Apps Script editor, set active spreadsheet to test
const testSpreadsheet = SpreadsheetApp.openById('TEST_SPREADSHEET_ID');
SpreadsheetApp.setActiveSpreadsheet(testSpreadsheet);

// Run your tests
generateCoMapeoCategory();
lintAllSheets();
importCategoryFile();
```

### For Regression Testing

1. **Open the test spreadsheet**
2. **Run all plugin functions:**
   - Generate CoMapeo Category
   - Import category file
   - Generate icons
   - Manage languages & translate
   - Lint sheets
3. **Verify results**
   - Check that all operations complete without errors
   - Validate output files
   - Confirm no production references leak through

### For Bug Reproduction

1. **Create test spreadsheet**
2. **Set up bug scenario**
   - Add specific data that triggers the bug
   - Configure edge cases
   - Set up test conditions
3. **Reproduce and debug**
4. **Document findings**
5. **Clean up test spreadsheet**

---

## Test Spreadsheet Best Practices

### ✅ DO

- **Always use test spreadsheets for testing**
- **Give test spreadsheets descriptive names**
- **Test both success and failure scenarios**
- **Keep test data generic and non-sensitive**
- **Verify validation passes before using**
- **Document what you're testing**
- **Clean up old test spreadsheets regularly**

### ❌ DON'T

- **Never test on production spreadsheets**
- **Don't include real project names or data**
- **Don't share test spreadsheets publicly**
- **Don't use production Drive URLs in tests**
- **Don't leave test spreadsheets with production icons**
- **Don't ignore validation warnings**
- **Don't use test spreadsheets for real configurations**

---

## Maintenance

### Naming Convention

Test spreadsheets follow this format:
```
TEST_{YYYYMMDD}_{OriginalSpreadsheetName}
```

Examples:
- `TEST_20251102_Wildlife Survey`
- `TEST_20251103_Deforestation Monitoring`
- `TEST_20251102_Infrastructure Assessment`

### Cleanup

**Automatic:** Test spreadsheets are clearly marked and can be filtered by "TEST_" prefix.

**Manual cleanup:**
1. Go to Google Drive
2. Search for `TEST_` to find all test spreadsheets
3. Delete old test spreadsheets (older than 1 week)
4. Keep only current test spreadsheet(s)

**Programmatic cleanup:**
```javascript
// Clean up test spreadsheets older than 7 days
cleanupTestArtifacts(10080); // 10080 minutes = 7 days
```

---

## Troubleshooting

### Validation Fails

**Problem:** Test spreadsheet validation reports errors

**Solutions:**
1. Check console logs for specific error details
2. Verify all required sheets were created
3. Ensure no production URLs remain
4. Check metadata fields are properly sanitized
5. Re-create test spreadsheet if needed

### Menu Item Missing

**Problem:** "Create Test Spreadsheet for Regression" not in menu

**Solutions:**
1. Refresh the spreadsheet (F5)
2. Close and reopen the spreadsheet
3. Check that plugin is properly installed
4. Verify `onOpen()` function runs without errors

### Function Not Found

**Problem:** Error "Function createTestSpreadsheetForRegression not found"

**Solutions:**
1. Ensure `regressionTesting.ts` is deployed
2. Check for syntax errors in the file
3. Verify function name is correct
4. Check Apps Script editor for compilation errors

### Icons Not Replaced

**Problem:** Production icon URLs remain in test spreadsheet

**Solutions:**
1. Check validation errors - this should be caught
2. Verify placeholder URL is accessible
3. Re-run sanitization if needed
4. Check console for error messages during copy

---

## Integration with Regression Test Suite

### Task 5 Connection

This feature (Task 4) enables Task 5 (regression test suite) by providing:

- ✅ Safe test environment
- ✅ Sanitized production-like data
- ✅ Automated validation
- ✅ Consistent test baseline

### Workflow

```
Task 4: Create Test Spreadsheet
    ↓
Test spreadsheet ready
    ↓
Task 5: Build Regression Test Suite
    ↓
Automated tests run on test spreadsheet
    ↓
Task 6: Capture Baseline Performance Metrics
```

---

## Advanced Usage

### Custom Sanitization

You can modify `sanitizeRowData()` in `src/regressionTesting.ts` to customize sanitization rules for specific use cases.

### Batch Testing

```javascript
// Create multiple test spreadsheets for different scenarios
const scenarios = ['basic', 'complex', 'multilang', 'large'];

scenarios.forEach(scenario => {
  const result = duplicateSpreadsheetForTesting();
  console.log(`Created test for ${scenario}: ${result.url}`);
  // Set up scenario-specific test data
});
```

### Performance Testing

```javascript
// Measure performance on test spreadsheet
const start = Date.now();
generateCoMapeoCategory();
const duration = Date.now() - start;
console.log(`Export took ${duration}ms`);
```

---

## Support

### Documentation
- Regression Strategy: `docs/process/regression-strategy.md`
- Next Steps: `NEXT_STEPS.md` (Task 4 section)
- This guide: `docs/process/regression-testing-guide.md`

### Logging
All operations are logged with scope "RegressionTesting". Check Apps Script console for detailed logs.

### Common Issues
See [Troubleshooting](#troubleshooting) section above.

---

## Summary

✅ **Task 4 Complete: Test Spreadsheet Creation**

The regression testing feature is now fully implemented and integrated. You can safely create test spreadsheets for all future testing needs.

**Next Steps:**
- Proceed to Task 5: Build regression test suite
- Use test spreadsheets before making any code changes
- Maintain test spreadsheet hygiene

---

**Created**: 2025-11-02
**Last Updated**: 2025-11-02
**Status**: ✅ Implementation Complete
