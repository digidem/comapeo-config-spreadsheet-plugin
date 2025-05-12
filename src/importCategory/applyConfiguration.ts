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
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Create or clear necessary sheets
  const categoriesSheet = createOrClearSheet(spreadsheet, "Categories");
  const detailsSheet = createOrClearSheet(spreadsheet, "Details");
  const metadataSheet = createOrClearSheet(spreadsheet, "Metadata");

  // Apply metadata
  if (configData.metadata) {
    applyMetadata(metadataSheet, configData.metadata);
  }

  // Apply categories (presets)
  if (configData.presets && configData.presets.length > 0) {
    applyCategories(categoriesSheet, configData.presets, configData.icons);
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
}
