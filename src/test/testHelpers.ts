/**
 * Test Helper Functions
 *
 * Provides utilities for test setup, teardown, and state management.
 * Ensures tests don't leave artifacts or modify production data.
 */

/**
 * Spreadsheet backup representation
 */
interface SpreadsheetBackup {
  timestamp: number;
  sheets: Array<{
    name: string;
    data: any[][];
    backgrounds: string[][];
    fontWeights: string[][];
    validations: any[];
  }>;
}

/**
 * Test cleanup result
 */
interface CleanupResult {
  success: boolean;
  itemsCleaned: number;
  errors?: string[];
}

/**
 * Individual test result
 */
interface TestResult {
  name: string;
  success: boolean;
  message: string;
  duration?: number;
  details?: string[];
  errors?: string[];
  warnings?: string[];
}

/**
 * Test suite summary
 */
interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  totalDuration: number;
  results: TestResult[];
}

// Lazy logger initialization to avoid compilation order issues
function getLog() {
  return typeof AppLogger !== 'undefined' ? AppLogger.scope("TestHelpers") : console;
}

/**
 * Test Runner - Collects and reports test results
 */
class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  /**
   * Start a new test suite
   */
  start(): void {
    const log = getLog();
    this.results = [];
    this.startTime = Date.now();
    log.info("===== Test Suite Started =====");
  }

  /**
   * Add a test result
   *
   * @param result - The test result to add
   */
  addResult(result: TestResult): void {
    const log = getLog();
    this.results.push(result);

    const status = result.success ? "✅ PASSED" : "❌ FAILED";
    const duration = result.duration ? ` (${result.duration}ms)` : "";
    log.info(`${status}: ${result.name}${duration}`);

    if (result.errors && result.errors.length > 0) {
      result.errors.forEach((error) => log.error(`  - ${error}`));
    }

    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach((warning) => log.warn(`  - ${warning}`));
    }
  }

  /**
   * Run a single test with automatic result tracking
   *
   * @param testName - Name of the test
   * @param testFn - Test function to run
   * @returns Test result
   */
  runTest(testName: string, testFn: () => TestResult): TestResult {
    const log = getLog();
    const startTime = Date.now();
    log.info(`Running test: ${testName}`);

    try {
      const result = testFn();
      result.duration = Date.now() - startTime;
      result.name = testName;
      this.addResult(result);
      return result;
    } catch (error) {
      const result: TestResult = {
        name: testName,
        success: false,
        message: `Test threw an error: ${error.message}`,
        duration: Date.now() - startTime,
        errors: [error.message, error.stack || ""],
      };
      this.addResult(result);
      return result;
    }
  }

  /**
   * Get test suite summary
   *
   * @returns Test summary object
   */
  getSummary(): TestSummary {
    const totalDuration = Date.now() - this.startTime;

    const summary: TestSummary = {
      totalTests: this.results.length,
      passed: this.results.filter((r) => r.success).length,
      failed: this.results.filter((r) => !r.success).length,
      skipped: 0,
      totalDuration,
      results: this.results,
    };

    return summary;
  }

  /**
   * Display test summary in console
   */
  logSummary(): void {
    const summary = this.getSummary();

    log.info("===== Test Suite Completed =====");
    log.info(`Total Tests: ${summary.totalTests}`);
    log.info(`✅ Passed: ${summary.passed}`);
    log.info(`❌ Failed: ${summary.failed}`);
    log.info(`Duration: ${summary.totalDuration}ms`);

    if (summary.failed > 0) {
      log.warn("\nFailed Tests:");
      summary.results
        .filter((r) => !r.success)
        .forEach((result) => {
          log.warn(`  - ${result.name}: ${result.message}`);
          if (result.errors) {
            result.errors.forEach((error) => log.error(`    ${error}`));
          }
        });
    }
  }

  /**
   * Show test summary in UI dialog
   */
  showSummaryDialog(): void {
    const summary = this.getSummary();
    const ui = SpreadsheetApp.getUi();

    const passRate = summary.totalTests > 0
      ? Math.round((summary.passed / summary.totalTests) * 100)
      : 0;

    const durationSeconds = (summary.totalDuration / 1000).toFixed(2);

    let message = `Test Results:\n\n`;
    message += `Total Tests: ${summary.totalTests}\n`;
    message += `✅ Passed: ${summary.passed}\n`;
    message += `❌ Failed: ${summary.failed}\n`;
    message += `Pass Rate: ${passRate}%\n`;
    message += `Duration: ${durationSeconds}s\n`;

    if (summary.failed > 0) {
      message += `\nFailed Tests:\n`;
      summary.results
        .filter((r) => !r.success)
        .forEach((result, index) => {
          message += `\n${index + 1}. ${result.name}\n`;
          message += `   ${result.message}\n`;
          if (result.errors && result.errors.length > 0) {
            message += `   Errors: ${result.errors[0]}\n`;
          }
        });
    } else {
      message += `\n🎉 All tests passed!`;
    }

    const title = summary.failed > 0
      ? "Test Suite - Some Tests Failed"
      : "Test Suite - All Tests Passed";

    ui.alert(title, message, ui.ButtonSet.OK);
  }

  /**
   * Generate HTML report
   *
   * @returns HTML string for detailed test report
   */
  generateHtmlReport(): string {
    const summary = this.getSummary();

    let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .header { background: #4285f4; color: white; padding: 20px; border-radius: 8px; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .stat { background: white; padding: 15px; border-radius: 8px; flex: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stat-value { font-size: 32px; font-weight: bold; margin: 10px 0; }
    .passed { color: #34a853; }
    .failed { color: #ea4335; }
    .test-result { background: white; margin: 10px 0; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .test-passed { border-left: 4px solid #34a853; }
    .test-failed { border-left: 4px solid #ea4335; }
    .test-name { font-weight: bold; font-size: 16px; }
    .test-duration { color: #666; font-size: 12px; }
    .test-error { background: #fee; padding: 10px; border-radius: 4px; margin-top: 10px; font-family: monospace; font-size: 12px; }
    .test-warning { background: #fffbea; padding: 10px; border-radius: 4px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Test Suite Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>

  <div class="summary">
    <div class="stat">
      <div>Total Tests</div>
      <div class="stat-value">${summary.totalTests}</div>
    </div>
    <div class="stat">
      <div class="passed">Passed</div>
      <div class="stat-value passed">${summary.passed}</div>
    </div>
    <div class="stat">
      <div class="failed">Failed</div>
      <div class="stat-value failed">${summary.failed}</div>
    </div>
    <div class="stat">
      <div>Duration</div>
      <div class="stat-value">${(summary.totalDuration / 1000).toFixed(2)}s</div>
    </div>
  </div>

  <h2>Test Results</h2>
`;

    summary.results.forEach((result) => {
      const statusClass = result.success ? "test-passed" : "test-failed";
      const statusIcon = result.success ? "✅" : "❌";

      html += `
  <div class="test-result ${statusClass}">
    <div class="test-name">${statusIcon} ${result.name}</div>
    <div class="test-duration">${result.duration}ms</div>
    <div>${result.message}</div>
`;

      if (result.errors && result.errors.length > 0) {
        html += `<div class="test-error">`;
        result.errors.forEach((error) => {
          html += `${error}<br>`;
        });
        html += `</div>`;
      }

      if (result.warnings && result.warnings.length > 0) {
        html += `<div class="test-warning">`;
        result.warnings.forEach((warning) => {
          html += `⚠️ ${warning}<br>`;
        });
        html += `</div>`;
      }

      html += `</div>`;
    });

    html += `
</body>
</html>
`;

    return html;
  }

  /**
   * Complete the test suite and show summary
   *
   * @param showDialog - Whether to show UI dialog (default: true)
   */
  complete(showDialog: boolean = true): TestSummary {
    this.logSummary();

    if (showDialog) {
      this.showSummaryDialog();
    }

    return this.getSummary();
  }
}

/**
 * Global test runner instance
 */
let globalTestRunner: TestRunner | null = null;

/**
 * Get or create the global test runner
 */
function getTestRunner(): TestRunner {
  if (!globalTestRunner) {
    globalTestRunner = new TestRunner();
  }
  return globalTestRunner;
}

/**
 * Start a new test suite
 */
function startTestSuite(): TestRunner {
  const runner = new TestRunner();
  runner.start();
  globalTestRunner = runner;
  return runner;
}

/**
 * Complete the current test suite and show summary
 *
 * @param showDialog - Whether to show UI dialog
 * @returns Test summary
 */
function completeTestSuite(showDialog: boolean = true): TestSummary {
  const runner = getTestRunner();
  return runner.complete(showDialog);
}

/**
 * Creates a complete backup of the active spreadsheet
 *
 * @returns Spreadsheet backup object
 *
 * @example
 * const backup = backupSpreadsheet();
 * // ... run tests ...
 * restoreSpreadsheet(backup);
 */
function backupSpreadsheet(): SpreadsheetBackup {
  log.info("Creating spreadsheet backup...");

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  const backup: SpreadsheetBackup = {
    timestamp: Date.now(),
    sheets: [],
  };

  sheets.forEach((sheet) => {
    try {
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();

      if (lastRow === 0 || lastCol === 0) {
        log.debug(`Sheet ${sheet.getName()} is empty, storing empty backup`);
        backup.sheets.push({
          name: sheet.getName(),
          data: [[]],
          backgrounds: [[]],
          fontWeights: [[]],
          validations: [],
        });
        return;
      }

      // Backup all data and formatting
      const range = sheet.getRange(1, 1, lastRow, lastCol);

      backup.sheets.push({
        name: sheet.getName(),
        data: range.getValues(),
        backgrounds: range.getBackgrounds(),
        fontWeights: range.getFontWeights(),
        validations: range.getDataValidations(),
      });

      log.debug(`Backed up sheet: ${sheet.getName()} (${lastRow}x${lastCol})`);
    } catch (error) {
      log.warn(`Failed to backup sheet ${sheet.getName()}`, error);
    }
  });

  log.info(`Spreadsheet backup created (${backup.sheets.length} sheets)`);
  return backup;
}

/**
 * Restores spreadsheet from a backup
 *
 * @param backup - The backup to restore
 * @returns Success status
 *
 * @example
 * const backup = backupSpreadsheet();
 * // ... run tests ...
 * restoreSpreadsheet(backup);
 */
function restoreSpreadsheet(backup: SpreadsheetBackup): boolean {
  log.info("Restoring spreadsheet from backup...");

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    backup.sheets.forEach((sheetBackup) => {
      let sheet = spreadsheet.getSheetByName(sheetBackup.name);

      // Create sheet if it doesn't exist
      if (!sheet) {
        log.info(`Creating missing sheet: ${sheetBackup.name}`);
        sheet = spreadsheet.insertSheet(sheetBackup.name);
      }

      // Clear existing content
      sheet.clear();

      // Handle empty sheets
      if (
        sheetBackup.data.length === 1 &&
        sheetBackup.data[0].length === 0
      ) {
        log.debug(`Sheet ${sheetBackup.name} was empty, skipping restore`);
        return;
      }

      // Restore data
      const numRows = sheetBackup.data.length;
      const numCols = sheetBackup.data[0].length;

      if (numRows > 0 && numCols > 0) {
        const range = sheet.getRange(1, 1, numRows, numCols);

        // Restore values
        range.setValues(sheetBackup.data);

        // Restore formatting
        if (sheetBackup.backgrounds && sheetBackup.backgrounds.length > 0) {
          range.setBackgrounds(sheetBackup.backgrounds);
        }

        if (sheetBackup.fontWeights && sheetBackup.fontWeights.length > 0) {
          range.setFontWeights(sheetBackup.fontWeights);
        }

        // Restore validations
        if (sheetBackup.validations && sheetBackup.validations.length > 0) {
          range.setDataValidations(sheetBackup.validations);
        }

        log.debug(`Restored sheet: ${sheetBackup.name} (${numRows}x${numCols})`);
      }
    });

    // Delete sheets that weren't in backup
    const currentSheets = spreadsheet.getSheets();
    const backupSheetNames = backup.sheets.map((s) => s.name);

    currentSheets.forEach((sheet) => {
      if (!backupSheetNames.includes(sheet.getName())) {
        log.info(`Deleting extra sheet: ${sheet.getName()}`);
        spreadsheet.deleteSheet(sheet);
      }
    });

    log.info("Spreadsheet restored successfully");
    return true;
  } catch (error) {
    log.error("Failed to restore spreadsheet", error);
    return false;
  }
}

/**
 * Creates a temporary test spreadsheet
 *
 * @param name - Optional name for the test spreadsheet
 * @returns The created spreadsheet
 *
 * @example
 * const testSheet = createTestSpreadsheet("MyTest");
 * // ... run tests on testSheet ...
 * deleteTestSpreadsheet(testSheet.getId());
 */
function createTestSpreadsheet(name?: string): GoogleAppsScript.Spreadsheet.Spreadsheet {
  const spreadsheetName = name || `Test_${Date.now()}`;
  log.info(`Creating test spreadsheet: ${spreadsheetName}`);

  const spreadsheet = SpreadsheetApp.create(spreadsheetName);
  log.info(`Test spreadsheet created: ${spreadsheet.getId()}`);

  return spreadsheet;
}

/**
 * Deletes a test spreadsheet
 *
 * @param spreadsheetId - ID of the spreadsheet to delete
 * @returns Success status
 */
function deleteTestSpreadsheet(spreadsheetId: string): boolean {
  try {
    log.info(`Deleting test spreadsheet: ${spreadsheetId}`);

    const file = DriveApp.getFileById(spreadsheetId);
    file.setTrashed(true);

    log.info("Test spreadsheet deleted successfully");
    return true;
  } catch (error) {
    log.error(`Failed to delete test spreadsheet ${spreadsheetId}`, error);
    return false;
  }
}

/**
 * Cleans up test artifacts (temp folders, test files)
 *
 * @param olderThanMinutes - Clean artifacts older than this many minutes (default: 60)
 * @returns Cleanup result summary
 *
 * @example
 * const result = cleanupTestArtifacts(30); // Clean artifacts older than 30 minutes
 */
function cleanupTestArtifacts(olderThanMinutes: number = 60): CleanupResult {
  log.info(`Cleaning up test artifacts older than ${olderThanMinutes} minutes...`);

  const result: CleanupResult = {
    success: true,
    itemsCleaned: 0,
    errors: [],
  };

  try {
    // Clean up temp folders (use existing cleanup function)
    const folderCleanup = cleanupOldTempFolders(olderThanMinutes / 60);
    result.itemsCleaned += folderCleanup.foldersDeleted;

    if (folderCleanup.errors.length > 0) {
      result.errors?.push(...folderCleanup.errors);
    }

    // Clean up test spreadsheets
    const cutoffTime = new Date().getTime() - olderThanMinutes * 60 * 1000;
    const files = DriveApp.getFiles();

    while (files.hasNext()) {
      const file = files.next();
      const fileName = file.getName();

      // Match test spreadsheet naming pattern
      if (/^Test_\d+$/.test(fileName)) {
        try {
          const fileAge = file.getLastUpdated().getTime();

          if (fileAge < cutoffTime) {
            file.setTrashed(true);
            result.itemsCleaned++;
            log.debug(`Deleted test spreadsheet: ${fileName}`);
          }
        } catch (fileError) {
          const errorMsg = `Failed to delete test file ${fileName}: ${fileError}`;
          log.warn(errorMsg);
          result.errors?.push(errorMsg);
        }
      }
    }

    log.info(`Cleanup completed: ${result.itemsCleaned} items cleaned`);
  } catch (error) {
    log.error("Error during test artifact cleanup", error);
    result.success = false;
    result.errors?.push(`Fatal error: ${error}`);
  }

  return result;
}

/**
 * Setup function to run before tests
 *
 * Creates backup and prepares test environment
 *
 * @returns Backup object to pass to teardown
 *
 * @example
 * function testMyFeature() {
 *   const backup = testSetup();
 *   try {
 *     // ... run test ...
 *   } finally {
 *     testTeardown(backup);
 *   }
 * }
 */
function testSetup(): SpreadsheetBackup {
  log.info("=== Test Setup ===");

  // Create backup
  const backup = backupSpreadsheet();

  // Clean up any old test artifacts
  cleanupTestArtifacts(60);

  log.info("Test setup complete");
  return backup;
}

/**
 * Teardown function to run after tests
 *
 * Restores backup and cleans up test artifacts
 *
 * @param backup - The backup created during setup
 * @param cleanupDrive - Whether to clean up Drive files (default: true)
 *
 * @example
 * function testMyFeature() {
 *   const backup = testSetup();
 *   try {
 *     // ... run test ...
 *   } finally {
 *     testTeardown(backup);
 *   }
 * }
 */
function testTeardown(
  backup: SpreadsheetBackup,
  cleanupDrive: boolean = true,
): void {
  log.info("=== Test Teardown ===");

  try {
    // Restore spreadsheet state
    const restored = restoreSpreadsheet(backup);

    if (!restored) {
      log.error("Failed to restore spreadsheet - manual intervention may be required");
    }

    // Clean up Drive artifacts if requested
    if (cleanupDrive) {
      const cleanupResult = cleanupTestArtifacts(5); // Clean artifacts from last 5 minutes
      log.info(`Cleaned up ${cleanupResult.itemsCleaned} test artifacts`);

      if (cleanupResult.errors && cleanupResult.errors.length > 0) {
        log.warn(`Cleanup warnings: ${cleanupResult.errors.join(", ")}`);
      }
    }

    log.info("Test teardown complete");
  } catch (error) {
    log.error("Error during test teardown", error);
    throw error; // Re-throw to ensure tests fail if teardown fails
  }
}

/**
 * Runs a test with automatic setup and teardown
 *
 * @param testFn - The test function to run
 * @param testName - Name of the test for logging
 * @returns Test result
 *
 * @example
 * const result = withTestSetup(() => {
 *   // ... test code ...
 *   return { success: true, message: "Test passed" };
 * }, "My Feature Test");
 */
function withTestSetup<T>(testFn: () => T, testName: string): T {
  log.info(`Starting test: ${testName}`);
  const backup = testSetup();

  try {
    const result = testFn();
    log.info(`Test completed: ${testName}`);
    return result;
  } catch (error) {
    log.error(`Test failed: ${testName}`, error);
    throw error;
  } finally {
    testTeardown(backup);
  }
}

/**
 * Asserts that a condition is true
 *
 * @param condition - The condition to check
 * @param message - Error message if assertion fails
 * @throws Error if condition is false
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Asserts that two values are equal
 *
 * @param actual - The actual value
 * @param expected - The expected value
 * @param message - Optional error message
 * @throws Error if values are not equal
 */
function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    const errorMsg =
      message ||
      `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`;
    throw new Error(`Assertion failed: ${errorMsg}`);
  }
}

/**
 * Asserts that a value is truthy
 *
 * @param value - The value to check
 * @param message - Error message if assertion fails
 * @throws Error if value is falsy
 */
function assertTruthy(value: any, message: string): void {
  if (!value) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Asserts that a value is falsy
 *
 * @param value - The value to check
 * @param message - Error message if assertion fails
 * @throws Error if value is truthy
 */
function assertFalsy(value: any, message: string): void {
  if (value) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Asserts that a function throws an error
 *
 * @param fn - The function that should throw
 * @param message - Optional error message
 * @throws Error if function doesn't throw
 */
function assertThrows(fn: () => void, message?: string): void {
  let threw = false;

  try {
    fn();
  } catch (error) {
    threw = true;
  }

  if (!threw) {
    throw new Error(`Assertion failed: ${message || "Expected function to throw"}`);
  }
}
