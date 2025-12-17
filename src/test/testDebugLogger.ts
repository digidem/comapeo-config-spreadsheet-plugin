/**
 * Test function to verify debug logging works
 * Run this manually from Apps Script editor to test
 */
function testDebugLogger() {
  console.log("Testing debug logger system...");

  // Initialize debug logging
  initDebugLogging();

  // Test different log types
  debugLog("This is a normal log message");
  debugSuccess("This is a success message");
  debugWarn("This is a warning message");
  debugError("This is an error message");

  debugSection("TESTING ICONS");
  debugLog("Testing icon extraction...");
  debugLog("Found 5 symbols in sprite");
  debugLog("✓ Extracted icon: water");
  debugLog("❌ Failed icon: broken-icon");

  debugSection("TESTING COMPLETE");
  debugLog("All tests passed!");

  // Finalize
  finalizeDebugLogging();

  console.log("Debug logger test complete. Check the 'Debug Logs' sheet!");

  // Show alert to user
  SpreadsheetApp.getUi().alert(
    "Test Complete",
    "Debug logging test complete! Check the 'Debug Logs' sheet (red tab) to see the results.",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
