/**
 * Functions for clearing data validations from sheets.
 * This file contains utility functions to clear data validations from all sheets.
 */

/**
 * Clears all data validations from a specific sheet.
 * @param sheet - The sheet to clear validations from
 */
function clearSheetValidations(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
): void {
  try {
    console.log(`Clearing data validations from sheet: ${sheet.getName()}`);

    // Get the data range
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow > 0 && lastCol > 0) {
      // Clear all data validations from the sheet
      sheet.getDataRange().clearDataValidations();

      // Also try clearing by columns for more thorough cleaning
      for (let col = 1; col <= lastCol; col++) {
        if (lastRow > 1) {
          sheet.getRange(2, col, lastRow - 1, 1).clearDataValidations();
        }
      }
    }

    console.log(
      `Successfully cleared data validations from sheet: ${sheet.getName()}`,
    );
  } catch (error) {
    console.error(
      `Error clearing data validations from sheet ${sheet.getName()}:`,
      error,
    );
  }
}

/**
 * Clears all data validations from all sheets in the spreadsheet.
 */
function clearAllValidations(): void {
  try {
    console.log("Clearing all data validations from all sheets...");

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();

    // Clear validations from each sheet
    sheets.forEach((sheet) => {
      clearSheetValidations(sheet);
    });

    console.log("Successfully cleared all data validations from all sheets");
  } catch (error) {
    console.error("Error clearing all data validations:", error);
  }
}
