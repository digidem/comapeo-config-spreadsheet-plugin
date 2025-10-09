/**
 * Categories application functions for the import category functionality.
 * This file contains functions related to applying categories to the spreadsheet.
 */

/**
 * Applies categories (presets) to the Categories sheet.
 * @param sheet - The categories sheet
 * @param presets - Array of preset objects
 * @param fields - Array of field objects
 * @param icons - Array of icon objects
 */
function applyCategories(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  presets: any[],
  fields: any[],
  icons: any[],
) {
  console.log("=== APPLYING CATEGORIES TO SPREADSHEET ===");
  console.log(`Applying ${presets.length} categories with ${icons.length} icons`);

  // Set headers (assuming English as primary language)
  sheet.getRange(1, 1, 1, 3).setValues([["English", "Icons", "Details"]]);
  sheet.getRange(1, 1, 1, 3).setFontWeight("bold");

  // Create a map of icon name to icon URL for quick lookup
  console.log("Building icon map for lookup...");
  const iconMap = {};
  for (const icon of icons) {
    if (icon.name && icon.svg) {
      iconMap[icon.name] = icon.svg;
      console.log(`  - iconMap["${icon.name}"] = ${icon.svg.substring(0, 50)}...`);
    }
  }
  console.log(`Icon map contains ${Object.keys(iconMap).length} entries`);

  // Prepare category rows
  console.log("Matching icons to presets...");
  const categoryRows = presets.map((preset) => {
    // Find matching icon
    const iconUrl = preset.icon ? iconMap[preset.icon] || "" : "";

    if (preset.icon) {
      if (iconUrl) {
        console.log(`  ✓ Matched preset "${preset.name}" (icon: "${preset.icon}") → ${iconUrl.substring(0, 50)}...`);
      } else {
        console.log(`  ✗ No icon found for preset "${preset.name}" (looking for icon: "${preset.icon}")`);
      }
    } else {
      console.log(`  - Preset "${preset.name}" has no icon specified`);
    }

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
        const label = fieldMap[fieldId] || fieldId;
        // Strip commas from the label to avoid issues in the Details column
        return label.replace(/,/g, "");
      });

      fieldsList = fieldLabels.join(", ");
    }

    return [preset.name, iconUrl, fieldsList];
  });

  // Add category rows
  if (categoryRows.length > 0) {
    sheet.getRange(2, 1, categoryRows.length, 3).setValues(categoryRows);

    // Apply background colors based on preset.color
    presets.forEach((preset, index) => {
      if (preset.color && typeof preset.color === "string") {
        // Check if it's a valid hex color (starts with # and has 3 or 6 hex digits)
        const isValidHexColor = /^#([0-9A-F]{3}){1,2}$/i.test(preset.color);
        if (isValidHexColor) {
          // Apply the color to the first cell (category name)
          sheet.getRange(index + 2, 1).setBackground(preset.color);
        }
      }
    });
  }

  // Data validation for the Details column is handled separately
  // to avoid import errors

  // Auto-resize columns for better readability
  sheet.autoResizeColumns(1, 3);
}
