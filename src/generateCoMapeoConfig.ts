// Lazy logger initialization to avoid compilation order issues
function getLog() {
  if (typeof AppLogger !== 'undefined') {
    return AppLogger.scope("ConfigGeneration");
  }
  // Fallback logger with all expected methods
  return {
    debug: (...args: any[]) => console.log('[DEBUG]', ...args),
    info: (...args: any[]) => console.log('[INFO]', ...args),
    warn: (...args: any[]) => console.log('[WARN]', ...args),
    error: (...args: any[]) => console.log('[ERROR]', ...args),
  };
}

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
  const log = getLog();
  log.info("User chose to skip translation");
  log.debug("Passing empty array to generateCoMapeoConfigWithSelectedLanguages()");
  generateCoMapeoConfigWithSelectedLanguages([]);
}

/**
 * Called after user selects translation languages.
 * Continues the CoMapeo config generation process.
 */
function generateCoMapeoConfigWithSelectedLanguages(selectedLanguages: TranslationLanguage[]) {
  const log = getLog();
  let createdFolderId: string | null = null;

  try {
    // Pre-flight validation checks
    log.info("===== Starting CoMapeo Config Generation =====");
    log.info("Running pre-flight validation checks...");

    const preflightResults = runPreflightChecks();

    if (!preflightResults.allPassed) {
      log.warn("Pre-flight checks failed");
      const shouldContinue = showPreflightResults(preflightResults);

      if (!shouldContinue) {
        log.info("User cancelled due to pre-flight check failures");
        return;
      }

      log.warn("User chose to continue despite pre-flight failures");
    } else {
      log.info("All pre-flight checks passed");
    }

    // Step 1: Initialize (merges validation and linting)
    showProcessingModalDialog(processingDialogTexts[0][locale]);
    log.info("Step 1: Initializing...");
    log.debug("Selected languages:", selectedLanguages);
    log.debug("Language count:", selectedLanguages.length);

    // Lint spreadsheet
    log.info("Linting sheets...");
    lintAllSheets(false); // Pass false to prevent UI alerts
    log.info("Linting completed");

    // Step 2: Auto translate (conditional - only if languages selected)
    if (selectedLanguages.length > 0) {
      showProcessingModalDialog(processingDialogTexts[1][locale]);
      log.info("Starting translation process...", { languages: selectedLanguages });
      autoTranslateSheetsBidirectional(selectedLanguages);
      log.info("Translation process completed");
    } else {
      log.info("SKIPPING TRANSLATION - No languages selected");
    }

    // Read spreadsheet data AFTER translation to include any new columns
    log.info("Reading spreadsheet data (after translation)...");
    const data = getSpreadsheetData();
    log.info("Spreadsheet data retrieved");

    // Step 3: Process data
    showProcessingModalDialog(processingDialogTexts[2][locale]);
    log.info("Step 3: Processing data for CoMapeo...");
    const config = processDataForCoMapeo(data);
    log.info("Data processing completed");

    // Step 4: Save to Drive (with progress updates)
    showProcessingModalDialog(processingDialogTexts[3][locale]);
    log.info("Step 4: Saving config to Drive...");
    const { id } = saveConfigToDrive(config, updateProcessingDialogProgress);
    createdFolderId = id; // Track folder ID for cleanup
    log.info("Saved to Drive", { folderId: id });

    // Step 5: Create package (with progress updates)
    showProcessingModalDialog(processingDialogTexts[4][locale]);
    log.info("Step 5: Creating ZIP package...");
    const folderZip = saveDriveFolderToZip(id, updateProcessingDialogProgress);
    log.info("ZIP package created");

    // Step 6: Upload to API
    showProcessingModalDialog(processingDialogTexts[5][locale]);
    log.info("Step 6: Uploading to API server...");

    // Step 7: API Processing (with progress callback)
    showProcessingModalDialog(processingDialogTexts[6][locale]);
    log.info("Step 7: Waiting for API processing...");
    const configUrl = sendDataToApiAndGetZip(folderZip, config.metadata, 3, updateProcessingDialogProgress);
    log.info("API processing completed", { url: configUrl });

    // Step 8: Complete
    showProcessingModalDialog(processingDialogTexts[7][locale]);
    log.info("Step 8: Finalizing...");
    showConfigurationGeneratedDialog(configUrl);
    log.info("===== CoMapeo Config Generation Complete =====");
  } catch (error) {
    // Handle any errors that weren't caught by specific functions
    log.error("Error generating CoMapeo config", error);

    // CLEANUP: Delete created Drive folder if pipeline failed
    if (createdFolderId) {
      log.warn("Pipeline failed, initiating cleanup...");
      cleanupDriveFolder(createdFolderId);
    }

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
  const log = getLog();
  const startTime = Date.now();
  log.info("Processing CoMapeo data...");

  // Validate sheet data before processing
  log.info("Validating sheet data...");
  const sheetValidation = validateSheetData(data);
  if (!sheetValidation.valid) {
    throw new Error(sheetValidation.error);
  }
  if (sheetValidation.warnings && sheetValidation.warnings.length > 0) {
    log.warn(`Sheet validation warnings:\n${sheetValidation.warnings.join("\n")}`);
  }
  log.info("Sheet data validation passed");

  // Get spreadsheet reference once and reuse
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheet = spreadsheet.getSheetByName("Categories");

  const fields = processFields(data);
  log.info(`Done processing ${fields.length} fields`);
  log.info("Processing presets...");
  const presets = processPresets(data, categoriesSheet);
  log.info(`Done processing ${presets.length} presets`);
  log.info("Processing icons...");
  const icons = processIcons();
  log.info(`Done processing ${icons.length} icons`);
  log.info("Processing metadata...");
  const { metadata, packageJson } = processMetadata(data);
  log.info("Processing translations...");
  const messages = processTranslations(data, fields, presets);
  log.info("Generating CoMapeo config...");

  const config = {
    metadata,
    packageJson,
    fields,
    presets,
    icons,
    translations: messages, // Renamed to match validation schema
  };

  // Validate the final config schema
  log.info("Validating configuration schema...");
  const configValidation = validateConfigSchema(config);
  if (!configValidation.valid) {
    throw new Error(configValidation.error);
  }
  log.info("Configuration schema validation passed");

  if (typeof AppLogger !== 'undefined') {
    AppLogger.timing("processDataForCoMapeo", startTime);
  }

  // Return with original property name for backward compatibility
  return {
    metadata,
    packageJson,
    fields,
    presets,
    icons,
    messages,
  };
}
