// Main entry point for the import category functionality

/**
 * Extracts configuration data from files.
 * This is a compatibility function for tests and other modules.
 * It simply calls parseExtractedFiles internally.
 *
 * @param files - Array of extracted file blobs
 * @param tempFolder - Temporary folder containing the extracted files
 * @param options - Optional configuration options
 * @returns Configuration data object
 */
function extractConfigurationData(
  files: GoogleAppsScript.Base.Blob[] | undefined,
  tempFolder?: GoogleAppsScript.Drive.Folder,
  options?: any,
): any {
  // Just call parseExtractedFiles for compatibility
  // Unused parameters are kept for API compatibility with existing code
  try {
    console.log(
      `Extracting configuration data from ${files ? files.length : "undefined"} files`,
    );
    if (tempFolder) {
      console.log(`Using temp folder: ${tempFolder.getName()}`);
    }
    if (options) {
      console.log(`Using options: ${JSON.stringify(options)}`);
    }

    // If files is undefined or empty, create a minimal default configuration
    if (!files || files.length === 0) {
      console.log("No files provided, creating default minimal configuration");
      return {
        metadata: { name: "Default Configuration" },
        presets: [],
        fields: [],
        messages: {},
        icons: [],
      };
    }

    return parseExtractedFiles(files);
  } catch (error) {
    console.error("Error in extractConfigurationData:", error);
    // Return a minimal valid configuration to prevent crashes
    return {
      metadata: { name: "Error Configuration" },
      presets: [],
      fields: [],
      messages: {},
      icons: [],
    };
  }
}

/**
 * Shows the import category dialog.
 * This is the main entry point for the import category functionality.
 */
function showImportCategoryDialog() {
  // Get dialog texts from the importCategory/dialogTexts.ts file
  const title = importCategoryDialogTexts[locale].title;

  // Create HTML output using the function from importCategory/ui.ts
  const htmlOutput = HtmlService.createHtmlOutput(createImportCategoryHtml())
    .setWidth(800)
    .setHeight(600);

  // Show the dialog
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, title);
}

/**
 * Main function to process an imported category file.
 * This function is called from the UI when a file is selected.
 *
 * @param fileName - The name of the imported file
 * @param base64Data - The file content as base64 string
 * @returns Success message if import was successful
 */
function processImportedCategoryFile(
  fileName: string,
  base64Data: string,
): { success: boolean; message: string; details?: any } {
  try {
    console.log(`Starting import of file: ${fileName}`);

    // Decode the base64 data
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      "application/octet-stream",
      fileName,
    );
    console.log(`Decoded file size: ${blob.getBytes().length} bytes`);

    // Extract the tar file using the function from importCategory/extractTarFile.ts
    const extractionResult = extractTarFile(blob);
    if (!extractionResult.success) {
      return {
        success: false,
        message: extractionResult.message || "Failed to extract file",
      };
    }

    // Parse the extracted files using the function from importCategory/parseFiles.ts
    const configData = parseExtractedFiles(extractionResult.files);

    // Apply the configuration to the spreadsheet using the function from importCategory/applyConfiguration.ts
    applyConfigurationToSpreadsheet(configData);

    // Clean up temporary resources
    if (extractionResult.tempFolder) {
      try {
        extractionResult.tempFolder.setTrashed(true);
      } catch (error) {
        console.warn("Error cleaning up temporary folder:", error);
      }
    }

    return {
      success: true,
      message: "Category file imported successfully",
      details: {
        presets: configData.presets.length,
        fields: configData.fields.length,
        icons: configData.icons.length,
        languages: Object.keys(configData.messages).length,
      },
    };
  } catch (error) {
    console.error("Error processing imported file:", error);
    return {
      success: false,
      message:
        "Error processing imported file: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}
