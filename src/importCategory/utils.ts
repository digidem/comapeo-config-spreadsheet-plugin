/**
 * Utility functions for the import category functionality.
 * This file contains general utility functions used across the import process.
 */

/**
 * Converts a string to a slug format.
 * @param input The input string to be converted.
 * @returns The slugified string.
 */
function slugify(input: any): string {
  if (!input) return "";

  const str = typeof input === "string" ? input : String(input);
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Creates or clears a sheet in the spreadsheet.
 * @param spreadsheet - The active spreadsheet
 * @param sheetName - Name of the sheet to create or clear
 * @returns The sheet object
 */
function createOrClearSheet(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  sheetName: string,
): GoogleAppsScript.Spreadsheet.Sheet {
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    // Create the sheet if it doesn't exist
    sheet = spreadsheet.insertSheet(sheetName);
  } else {
    // Clear the sheet if it exists
    sheet.clear();
  }

  return sheet;
}
