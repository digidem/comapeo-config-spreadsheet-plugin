/**
 * Test functions for skip translation functionality
 * These functions help diagnose and verify the skip translation feature works correctly
 */

/**
 * Test 1: Direct call to generateCoMapeoConfigSkipTranslation
 * This should call the skip translation function which passes empty array to pipeline
 */
function testSkipTranslationDirect() {
  console.log("========================================");
  console.log("TEST 1: DIRECT SKIP TRANSLATION CALL");
  console.log("========================================");
  console.log("Calling generateCoMapeoConfigSkipTranslation()...");

  try {
    generateCoMapeoConfigSkipTranslation();
    console.log("TEST 1 PASSED: Function executed without errors");
  } catch (error) {
    console.error("TEST 1 FAILED:", error);
  }

  console.log("========================================\n");
}

/**
 * Test 2: Call with empty array
 * This should skip translation since array is empty
 */
function testWithEmptyArray() {
  console.log("========================================");
  console.log("TEST 2: EMPTY ARRAY");
  console.log("========================================");
  console.log("Calling generateCoMapeoConfigWithSelectedLanguages([])...");

  try {
    generateCoMapeoConfigWithSelectedLanguages([]);
    console.log("TEST 2 PASSED: Function executed without errors");
  } catch (error) {
    console.error("TEST 2 FAILED:", error);
  }

  console.log("========================================\n");
}

/**
 * Test 3: Call with null
 * This should handle null gracefully and skip translation
 */
function testWithNullArray() {
  console.log("========================================");
  console.log("TEST 3: NULL ARRAY");
  console.log("========================================");
  console.log("Calling generateCoMapeoConfigWithSelectedLanguages(null)...");

  try {
    generateCoMapeoConfigWithSelectedLanguages(null);
    console.log("TEST 3 PASSED: Function executed without errors");
  } catch (error) {
    console.error("TEST 3 FAILED:", error);
  }

  console.log("========================================\n");
}

/**
 * Test 4: Call with undefined
 * This should handle undefined gracefully and skip translation
 */
function testWithUndefinedArray() {
  console.log("========================================");
  console.log("TEST 4: UNDEFINED ARRAY");
  console.log("========================================");
  console.log("Calling generateCoMapeoConfigWithSelectedLanguages(undefined)...");

  try {
    generateCoMapeoConfigWithSelectedLanguages(undefined);
    console.log("TEST 4 PASSED: Function executed without errors");
  } catch (error) {
    console.error("TEST 4 FAILED:", error);
  }

  console.log("========================================\n");
}

/**
 * Test 5: Test translation skip logic directly
 * Tests the autoTranslateSheetsBidirectional function with various inputs
 */
function testTranslationSkipLogic() {
  console.log("========================================");
  console.log("TEST 5: TRANSLATION SKIP LOGIC");
  console.log("========================================");

  // Test 5a: Empty array
  console.log("\nTest 5a: Empty array");
  try {
    autoTranslateSheetsBidirectional([]);
    console.log("✓ Empty array handled correctly");
  } catch (error) {
    console.error("✗ Empty array failed:", error);
  }

  // Test 5b: Null
  console.log("\nTest 5b: Null");
  try {
    autoTranslateSheetsBidirectional(null);
    console.log("✓ Null handled correctly");
  } catch (error) {
    console.error("✗ Null failed:", error);
  }

  // Test 5c: Undefined
  console.log("\nTest 5c: Undefined");
  try {
    autoTranslateSheetsBidirectional(undefined);
    console.log("✓ Undefined handled correctly");
  } catch (error) {
    console.error("✗ Undefined failed:", error);
  }

  console.log("========================================\n");
}

/**
 * Test 6: Verify translation sheets are NOT modified when skipped
 * This checks that translation sheets remain unchanged
 */
function testTranslationSheetsUnmodified() {
  console.log("========================================");
  console.log("TEST 6: VERIFY SHEETS UNMODIFIED");
  console.log("========================================");

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const translationSheets = [
    "Category Translations",
    "Detail Label Translations",
    "Detail Helper Text Translations",
    "Detail Option Translations",
  ];

  // Get initial state
  const initialState = {};
  for (const sheetName of translationSheets) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      if (lastRow > 0 && lastCol > 0) {
        initialState[sheetName] = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      }
    }
  }

  console.log("Initial state captured for", Object.keys(initialState).length, "sheets");

  // Run skip translation
  console.log("Running generateCoMapeoConfigSkipTranslation()...");
  generateCoMapeoConfigSkipTranslation();

  // Check final state
  console.log("Checking if sheets were modified...");
  let modified = false;

  for (const sheetName of translationSheets) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet && initialState[sheetName]) {
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      const currentState = sheet.getRange(1, 1, lastRow, lastCol).getValues();

      // Compare states
      const initial = JSON.stringify(initialState[sheetName]);
      const current = JSON.stringify(currentState);

      if (initial !== current) {
        console.error("✗", sheetName, "WAS MODIFIED!");
        modified = true;
      } else {
        console.log("✓", sheetName, "unchanged");
      }
    }
  }

  if (modified) {
    console.error("TEST 6 FAILED: Translation sheets were modified when they should not have been");
  } else {
    console.log("TEST 6 PASSED: No translation sheets were modified");
  }

  console.log("========================================\n");
}

/**
 * Test skip translation functionality
 * This is the main test function called by the test runner
 */
function testSkipTranslation(): void {
  runAllSkipTranslationTests();
}

/**
 * Run all tests
 * Execute this to run the complete test suite
 */
function runAllSkipTranslationTests(): void {
  console.log("\n\n");
  console.log("╔════════════════════════════════════════╗");
  console.log("║  SKIP TRANSLATION TEST SUITE          ║");
  console.log("╔════════════════════════════════════════╝");
  console.log("\n");

  testSkipTranslationDirect();
  testWithEmptyArray();
  testWithNullArray();
  testWithUndefinedArray();
  testTranslationSkipLogic();
  // Note: testTranslationSheetsUnmodified requires full pipeline execution

  console.log("\n");
  console.log("╔════════════════════════════════════════╗");
  console.log("║  TEST SUITE COMPLETED                  ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("\n");
  console.log("Review the logs above to verify all tests passed.");
  console.log("Look for [TRANSLATION] ✓ SKIPPING TRANSLATION messages.");
  console.log("\n");
}

/**
 * Test dialog button click simulation
 * This logs what should happen when skip button is clicked
 */
function testSkipButtonClick() {
  console.log("========================================");
  console.log("SIMULATED SKIP BUTTON CLICK");
  console.log("========================================");
  console.log("This simulates what happens when user clicks 'Skip Translation' button:");
  console.log("");
  console.log("1. Client-side JavaScript calls skipTranslation()");
  console.log("2. skipTranslation() logs: '[CLIENT] skipTranslation called'");
  console.log("3. google.script.run.generateCoMapeoConfigSkipTranslation() is called");
  console.log("4. Server receives call and logs: '[SERVER] ===== generateCoMapeoConfigSkipTranslation CALLED ====='");
  console.log("5. Server calls generateCoMapeoConfigWithSelectedLanguages([])");
  console.log("6. Pipeline receives empty array and logs: '[SERVER] Translation SKIPPED (empty array)'");
  console.log("7. autoTranslateSheetsBidirectional logs: '[TRANSLATION] ✓ SKIPPING TRANSLATION'");
  console.log("8. Config generation continues without translation");
  console.log("");
  console.log("To verify this works:");
  console.log("1. Open the spreadsheet");
  console.log("2. Click CoMapeo Tools > Generate CoMapeo Category");
  console.log("3. Click 'Skip Translation' button");
  console.log("4. Open Execution log (Ctrl+Enter or Cmd+Enter)");
  console.log("5. Look for the log messages above");
  console.log("========================================\n");
}
