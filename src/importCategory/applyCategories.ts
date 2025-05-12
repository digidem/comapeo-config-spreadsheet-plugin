/**
 * Categories application functions for the import category functionality.
 * This file contains functions related to applying categories to the spreadsheet.
 */

/**
 * Applies categories (presets) to the Categories sheet.
 * @param sheet - The categories sheet
 * @param presets - Array of preset objects
 * @param icons - Array of icon objects
 */
function applyCategories(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  presets: any[],
  fields: any[],
  icons: any[],
) {
  console.log(
    `Applying ${presets.length} categories with ${icons.length} icons`,
  );

  // Set headers (assuming English as primary language)
  sheet.getRange(1, 1, 1, 3).setValues([["English", "Icons", "Details"]]);
  sheet.getRange(1, 1, 1, 3).setFontWeight("bold");

  // Create a map of icon name to icon URL for quick lookup
  const iconMap = {};
  for (const icon of icons) {
    if (icon.name && icon.svg) {
      iconMap[icon.name] = icon.svg;
    }
  }

  // Prepare category rows
  const categoryRows = presets.map((preset) => {
    // Find matching icon
    const iconUrl = preset.icon ? iconMap[preset.icon] || "" : "";

    // Get fields as comma-separated string with actual Label values
    let fieldsList = "";
    if (
      preset.fields &&
      Array.isArray(preset.fields) &&
      preset.fields.length > 0
    ) {
      // Create a map of field IDs to their labels for quick lookup
      const fieldMap = {};
      for (const field of fields) {
        if (field.id && field.label) {
          fieldMap[field.id] = field.label;
        }
      }

      // Map each field ID to its Label
      const fieldLabels = preset.fields.map((fieldId: string) => {
        // Use the Label from the fieldMap if available, otherwise use the original ID
        return fieldMap[fieldId] || fieldId;
      });

      fieldsList = fieldLabels.join(", ");
    }

    return [preset.name, iconUrl, fieldsList];
  });

  // Add category rows
  if (categoryRows.length > 0) {
    sheet.getRange(2, 1, categoryRows.length, 3).setValues(categoryRows);
  }

  // Data validation for the Details column is handled separately
  // to avoid import errors

  // Auto-resize columns for better readability
  sheet.autoResizeColumns(1, 3);
}
