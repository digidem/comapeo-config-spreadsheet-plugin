/**
 * Generates a CoMapeo configuration file from the spreadsheet data.
 * Shows progress dialogs and handles errors appropriately.
 */
function generateCoMapeoConfig() {
  // First, show the translation language selection dialog
  showSelectTranslationLanguagesDialog();
}

/**
 * Called after user selects translation languages.
 * Continues the CoMapeo config generation process.
 */
function generateCoMapeoConfigWithSelectedLanguages(selectedLanguages: TranslationLanguage[]) {
  try {
    // Step 1: Initialize
    showProcessingModalDialog(processingDialogTexts[0][locale]);
    console.log("Generating CoMapeo config...");

    // Step 2: Auto translate with selected languages
    showProcessingModalDialog(processingDialogTexts[1][locale]);
    console.log("Auto translating to selected languages...");
    autoTranslateSheetsBidirectional(selectedLanguages);

    // Step 3: Lint (passing false to prevent UI alerts)
    console.log("Linting CoMapeo config...");
    showProcessingModalDialog(processingDialogTexts[2][locale]);
    lintAllSheets(false); // Pass false to prevent UI alerts when called from generateCoMapeoConfig

    // Step 4: Get data
    const data = getSpreadsheetData();
    showProcessingModalDialog(processingDialogTexts[3][locale]);

    // Step 5: Process data
    const config = processDataForCoMapeo(data);
    showProcessingModalDialog(processingDialogTexts[4][locale]);

    // Step 6: Save to Drive
    const { id } = saveConfigToDrive(config);
    showProcessingModalDialog(processingDialogTexts[5][locale]);
    console.log("Zipping folder ID: " + id);

    // Step 7: Create zip
    showProcessingModalDialog(processingDialogTexts[6][locale]);
    const folderZip = saveDriveFolderToZip(id);

    // Step 8: Send to API and get result
    // This function has its own retry and error handling
    const configUrl = sendDataToApiAndGetZip(folderZip, config.metadata);

    // Step 9: Show success dialog
    showProcessingModalDialog(processingDialogTexts[7][locale]);
    showConfigurationGeneratedDialog(configUrl);
  } catch (error) {
    // Handle any errors that weren't caught by specific functions
    console.error("Error generating CoMapeo config:", error);

    // Show error dialog to user
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      "Error Generating CoMapeo Category",
      "An error occurred while generating the CoMapeo category: " +
        error.message +
        "\n\nPlease try again. If the problem persists, contact support.",
      ui.ButtonSet.OK,
    );
  }
}

/**
 * Process all the data from the spreadsheet into a CoMapeo configuration object.
 * @param {Object} data - The data from the spreadsheet, including fields, presets, icons, metadata, and translations.
 * @returns {Object} An object with the following properties:
 *   - metadata: The metadata for the CoMapeo configuration, including the dataset ID, name, and version.
 *   - packageJson: The package.json for the CoMapeo configuration, including the dependencies and version.
 *   - fields: An array of CoMapeoField objects, each representing a field in the CoMapeo configuration.
 *   - presets: An array of CoMapeoPreset objects, each representing a preset in the CoMapeo configuration.
 *   - icons: An array of CoMapeoIcon objects, each representing an icon in the CoMapeo configuration.
 *   - messages: An object with two properties, pt and es, each containing an object with translation messages for the corresponding language.
 */
function processDataForCoMapeo(data) {
  console.log("Processing CoMapeo data...");
  const fields = processFields(data);
  console.log(`Done processing ${fields.length} fields`);
  console.log("Processing presets...");
  const presets = processPresets(data);
  console.log(`Done processing ${presets.length} presets`);
  console.log("Processing icons...");
  const icons = processIcons();
  console.log(`Done processing ${icons.length} icons`);
  console.log("Processing metadata...");
  const { metadata, packageJson } = processMetadata(data);
  console.log("Processing translations...");
  const messages = processTranslations(data, fields, presets);
  console.log("Generating CoMapeo config...");
  return {
    metadata,
    packageJson,
    fields,
    presets,
    icons,
    messages,
  };
}
