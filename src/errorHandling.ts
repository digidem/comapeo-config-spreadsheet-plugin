/**
 * Error handling module for import process
 * Provides centralized error handling, logging, and user feedback
 */

/**
 * Error types for categorizing different errors
 */
enum ErrorType {
  VALIDATION = "validation",
  EXTRACTION = "extraction",
  PARSING = "parsing",
  MAPPING = "mapping",
  SPREADSHEET = "spreadsheet",
  NETWORK = "network",
  PERMISSION = "permission",
  UNKNOWN = "unknown",
}

/**
 * Error severity levels
 */
enum ErrorSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * Import process stages
 */
enum ImportStage {
  FILE_SELECTION = "file_selection",
  FILE_READING = "file_reading",
  EXTRACTION = "extraction",
  VALIDATION = "validation",
  PARSING = "parsing",
  FORMAT_DETECTION = "format_detection",
  MAPPING = "mapping",
  SPREADSHEET_UPDATE = "spreadsheet_update",
  CLEANUP = "cleanup",
  COMPLETE = "complete",
}

/**
 * Import error structure
 */
interface ImportError {
  type: ErrorType;
  severity: ErrorSeverity;
  stage: ImportStage;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
  userMessage: string;
  technicalMessage?: string;
  suggestedAction?: string;
}

/**
 * Import result structure
 */
interface ImportResult {
  success: boolean;
  stage: ImportStage;
  message: string;
  errors?: ImportError[];
  warnings?: ImportError[];
  details?: any;
}

/**
 * Transaction state for atomic imports
 */
interface ImportTransaction {
  active: boolean;
  startTime: Date;
  backupData?: any;
  currentStage: ImportStage;
  errors: ImportError[];
  warnings: ImportError[];
}

// Current transaction state
let currentTransaction: ImportTransaction = {
  active: false,
  startTime: null,
  currentStage: null,
  errors: [],
  warnings: [],
};

/**
 * Starts a new import transaction
 * @returns The new transaction object
 */
function startImportTransaction(): ImportTransaction {
  // If there's already an active transaction, log a warning
  if (currentTransaction.active) {
    console.warn(
      "Starting a new transaction while another is active. The previous transaction will be abandoned.",
    );
  }

  // Create a backup of the current spreadsheet state
  const backupData = backupSpreadsheetState();

  // Initialize the transaction
  currentTransaction = {
    active: true,
    startTime: new Date(),
    backupData,
    currentStage: ImportStage.FILE_SELECTION,
    errors: [],
    warnings: [],
  };

  console.log(
    "Started new import transaction at",
    currentTransaction.startTime,
  );
  return currentTransaction;
}

/**
 * Updates the current import transaction stage
 * @param stage - The new stage
 */
function updateImportStage(stage: ImportStage): void {
  if (!currentTransaction.active) {
    console.warn("Attempting to update stage on inactive transaction");
    return;
  }

  console.log(
    `Import stage changed: ${currentTransaction.currentStage} -> ${stage}`,
  );
  currentTransaction.currentStage = stage;
}

/**
 * Adds an error to the current transaction
 * @param error - The error to add
 */
function addImportError(error: ImportError): void {
  if (!currentTransaction.active) {
    console.warn("Attempting to add error to inactive transaction");
    return;
  }

  console.error("Import error:", error);
  currentTransaction.errors.push(error);

  // If it's a critical error, commit the transaction as failed
  if (error.severity === ErrorSeverity.CRITICAL) {
    commitImportTransaction(false);
  }
}

/**
 * Adds a warning to the current transaction
 * @param warning - The warning to add
 */
function addImportWarning(warning: ImportError): void {
  if (!currentTransaction.active) {
    console.warn("Attempting to add warning to inactive transaction");
    return;
  }

  console.warn("Import warning:", warning);
  currentTransaction.warnings.push(warning);
}

/**
 * Commits the current import transaction
 * @param success - Whether the transaction was successful
 * @returns The import result
 */
function commitImportTransaction(success: boolean): ImportResult {
  if (!currentTransaction.active) {
    console.warn("Attempting to commit inactive transaction");
    return {
      success: false,
      stage: ImportStage.UNKNOWN,
      message: "No active import transaction to commit",
    };
  }

  // If not successful, roll back changes
  if (!success) {
    console.log("Rolling back import transaction due to failure");
    rollbackImportTransaction();
  }

  // Create the result object
  const result: ImportResult = {
    success,
    stage: currentTransaction.currentStage,
    message: success ? "Import completed successfully" : "Import failed",
    errors:
      currentTransaction.errors.length > 0
        ? currentTransaction.errors
        : undefined,
    warnings:
      currentTransaction.warnings.length > 0
        ? currentTransaction.warnings
        : undefined,
  };

  // Add details about errors and warnings
  if (
    currentTransaction.errors.length > 0 ||
    currentTransaction.warnings.length > 0
  ) {
    result.details = {
      errorCount: currentTransaction.errors.length,
      warningCount: currentTransaction.warnings.length,
      errorTypes: [...new Set(currentTransaction.errors.map((e) => e.type))],
      errorStages: [...new Set(currentTransaction.errors.map((e) => e.stage))],
    };
  }

  // Reset the transaction
  currentTransaction.active = false;

  console.log("Committed import transaction:", result);
  return result;
}

/**
 * Rolls back the current import transaction
 */
function rollbackImportTransaction(): void {
  if (!currentTransaction.active) {
    console.warn("Attempting to roll back inactive transaction");
    return;
  }

  console.log("Rolling back import transaction");

  // Restore the spreadsheet state from backup
  if (currentTransaction.backupData) {
    restoreSpreadsheetState(currentTransaction.backupData);
  }
}

/**
 * Creates a backup of the current spreadsheet state
 * @returns The backup data
 */
function backupSpreadsheetState(): any {
  console.log("Creating spreadsheet backup");

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();
    const backup = {};

    // For each sheet, store its data
    sheets.forEach((sheet) => {
      const sheetName = sheet.getName();

      // Skip sheets that are too large or not relevant
      if (sheetName.startsWith("_") || sheetName === "Sheet1") {
        return;
      }

      // Get the data range
      const dataRange = sheet.getDataRange();
      if (dataRange.getNumRows() > 0 && dataRange.getNumColumns() > 0) {
        backup[sheetName] = {
          values: dataRange.getValues(),
          formulas: dataRange.getFormulas(),
          backgrounds: dataRange.getBackgrounds(),
        };
      }
    });

    return backup;
  } catch (error) {
    console.error("Error creating spreadsheet backup:", error);
    return null;
  }
}

/**
 * Restores the spreadsheet state from a backup
 * @param backup - The backup data
 */
function restoreSpreadsheetState(backup: any): void {
  console.log("Restoring spreadsheet from backup");

  if (!backup) {
    console.warn("No backup data provided for restoration");
    return;
  }

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // For each sheet in the backup, restore its data
    for (const sheetName in backup) {
      let sheet = spreadsheet.getSheetByName(sheetName);

      // If the sheet doesn't exist, create it
      if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
      } else {
        // Clear the existing sheet
        sheet.clear();
      }

      const sheetData = backup[sheetName];

      // Restore the data
      if (sheetData.values && sheetData.values.length > 0) {
        const numRows = sheetData.values.length;
        const numCols = sheetData.values[0].length;

        // Set values
        sheet.getRange(1, 1, numRows, numCols).setValues(sheetData.values);

        // Set formulas (overwriting values where formulas exist)
        if (sheetData.formulas) {
          for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
              if (sheetData.formulas[row][col]) {
                sheet
                  .getRange(row + 1, col + 1)
                  .setFormula(sheetData.formulas[row][col]);
              }
            }
          }
        }

        // Set backgrounds
        if (sheetData.backgrounds) {
          sheet
            .getRange(1, 1, numRows, numCols)
            .setBackgrounds(sheetData.backgrounds);
        }
      }
    }

    console.log("Spreadsheet restoration complete");
  } catch (error) {
    console.error("Error restoring spreadsheet:", error);
  }
}

/**
 * Creates a user-friendly error message
 * @param error - The error object
 * @returns User-friendly error message
 */
function createUserErrorMessage(error: ImportError): string {
  let message = error.userMessage || "An error occurred during import.";

  // Add suggested action if available
  if (error.suggestedAction) {
    message += " " + error.suggestedAction;
  }

  return message;
}

/**
 * Creates a technical error message for logging
 * @param error - The error object
 * @returns Technical error message
 */
function createTechnicalErrorMessage(error: ImportError): string {
  let message = `[${error.severity.toUpperCase()}] [${error.type}] [${error.stage}]: ${error.message}`;

  // Add technical details if available
  if (error.technicalMessage) {
    message += "\nDetails: " + error.technicalMessage;
  }

  // Add timestamp
  message += "\nTimestamp: " + error.timestamp.toISOString();

  return message;
}

/**
 * Shows an error dialog to the user
 * @param title - Dialog title
 * @param errors - Array of errors to display
 * @param warnings - Array of warnings to display
 */
function showErrorDialog(
  title: string,
  errors: ImportError[],
  warnings?: ImportError[],
): void {
  const ui = SpreadsheetApp.getUi();

  let message = "";

  // Add errors
  if (errors && errors.length > 0) {
    message += "The following errors occurred:\n\n";
    errors.forEach((error) => {
      message += "• " + createUserErrorMessage(error) + "\n";
    });
  }

  // Add warnings
  if (warnings && warnings.length > 0) {
    if (message) message += "\n";
    message += "Warnings:\n\n";
    warnings.forEach((warning) => {
      message += "• " + createUserErrorMessage(warning) + "\n";
    });
  }

  // Add help text
  message += "\nPlease try again or contact support if the problem persists.";

  ui.alert(title, message, ui.ButtonSet.OK);
}

/**
 * Shows a success dialog to the user
 * @param title - Dialog title
 * @param message - Success message
 * @param warnings - Array of warnings to display
 */
function showSuccessDialog(
  title: string,
  message: string,
  warnings?: ImportError[],
): void {
  const ui = SpreadsheetApp.getUi();

  let fullMessage = message;

  // Add warnings
  if (warnings && warnings.length > 0) {
    fullMessage += "\n\nWarnings:\n\n";
    warnings.forEach((warning) => {
      fullMessage += "• " + createUserErrorMessage(warning) + "\n";
    });
  }

  ui.alert(title, fullMessage, ui.ButtonSet.OK);
}

/**
 * Creates an import error object
 * @param type - Error type
 * @param severity - Error severity
 * @param stage - Import stage
 * @param message - Error message
 * @param userMessage - User-friendly message
 * @param options - Additional options
 * @returns Import error object
 */
function createImportError(
  type: ErrorType,
  severity: ErrorSeverity,
  stage: ImportStage,
  message: string,
  userMessage: string,
  options?: {
    details?: any;
    recoverable?: boolean;
    technicalMessage?: string;
    suggestedAction?: string;
  },
): ImportError {
  return {
    type,
    severity,
    stage,
    message,
    userMessage,
    timestamp: new Date(),
    recoverable:
      options?.recoverable !== undefined ? options.recoverable : false,
    details: options?.details,
    technicalMessage: options?.technicalMessage,
    suggestedAction: options?.suggestedAction,
  };
}

// Export the types and functions
export {
  ErrorType,
  ErrorSeverity,
  ImportStage,
  ImportError,
  ImportResult,
  ImportTransaction,
  startImportTransaction,
  updateImportStage,
  addImportError,
  addImportWarning,
  commitImportTransaction,
  rollbackImportTransaction,
  createImportError,
  showErrorDialog,
  showSuccessDialog,
};
