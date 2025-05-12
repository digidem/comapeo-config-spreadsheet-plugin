/**
 * Configuration application functions for the import category functionality.
 * This file contains functions related to applying the configuration to the spreadsheet.
 *
 * Uses the createOrClearSheet function from utils.ts
 * Calls applyMetadata, applyCategories, applyFields, and applyTranslations functions
 */

/**
 * Applies configuration data to the spreadsheet.
 * @param configData - Configuration data object
 */
function applyConfigurationToSpreadsheet(configData: any) {
  console.log("Applying configuration to spreadsheet...");

  // First, clear all data validations from all sheets
  try {
    // Only call if the function exists
    if (typeof clearAllValidations === "function") {
      clearAllValidations();
    } else {
      console.log(
        "clearAllValidations function not found, skipping validation clearing",
      );
    }
  } catch (error) {
    console.error("Error clearing all validations:", error);
    // Continue with the import process even if clearing validations fails
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Create or clear necessary sheets
  const categoriesSheet = createOrClearSheet(spreadsheet, "Categories");
  const detailsSheet = createOrClearSheet(spreadsheet, "Details");
  const metadataSheet = createOrClearSheet(spreadsheet, "Metadata");

  // Apply metadata
  if (configData.metadata) {
    applyMetadata(metadataSheet, configData.metadata);
  }
  console.log(configData);
  // Apply categories (presets)
  if (configData.presets && configData.presets.length > 0) {
    applyCategories(
      categoriesSheet,
      configData.presets,
      configData.fields,
      configData.icons,
    );
  }

  // Apply details (fields)
  if (configData.fields && configData.fields.length > 0) {
    applyFields(detailsSheet, configData.fields);
  }

  // Apply translations
  if (configData.messages && Object.keys(configData.messages).length > 0) {
    applyTranslations(
      spreadsheet,
      configData.messages,
      configData.presets,
      configData.fields,
    );
  }

  console.log("Configuration applied to spreadsheet successfully");

  // Add dropdowns after all data has been imported with a delay
  try {
    // Wait a moment to ensure all data is properly set
    Utilities.sleep(1000);

    // Only call if the function exists
    if (typeof addAllDropdowns === "function") {
      addAllDropdowns();
    }
  } catch (error) {
    console.log(
      "Note: Dropdowns not added. This is optional and won't affect the import.",
    );
  }
}
