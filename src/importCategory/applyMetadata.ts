/**
 * Metadata application functions for the import category functionality.
 * This file contains functions related to applying metadata to the spreadsheet.
 */

/**
 * Applies metadata to the Metadata sheet.
 * @param sheet - The metadata sheet
 * @param metadata - Metadata object
 */
function applyMetadata(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  metadata: any,
) {
  // Set headers
  sheet.getRange(1, 1, 1, 2).setValues([["Key", "Value"]]);
  sheet.getRange(1, 1, 1, 2).setFontWeight("bold");

  // Add metadata rows
  const metadataRows = Object.entries(metadata).map(([key, value]) => [
    key,
    value,
  ]);
  if (metadataRows.length > 0) {
    sheet.getRange(2, 1, metadataRows.length, 2).setValues(metadataRows);
  }
}
