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
    // Pre-flight validation checks
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

    // Step 1: Initialize (merges validation and linting)
    showProcessingModalDialog(processingDialogTexts[0][locale]);
    console.log("[PIPELINE] Step 1: Initializing...");
    console.log("[PIPELINE] Selected languages:", selectedLanguages);
    console.log("[PIPELINE] Language count:", selectedLanguages.length);

    // Lint spreadsheet
    console.log("[PIPELINE] Linting sheets...");
    lintAllSheets(false); // Pass false to prevent UI alerts
    console.log("[PIPELINE] ✅ Linting completed");

    // Step 2: Auto translate (conditional - only if languages selected)
    if (selectedLanguages.length > 0) {
      showProcessingModalDialog(processingDialogTexts[1][locale]);
      console.log("[TRANSLATION] 🌍 Starting translation process...");
      console.log("[TRANSLATION] Target languages:", selectedLanguages.join(', '));
      autoTranslateSheetsBidirectional(selectedLanguages);
      console.log("[TRANSLATION] ✅ Translation process completed");
    } else {
      console.log("[TRANSLATION] ⏭️  SKIPPING TRANSLATION - No languages selected");
    }

    // Read spreadsheet data AFTER translation to include any new columns
    console.log("[PIPELINE] Reading spreadsheet data (after translation)...");
    const data = getSpreadsheetData();
    console.log("[PIPELINE] ✅ Spreadsheet data retrieved");

    // Step 3: Process data
    showProcessingModalDialog(processingDialogTexts[2][locale]);
    console.log("[PIPELINE] Step 3: Processing data for CoMapeo...");
    const config = processDataForCoMapeo(data);
    console.log("[PIPELINE] ✅ Data processing completed");

    // Step 4: Save to Drive (with progress updates)
    showProcessingModalDialog(processingDialogTexts[3][locale]);
    console.log("[PIPELINE] Step 4: Saving config to Drive...");
    const { id } = saveConfigToDrive(config, updateProcessingDialogProgress);
    console.log("[PIPELINE] ✅ Saved to Drive. Folder ID:", id);

    // Step 5: Create package (with progress updates)
    showProcessingModalDialog(processingDialogTexts[4][locale]);
    console.log("[PIPELINE] Step 5: Creating ZIP package...");
    const folderZip = saveDriveFolderToZip(id, updateProcessingDialogProgress);
    console.log("[PIPELINE] ✅ ZIP package created");

    // Step 6: Upload to API
    showProcessingModalDialog(processingDialogTexts[5][locale]);
    console.log("[PIPELINE] Step 6: Uploading to API server...");

    // Step 7: API Processing (with progress callback)
    showProcessingModalDialog(processingDialogTexts[6][locale]);
    console.log("[PIPELINE] Step 7: Waiting for API processing...");
    const configUrl = sendDataToApiAndGetZip(folderZip, config.metadata, 3, updateProcessingDialogProgress);
    console.log("[PIPELINE] ✅ API processing completed. URL:", configUrl);

    // Step 8: Complete
    showProcessingModalDialog(processingDialogTexts[7][locale]);
    console.log("[PIPELINE] Step 8: Finalizing...");
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
