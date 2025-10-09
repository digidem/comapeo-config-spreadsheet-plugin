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
 * @param onProgress - Optional progress callback function
 */
function applyConfigurationToSpreadsheet(
  configData: any,
  onProgress?: (update: { percent: number; stage: string; detail?: string }) => void,
) {
  console.log("Applying configuration to spreadsheet...");

  if (onProgress) {
    onProgress({
      percent: 70,
      stage: "Updating spreadsheet",
      detail: "Preparing sheets...",
    });
  }

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
    if (onProgress) {
      onProgress({
        percent: 75,
        stage: "Updating spreadsheet",
        detail: "Applying metadata...",
      });
    }
    applyMetadata(metadataSheet, configData.metadata);
  }
  console.log(configData);
  // Apply categories (presets)
  if (configData.presets && configData.presets.length > 0) {
    if (onProgress) {
      onProgress({
        percent: 80,
        stage: "Updating spreadsheet",
        detail: "Applying categories...",
      });
    }
    applyCategories(
      categoriesSheet,
      configData.presets,
      configData.fields,
      configData.icons,
    );
  }

  // Apply details (fields)
  if (configData.fields && configData.fields.length > 0) {
    if (onProgress) {
      onProgress({
        percent: 85,
        stage: "Updating spreadsheet",
        detail: "Applying field definitions...",
      });
    }
    applyFields(detailsSheet, configData.fields);
  }

  // Apply translations
  if (configData.messages && Object.keys(configData.messages).length > 0) {
    if (onProgress) {
      onProgress({
        percent: 90,
        stage: "Updating spreadsheet",
        detail: "Applying translations...",
      });
    }
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
