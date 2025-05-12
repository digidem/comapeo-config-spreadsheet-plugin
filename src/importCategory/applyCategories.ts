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
  icons: any[],
) {
  console.log("Presets", presets);
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
    let iconUrl = preset.icon ? iconMap[preset.icon] || "" : "";

    // Get fields as comma-separated string
    const fields = preset.fields ? preset.fields.join(", ") : "";

    return [preset.name, iconUrl, fields];
  });

  // Add category rows
  if (categoryRows.length > 0) {
    sheet.getRange(2, 1, categoryRows.length, 3).setValues(categoryRows);
  }

  // Auto-resize columns for better readability
  sheet.autoResizeColumns(1, 3);
}
