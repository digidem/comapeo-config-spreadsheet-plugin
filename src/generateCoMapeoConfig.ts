/**
 * Generates a CoMapeo configuration file from the spreadsheet data.
 * Shows progress dialogs and handles errors appropriately.
 */
function generateCoMapeoConfig() {
  // First, show the translation language selection dialog
  showSelectTranslationLanguagesDialog();
}

/**
 * Called when user chooses to skip translation.
 * Continues the CoMapeo config generation process without translation.
 */
function generateCoMapeoConfigSkipTranslation() {
  console.log("[SERVER] ===== generateCoMapeoConfigSkipTranslation CALLED =====");
  console.log("[SERVER] User chose to skip translation");
  console.log("[SERVER] Passing empty array to generateCoMapeoConfigWithSelectedLanguages()");
  generateCoMapeoConfigWithSelectedLanguages([]);
}

/**
 * Called after user selects translation languages.
 * Continues the CoMapeo config generation process.
 */
function generateCoMapeoConfigWithSelectedLanguages(selectedLanguages: TranslationLanguage[]) {
  try {
    // Step 0: Pre-flight validation checks
    console.log("[PIPELINE] ===== Starting CoMapeo Config Generation =====");
    console.log("[PIPELINE] Running pre-flight validation checks...");

    const preflightResults = runPreflightChecks();

    if (!preflightResults.allPassed) {
      console.warn("[PIPELINE] ⚠️  Pre-flight checks failed");
      const shouldContinue = showPreflightResults(preflightResults);

      if (!shouldContinue) {
        console.log("[PIPELINE] ❌ User cancelled due to pre-flight check failures");
        return;
      }

      console.log("[PIPELINE] ⚠️  User chose to continue despite pre-flight failures");
    } else {
      console.log("[PIPELINE] ✅ All pre-flight checks passed");
    }

    // Step 1: Initialize
    showProcessingModalDialog(processingDialogTexts[0][locale]);
    console.log("[PIPELINE] Selected languages:", selectedLanguages);
    console.log("[PIPELINE] Language count:", selectedLanguages.length);

    // Step 2: Auto translate with selected languages (skip if no languages selected)
    if (selectedLanguages.length > 0) {
      showProcessingModalDialog(processingDialogTexts[1][locale]);
      console.log("[TRANSLATION] 🌍 Starting translation process...");
      console.log("[TRANSLATION] Target languages:", selectedLanguages.join(', '));
      autoTranslateSheetsBidirectional(selectedLanguages);
      console.log("[TRANSLATION] ✅ Translation process completed");
    } else {
      console.log("[TRANSLATION] ⏭️  SKIPPING TRANSLATION - No languages selected");
      console.log("[TRANSLATION] Proceeding with config generation without translation");
    }

    // Step 3: Lint (passing false to prevent UI alerts)
    console.log("[PIPELINE] Step 3: Linting sheets...");
    showProcessingModalDialog(processingDialogTexts[2][locale]);
    lintAllSheets(false); // Pass false to prevent UI alerts when called from generateCoMapeoConfig
    console.log("[PIPELINE] ✅ Linting completed");

    // Step 4: Get data
    console.log("[PIPELINE] Step 4: Reading spreadsheet data...");
    const data = getSpreadsheetData();
    showProcessingModalDialog(processingDialogTexts[3][locale]);
    console.log("[PIPELINE] ✅ Spreadsheet data retrieved");

    // Step 5: Process data
    console.log("[PIPELINE] Step 5: Processing data for CoMapeo...");
    const config = processDataForCoMapeo(data);
    showProcessingModalDialog(processingDialogTexts[4][locale]);
    console.log("[PIPELINE] ✅ Data processing completed");

    // Step 6: Save to Drive (create folder structure)
    console.log("[PIPELINE] Step 6: Saving config to Drive...");
    showProcessingModalDialog(processingDialogTexts[5][locale]);
    const { id } = saveConfigToDrive(config);
    console.log("[PIPELINE] ✅ Saved to Drive. Folder ID:", id);

    // Step 7: Writing configuration files to Drive
    console.log("[PIPELINE] Step 7: Writing configuration files to Drive...");
    showProcessingModalDialog(processingDialogTexts[6][locale]);
    // This step is included in saveConfigToDrive, but we show it separately for clarity
    console.log("[PIPELINE] ✅ Configuration files written");

    // Step 8: Collecting files from Drive folder
    console.log("[PIPELINE] Step 8: Collecting files from Drive folder...");
    showProcessingModalDialog(processingDialogTexts[7][locale]);
    console.log("[PIPELINE] ✅ Files collected");

    // Step 9: Creating ZIP archive
    console.log("[PIPELINE] Step 9: Creating ZIP archive...");
    showProcessingModalDialog(processingDialogTexts[8][locale]);
    const folderZip = saveDriveFolderToZip(id);
    console.log("[PIPELINE] ✅ ZIP archive created");

    // Step 10: Uploading to API server
    console.log("[PIPELINE] Step 10: Uploading to API server...");
    showProcessingModalDialog(processingDialogTexts[9][locale]);
    console.log("[PIPELINE] ✅ Upload initiated");

    // Step 11: Waiting for API processing
    console.log("[PIPELINE] Step 11: Waiting for API processing...");
    showProcessingModalDialog(processingDialogTexts[10][locale]);
    // This function has its own retry and error handling
    const configUrl = sendDataToApiAndGetZip(folderZip, config.metadata);
    console.log("[PIPELINE] ✅ API processing completed. URL:", configUrl);

    // Step 12: Saving final package to Drive
    console.log("[PIPELINE] Step 12: Saving final package to Drive...");
    showProcessingModalDialog(processingDialogTexts[11][locale]);
    console.log("[PIPELINE] ✅ Final package saved");

    // Step 13: Finalizing and preparing download
    console.log("[PIPELINE] Step 13: Finalizing and preparing download...");
    showProcessingModalDialog(processingDialogTexts[12][locale]);
    showConfigurationGeneratedDialog(configUrl);
    console.log("[PIPELINE] ===== CoMapeo Config Generation Complete =====");
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
