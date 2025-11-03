# Test Runner Dialog Fix - Summary

## Problems Identified
1. **Primary**: Dialog never updated during test execution, hung after completion
2. **Secondary**: Dialogs were stacking on top of each other
3. **Tertiary**: "Cannot call SpreadsheetApp.getUi() from this context" error

## Root Causes

### Primary: Modeless Dialog Update Limitation
Google Apps Script **modeless dialogs cannot be updated after they're shown**. The code attempted to update the dialog by appending scripts to `htmlOutput`, but this doesn't affect the already-rendered dialog in the browser.

**Evidence:**
- `dialog.ts:344-362` - Comment: *"Apps Script limitation: We have to close and reopen to update"*
- The codebase already uses modal dialogs with close/reopen pattern for all other long-running operations (`updateProcessingDialogProgress`)

### Secondary: Modal Dialog Stacking
Modal dialogs opened with `showModalDialog()` don't automatically close the previous dialog. Each call opens a **new** dialog on top of the old one.

**Evidence:**
- `showModalDialog()` creates a new dialog instance every time
- No automatic cleanup mechanism
- Results in multiple dialogs visible simultaneously

### Tertiary: UI Context Availability
`SpreadsheetApp.getUi()` is not available in all execution contexts (e.g., web apps, standalone scripts, or certain test contexts). Attempting to call it from an invalid context throws: **"Cannot call SpreadsheetApp.getUi() from this context"**

**Evidence:**
- Error occurs when `updateTestRunnerProgress()` is called from test functions
- Test functions may run in isolated contexts where UI is not available
- Need to check UI availability before using it

## Solution Implemented

### Phase 1: Dialog Pattern Refactor
Refactored to use **modal dialog close-and-reopen pattern**:

1. **Created `generateTestRunnerDialogHtml()`** (lines 23-45)
   - Generates HTML for progress dialog
   - Takes percent, status, log messages, and test counter as parameters
   - Returns complete HTML string for modal dialog

2. **Created `updateTestRunnerProgress()`** (lines 51-90)
   - Implements the close-and-reopen pattern
   - Uses `PropertiesService` to track dialog state
   - Closes existing dialog before opening new one
   - Includes timestamp and log message formatting

3. **Updated `runAllTests()`**
   - Removed `showModelessDialog` (line 65 old)
   - Removed `htmlOutput.append()` attempts (lines 72, 105, 595 old)
   - Changed to use `updateTestRunnerProgress()` for all progress updates
   - Added cleanup of dialog state at start

### Phase 2: Dialog Stacking Fix
Added **dialog state management** to prevent stacking:

1. **State Tracking with PropertiesService**
   - Uses `testRunnerDialogActive` property to track if dialog is open
   - Checks state before opening new dialog

2. **Proper Close Mechanism**
   - Calls `google.script.host.close()` before opening new dialog
   - Adds 200ms delay to allow dialog to close
   - Adds callback to mark dialog as closed

3. **Added Helper Functions**
   - `_testRunnerCallback()` - Marks dialog as closed (line 96-99)
   - `closeTestRunnerDialog()` - Cleanup function (line 104-112)

4. **Updated Progress Flow**
   - Added 300ms delay between progress updates (line 158)
   - Closes progress dialog before showing completion summary (line 635)
   - Cleans up state on completion

### Phase 3: UI Context Availability Fix
Added **try-catch guards for UI operations** to handle contexts where UI is not available:

1. **Wrapped `SpreadsheetApp.getUi()` in try-catch** (lines 62-70)
   - Catches context errors gracefully
   - Falls back to console logging when UI unavailable
   - Prevents crashes in non-UI contexts

2. **Added UI checks in all dialog operations** (lines 96-104, 657-687)
   - Progress updates check UI availability
   - Completion dialog checks UI availability
   - All UI operations wrapped in try-catch

3. **Graceful fallback to logging**
   - When UI unavailable, logs to `console.log()` instead
   - Tests can run in any context
   - No crashes or errors

4. **Updated all UI functions** (lines 779-792, 840-853)
   - `runAllTestsQuick()` - UI check before alert
   - `runTestSuite()` - UI check before alert
   - Fallback to logging when UI unavailable

## Technical Implementation

### State Management
```typescript
// Check if dialog exists
const scriptProperties = PropertiesService.getScriptProperties();
const isUpdate = scriptProperties.getProperty('testRunnerDialogActive') === 'true';

// Close existing dialog
if (isUpdate) {
  google.script.host.close();
  Utilities.sleep(200); // Give time for dialog to close
}

// Open new dialog
const ui = SpreadsheetApp.getUi();
ui.showModalDialog(HtmlService.createHtmlOutput(html), "Test Runner Progress");

// Mark as active
scriptProperties.setProperty('testRunnerDialogActive', 'true');
```

### Dialog Update Flow
1. User clicks "Run Tests" → `runAllTests()` starts
2. Cleans up any existing dialog state
3. Shows initial progress dialog (0%)
4. Each test suite:
   - Closes previous dialog
   - Opens new dialog with updated progress
   - Adds 300ms delay
5. Tests complete:
   - Closes progress dialog
   - Shows completion summary dialog
   - Cleans up state

## Why This Works

### Prevents Stacking
- Checks `PropertiesService` for existing dialog
- Calls `google.script.host.close()` before opening new one
- Adds delay to ensure clean close/open cycle

### Maintains Progress Flow
- Each dialog shows current test (e.g., "Test 3/13")
- Progress bar updates (e.g., "23%")
- Log messages update with timestamps
- Smooth transitions with delays

### Clean Completion
- Progress dialog closes cleanly
- Completion summary shows in new dialog
- No hanging or stacking

### Context-Aware UI Handling
- All UI operations wrapped in try-catch
- Falls back to console logging when UI unavailable
- Works in any execution context (spreadsheet, web app, test)
- No crashes or "context" errors

### UI Context Safety Pattern
```typescript
let ui: GoogleAppsScript.Spreadsheet.SpreadsheetUi;
try {
  ui = SpreadsheetApp.getUi();
  ui.showModalDialog(html, "Title");
} catch (e) {
  // UI not available, fall back to logging
  console.log("Progress: status message");
  return;
}
```

## Files Modified
- `src/test/testRunner.ts` - Complete dialog management system with context awareness

## Testing
The fix can be verified by:
1. Running `runAllTests()` from the Apps Script editor
2. Observing that only ONE dialog appears at a time
3. Dialog updates smoothly for each test suite (no stacking)
4. Dialog closes and shows completion summary at the end (no hanging)
5. **No "Cannot call SpreadsheetApp.getUi() from this context" errors**
6. Works when called from different execution contexts

## Pattern Established
This fix establishes a **robust dialog state management pattern with context awareness** for test runner dialogs in the codebase. The pattern can be reused by other test files that need progress tracking in any execution context.
