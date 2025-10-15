/// <reference path="./loggingHelpers.ts" />
/// <reference path="./types.ts" />

interface GenerationOptions {
  skipDriveWrites?: boolean;
}

function recordTiming(operation: string, startTime: number): void {
  if (typeof AppLogger !== "undefined" && AppLogger && typeof AppLogger.timing === "function") {
    AppLogger.timing(operation, startTime);
    return;
  }
  const duration = new Date().getTime() - startTime;
  console.log(`[TIMING] ${operation} took ${duration}ms`);
}

/**
 * Entry point for the CoMapeo category generation workflow.
 *
 * Displays the language selection dialog and delegates the rest of the
 * pipeline to {@link generateCoMapeoConfigWithSelectedLanguages}.
 */
function generateCoMapeoConfig(): void {
  // First, show the translation language selection dialog
  showSelectTranslationLanguagesDialog();
}

/**
 * Continues the generation pipeline without running translations.
 */
function generateCoMapeoConfigSkipTranslation(): void {
  const log = getScopedLogger("ConfigGeneration");
  log.info("User chose to skip translation");
  log.debug("Passing empty array to generateCoMapeoConfigWithSelectedLanguages()");
  generateCoMapeoConfigWithSelectedLanguages([]);
}

function generateCoMapeoConfigInMemory(): void {
  const log = getScopedLogger("ConfigGeneration");
  log.info("Running CoMapeo generation in in-memory mode (Drive writes skipped)");
  generateCoMapeoConfigWithSelectedLanguages([], { skipDriveWrites: true });
}

/**
 * Runs the full CoMapeo configuration pipeline after the user selects
 * languages to translate to.
 *
 * @param selectedLanguages - ISO codes of translation languages chosen by the user.
 */
function generateCoMapeoConfigWithSelectedLanguages(
  selectedLanguages: TranslationLanguage[],
  options?: GenerationOptions,
): void {
  const log = getScopedLogger("ConfigGeneration");
  const generationOptions = options || {};
  const skipDriveWrites = Boolean(generationOptions.skipDriveWrites);
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
    const lintStart = Date.now();
    lintAllSheets(false); // Pass false to prevent UI alerts
    recordTiming("lintAllSheets", lintStart);
    log.info("Linting completed");

    // Step 2: Auto translate (conditional - only if languages selected)
    if (selectedLanguages.length > 0) {
      showProcessingModalDialog(processingDialogTexts[1][locale]);
      log.info("Starting translation process...", { languages: selectedLanguages });
      const translationStart = Date.now();
      autoTranslateSheetsBidirectional(selectedLanguages);
      recordTiming("autoTranslateSheetsBidirectional", translationStart);
      log.info("Translation process completed");
    } else {
      log.info("SKIPPING TRANSLATION - No languages selected");
    }

    // Read spreadsheet data AFTER translation to include any new columns
    log.info("Reading spreadsheet data (after translation)...");
    const readDataStart = Date.now();
    const data = getSpreadsheetData();
    recordTiming("getSpreadsheetData", readDataStart);
    log.info("Spreadsheet data retrieved");

    // Step 3: Process data
    showProcessingModalDialog(processingDialogTexts[2][locale]);
    log.info("Step 3: Processing data for CoMapeo...");
    const config = processDataForCoMapeo(data);
    log.info("Data processing completed");

    // Step 4: Save to Drive (with progress updates)
    showProcessingModalDialog(processingDialogTexts[3][locale]);
    log.info(`Step 4: ${skipDriveWrites ? "Staging config in memory (Drive writes disabled)" : "Saving config to Drive"}...`);
    const saveDriveStart = Date.now();
    const { id, zipBlobs } = saveConfigToDrive(
      config,
      updateProcessingDialogProgress,
      { skipDriveWrites },
    );
    recordTiming("saveConfigToDrive", saveDriveStart);
    createdFolderId = skipDriveWrites ? null : id; // Track folder ID for cleanup
    if (skipDriveWrites) {
      log.info("Config staged in memory; Drive writes skipped");
    } else {
      log.info("Saved to Drive", { folderId: id });
    }

    // Step 5: Create package (with progress updates)
    showProcessingModalDialog(processingDialogTexts[4][locale]);
    log.info(`Step 5: Creating ZIP package${skipDriveWrites ? " (in-memory)" : ""}...`);
    const zipStart = Date.now();
    let folderZip: GoogleAppsScript.Base.Blob;
    if (skipDriveWrites) {
      updateProcessingDialogProgress?.(
        "Creating package... (5/8)",
        "Compressing staged files in memory...",
      );
      folderZip = Utilities.zip(
        (zipBlobs || []).map((blob) => blob.copyBlob()),
        `${slugify(config.metadata.version)}.zip`,
      );
      recordTiming("createInMemoryZip", zipStart);
      log.info("ZIP package created in memory");
    } else {
      folderZip = saveDriveFolderToZip(id, updateProcessingDialogProgress, zipBlobs);
      recordTiming("saveDriveFolderToZip", zipStart);
      log.info("ZIP package created");
    }

    // Step 6: Upload to API
    showProcessingModalDialog(processingDialogTexts[5][locale]);
    log.info("Step 6: Uploading to API server...");

    // Step 7: API Processing (with progress callback)
    showProcessingModalDialog(processingDialogTexts[6][locale]);
    log.info("Step 7: Waiting for API processing...");
    const apiStart = Date.now();
    const configUrl = sendDataToApiAndGetZip(folderZip, config.metadata, 3, updateProcessingDialogProgress);
    recordTiming("sendDataToApiAndGetZip", apiStart);
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
 * Transforms spreadsheet data into a fully validated CoMapeo configuration.
 *
 * @param data - Raw sheet matrices captured from the active spreadsheet.
 * @returns CoMapeo configuration ready for Drive export and packaging.
 * @throws Error when sheet validation or schema validation fails.
 */
function processDataForCoMapeo(data: SheetData): CoMapeoConfig {
  const log = getScopedLogger("ConfigGeneration");
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
  const presets = processPresets(data, categoriesSheet, fields);
  log.info(`Done processing ${presets.length} presets`);
  log.info("Processing icons...");
  const icons = processIcons();
  log.info(`Done processing ${icons.length} icons`);
  log.info("Processing metadata...");
  const { metadata, packageJson } = processMetadata(data);
  log.info("Processing translations...");
  const messages = processTranslations(data, fields, presets);
  log.info("Generating CoMapeo config...");

  const configForValidation: CoMapeoConfig = {
    metadata,
    packageJson,
    fields,
    presets,
    icons,
    messages,
    translations: messages,
  };

  // Validate the final config schema
  log.info("Validating configuration schema...");
  const configValidation = validateConfigSchema(configForValidation);
  if (!configValidation.valid) {
    throw new Error(configValidation.error);
  }
  log.info("Configuration schema validation passed");

  if (typeof AppLogger !== 'undefined') {
    AppLogger.timing("processDataForCoMapeo", startTime);
  }

  // Return with original property name while keeping translations for validators
  return configForValidation;
}
