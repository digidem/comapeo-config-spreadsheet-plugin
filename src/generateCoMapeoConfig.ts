/// <reference path="./loggingHelpers.ts" />
/// <reference path="./types.ts" />

interface GenerationOptions {
  skipDriveWrites?: boolean;
}

let pendingGenerationOptions: GenerationOptions | null = null;

/**
 * PropertiesService key for storing pending generation options across async calls.
 * Apps Script doesn't preserve global variables across google.script.run callbacks,
 * so we use PropertiesService to persist state.
 */
const PENDING_OPTIONS_KEY = "pendingGenerationOptions";

/**
 * Store generation options in PropertiesService for retrieval in async callbacks.
 * This is necessary because Google Apps Script doesn't preserve global variables
 * across google.script.run execution contexts.
 */
function storePendingOptions(options: GenerationOptions): void {
  const log = getScopedLogger("ConfigGeneration");
  try {
    const optionsJson = JSON.stringify(options);
    PropertiesService.getScriptProperties().setProperty(PENDING_OPTIONS_KEY, optionsJson);
    log.debug("Stored pending options in PropertiesService:", options);
  } catch (error) {
    log.error("Failed to store pending options:", error);
    throw new Error("Failed to persist generation options: " + error.message);
  }
}

/**
 * Retrieve and clear pending generation options from PropertiesService.
 * Returns null if no options are stored.
 */
function retrievePendingOptions(): GenerationOptions | null {
  const log = getScopedLogger("ConfigGeneration");
  try {
    const optionsJson = PropertiesService.getScriptProperties().getProperty(PENDING_OPTIONS_KEY);
    if (!optionsJson) {
      log.debug("No pending options found in PropertiesService");
      return null;
    }

    const options = JSON.parse(optionsJson) as GenerationOptions;
    log.debug("Retrieved pending options from PropertiesService:", options);

    // Clear immediately after retrieval to prevent reuse
    clearPendingOptions();

    return options;
  } catch (error) {
    log.error("Failed to retrieve pending options:", error);
    // Clear potentially corrupted data
    clearPendingOptions();
    return null;
  }
}

/**
 * Clear pending generation options from PropertiesService.
 * Call this after successful retrieval or to cleanup after errors.
 */
function clearPendingOptions(): void {
  const log = getScopedLogger("ConfigGeneration");
  try {
    PropertiesService.getScriptProperties().deleteProperty(PENDING_OPTIONS_KEY);
    log.debug("Cleared pending options from PropertiesService");
  } catch (error) {
    log.warn("Failed to clear pending options (non-fatal):", error);
  }
}

function recordTiming(operation: string, startTime: number): void {
  if (typeof AppLogger !== "undefined" && AppLogger && typeof AppLogger.timing === "function") {
    AppLogger.timing(operation, startTime);
    return;
  }
  const duration = new Date().getTime() - startTime;
  console.log(`[TIMING] ${operation} took ${duration}ms`);
}

function handleLanguageSelection(
  selection: TranslationLanguage[] | LanguageSelectionPayload | null | undefined,
): void {
  const log = getScopedLogger("ConfigGeneration");
  log.debug("handleLanguageSelection called with selection:", selection);

  // Try to retrieve options from PropertiesService (for async callbacks)
  // Falls back to global variable (for synchronous calls in same execution context)
  let options = retrievePendingOptions();

  if (!options && pendingGenerationOptions !== null) {
    log.debug("Using options from global variable (synchronous call)");
    options = pendingGenerationOptions;
  }

  if (options) {
    log.info("Found generation options, continuing with config generation");
    generateCoMapeoConfigWithSelectedLanguages(selection, options);
    return;
  }

  log.warn("No generation options found, treating as standalone language management");
  manageLanguagesAndTranslate(selection);
}

/**
 * Entry point for the CoMapeo category generation workflow.
 *
 * Displays the language selection dialog and delegates the rest of the
 * pipeline to {@link generateCoMapeoConfigWithSelectedLanguages}.
 *
 * Stores options in PropertiesService because google.script.run callbacks
 * execute in a new context where global variables are reset.
 */
function startCoMapeoGeneration(options: GenerationOptions): void {
  const log = getScopedLogger("ConfigGeneration");

  // Store in both global (for synchronous calls) and PropertiesService (for async callbacks)
  pendingGenerationOptions = options;
  storePendingOptions(options);

  log.info("Starting CoMapeo generation with options:", options);
  showSelectTranslationLanguagesDialog();
}

function generateCoMapeoConfig(): void {
  startCoMapeoGeneration({ skipDriveWrites: true });
}

/**
 * Continues the generation pipeline without running translations.
 */
function generateCoMapeoConfigSkipTranslation(): void {
  const log = getScopedLogger("ConfigGeneration");
  log.info("User chose to skip translation");
  log.debug("Passing empty array to generateCoMapeoConfigWithSelectedLanguages()");
  handleLanguageSelection([]);
}

function generateCoMapeoConfigInMemory(): void {
  const log = getScopedLogger("ConfigGeneration");
  log.info("Running CoMapeo generation in in-memory mode (Drive writes skipped)");
  pendingGenerationOptions = { skipDriveWrites: true };
  generateCoMapeoConfigWithSelectedLanguages([], { skipDriveWrites: true });
}

function generateCoMapeoConfigWithDriveWrites(): void {
  startCoMapeoGeneration({ skipDriveWrites: false });
}

/**
 * Runs the full CoMapeo configuration pipeline after the user selects
 * languages to translate to.
 *
 * @param selectedLanguages - ISO codes of translation languages chosen by the user.
 */
function generateCoMapeoConfigWithSelectedLanguages(
  selectedLanguages: TranslationLanguage[] | LanguageSelectionPayload | null | undefined,
  options?: GenerationOptions,
): void {
  const log = getScopedLogger("ConfigGeneration");
  const generationOptions = options || pendingGenerationOptions || {};

  // Clear both global variable and PropertiesService to prevent reuse
  pendingGenerationOptions = null;
  clearPendingOptions();

  const skipDriveWrites = Boolean(generationOptions.skipDriveWrites);
  let createdFolderId: string | null = null;
  const languageSelection = normalizeLanguageSelection(selectedLanguages);
  const autoTranslateLanguages = languageSelection.autoTranslateLanguages;
  const customLanguages = languageSelection.customLanguages;

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
    log.debug("Auto-translate languages:", autoTranslateLanguages);
    log.debug("Auto-translate count:", autoTranslateLanguages.length);
    log.debug("Custom languages:", customLanguages);
    log.debug("Custom language count:", customLanguages.length);

    // Lint spreadsheet
    log.info("Linting sheets...");
    const lintStart = Date.now();
    lintAllSheets(false); // Pass false to prevent UI alerts
    recordTiming("lintAllSheets", lintStart);
    log.info("Linting completed");

    if (customLanguages.length > 0) {
      log.info("Adding custom language columns across translation sheets", customLanguages);
      addCustomLanguagesToTranslationSheets(customLanguages);
    } else {
      log.info("No custom languages requested for this run");
    }

    // Step 2: Auto translate (conditional - only if languages selected)
    if (autoTranslateLanguages.length > 0) {
      showProcessingModalDialog(processingDialogTexts[1][locale]);
      log.info("Starting translation process...", { languages: autoTranslateLanguages });
      const translationStart = Date.now();
      autoTranslateSheetsBidirectional(autoTranslateLanguages);
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

    // Check if there were icon errors and show report
    const errorSummaryJson = PropertiesService.getScriptProperties().getProperty("lastIconErrorSummary");
    if (errorSummaryJson) {
      try {
        const errorSummary = JSON.parse(errorSummaryJson);
        if (errorSummary.errorCount > 0) {
          log.info(`Showing icon error dialog with ${errorSummary.errorCount} errors`);
          showIconErrorDialog(errorSummary);
        }
        // Clear after showing
        PropertiesService.getScriptProperties().deleteProperty("lastIconErrorSummary");
      } catch (e) {
        log.warn("Failed to parse icon error summary", e);
      }
    }

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
  const iconResult = processIcons();  // Now returns IconProcessingResult
  const icons = iconResult.icons;
  log.info(`Done processing ${icons.length} icons`);

  // Check for icon errors and store for later display
  if (iconResult.errorSummary.errorCount > 0) {
    log.warn(`Icon processing completed with ${iconResult.errorSummary.errorCount} errors`);
    // Store error summary for later display
    PropertiesService.getScriptProperties().setProperty(
      "lastIconErrorSummary",
      JSON.stringify(iconResult.errorSummary)
    );
  }
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
