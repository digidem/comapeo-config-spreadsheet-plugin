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
 * Clears data validations only from sheets managed by the importer.
 */
function clearManagedSheetValidations(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
): void {
  try {
    const managedSheets = [
      "Categories",
      "Details",
      "Metadata",
      "Category Translations",
      "Detail Label Translations",
      "Detail Helper Text Translations",
      "Detail Option Translations",
    ];

    managedSheets.forEach((name) => {
      const sheet = spreadsheet.getSheetByName(name);
      if (sheet) {
        clearSheetValidations(sheet);
      }
    });
  } catch (error) {
    console.error("Error clearing managed sheet validations:", error);
  }
}
