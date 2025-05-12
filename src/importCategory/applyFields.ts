/**
 * Fields application functions for the import category functionality.
 * This file contains functions related to applying fields to the spreadsheet.
 */

/**
 * Applies fields (details) to the Details sheet.
 * @param sheet - The details sheet
 * @param fields - Array of field objects
 */
function applyFields(sheet: GoogleAppsScript.Spreadsheet.Sheet, fields: any[]) {
  console.log(`Applying ${fields.length} fields to Details sheet`);

  // Set headers
  sheet
    .getRange(1, 1, 1, 4)
    .setValues([["Label", "Helper Text", "Type", "Options"]]);
  sheet.getRange(1, 1, 1, 4).setFontWeight("bold");

  // Prepare field rows
  const fieldRows = fields.map((field) => {
    // Convert field type to spreadsheet format
    let typeStr = "text";
    if (field.type === "selectOne" || field.type === "select")
      typeStr = "select";
    if (field.type === "selectMultiple" || field.type === "multiple")
      typeStr = "multiple";
    if (field.type === "number") typeStr = "number";

    // Convert options to comma-separated string
    let optionsStr = "";
    if (field.options && field.options.length > 0) {
      optionsStr = field.options
        .map((opt: any) => opt.label || opt.value)
        .join(", ");
    }

    return [field.label, field.helperText || "", typeStr, optionsStr];
  });

  // Add field rows
  if (fieldRows.length > 0) {
    sheet.getRange(2, 1, fieldRows.length, 4).setValues(fieldRows);
  }

  // Auto-resize columns for better readability
  sheet.autoResizeColumns(1, 4);
}
