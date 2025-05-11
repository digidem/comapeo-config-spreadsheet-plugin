/**
 * Handles progress updates for import processes
 * This module provides functions to track and report progress during file imports
 */

/**
 * Progress data interface
 */
interface ProgressData {
  percent: number;
  stage: string;
  detail?: string;
  counts?: {
    [key: string]: number;
  };
}

/**
 * Creates a progress handler function that can be used to report progress
 * @param callback - Client-side callback function
 * @returns Progress handler function
 */
function createProgressHandler(
  callback: Function,
): (data: ProgressData) => void {
  let lastUpdate = Date.now();
  const updateInterval = 200; // Minimum time between updates (ms)

  return function (data: ProgressData): void {
    const now = Date.now();

    // Throttle updates to avoid overwhelming the client
    if (now - lastUpdate >= updateInterval) {
      try {
        callback(data);
        lastUpdate = now;
      } catch (error) {
        console.error("Error in progress callback:", error);
      }
    }
  };
}

/**
 * Processes an imported category file with progress updates
 * @param fileName - Name of the uploaded file
 * @param base64Data - Base64 encoded file data
 * @param progressCallback - Client-side callback function for progress updates
 * @returns Result of the import operation
 */
function processImportedCategoryFileWithProgress(
  fileName: string,
  base64Data: string,
  progressCallback: Function,
): { success: boolean; message: string; details?: any; warnings?: string[] } {
  const startTime = Date.now();
  const progressHandler = createProgressHandler(progressCallback);

  try {
    // Update progress: Starting
    progressHandler({
      percent: 0,
      stage: "Starting import process",
      detail: `Preparing to import ${fileName}`,
    });

    // Decode the base64 data
    progressHandler({
      percent: 5,
      stage: "Decoding file data",
      detail: "Converting base64 data to binary",
    });

    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      "application/octet-stream",
      fileName,
    );

    progressHandler({
      percent: 10,
      stage: "File decoded",
      detail: `File size: ${Math.round(blob.getBytes().length / 1024)} KB`,
    });

    // Extract and validate the file
    progressHandler({
      percent: 15,
      stage: "Extracting file contents",
      detail: "Unzipping configuration archive",
    });

    const extractionResult = extractAndValidateFile(fileName, blob, {
      onProgress: (detail, percent) => {
        // Map extraction progress to 15-40% of overall progress
        const mappedPercent = 15 + Math.round(percent * 0.25);
        progressHandler({
          percent: mappedPercent,
          stage: "Extracting files",
          detail,
        });
      },
    });

    if (!extractionResult.success) {
      throw new Error(extractionResult.message || "Failed to extract file");
    }

    progressHandler({
      percent: 40,
      stage: "Extraction complete",
      detail: `Extracted ${extractionResult.files.length} files`,
      counts: {
        files: extractionResult.files.length,
      },
    });

    // Extract configuration data
    progressHandler({
      percent: 45,
      stage: "Processing configuration data",
      detail: "Parsing configuration files",
    });

    const configData = extractConfigurationData(
      extractionResult.files,
      extractionResult.tempFolder,
      {
        onProgress: (stage, percent) => {
          // Map configuration extraction progress to 45-70% of overall progress
          const mappedPercent = 45 + Math.round(percent * 0.25);
          progressHandler({
            percent: mappedPercent,
            stage: "Processing configuration",
            detail: stage,
          });
        },
      },
    );

    progressHandler({
      percent: 70,
      stage: "Configuration processed",
      detail: "Preparing to update spreadsheet",
      counts: {
        categories: configData.presets.length,
        fields: configData.fields.length,
        icons: configData.icons.length,
        languages: Object.keys(configData.messages).length,
      },
    });

    // Apply configuration to spreadsheet
    progressHandler({
      percent: 75,
      stage: "Updating spreadsheet",
      detail: "Applying configuration to sheets",
    });

    applyConfigurationToSpreadsheet(configData, {
      onProgress: (stage, percent) => {
        // Map spreadsheet update progress to 75-95% of overall progress
        const mappedPercent = 75 + Math.round(percent * 0.2);
        progressHandler({
          percent: mappedPercent,
          stage: "Updating spreadsheet",
          detail: stage,
        });
      },
    });

    // Clean up
    progressHandler({
      percent: 95,
      stage: "Finalizing",
      detail: "Cleaning up temporary files",
    });

    try {
      extractionResult.tempFolder.setTrashed(true);
    } catch (cleanupError) {
      console.warn("Error cleaning up temporary folder:", cleanupError);
    }

    // Complete
    const processingTime = Date.now() - startTime;
    progressHandler({
      percent: 100,
      stage: "Import complete",
      detail: `Completed in ${(processingTime / 1000).toFixed(2)} seconds`,
    });

    return {
      success: true,
      message: "Configuration file imported successfully",
      details: {
        presets: configData.presets.length,
        fields: configData.fields.length,
        icons: configData.icons.length,
        languages: Object.keys(configData.messages),
        processingTime: processingTime,
      },
      warnings: extractionResult.validationWarnings || [],
    };
  } catch (error) {
    console.error("Error in processImportedCategoryFileWithProgress:", error);

    // Report error
    progressHandler({
      percent: 0,
      stage: "Error",
      detail: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Processes a Mapeo settings file with progress updates
 * @param fileName - Name of the uploaded file
 * @param base64Data - Base64 encoded file data
 * @param progressCallback - Client-side callback function for progress updates
 * @returns Result of the import operation
 */
function processMapeoSettingsFileWithProgress(
  fileName: string,
  base64Data: string,
  progressCallback: Function,
): { success: boolean; message: string; details?: any; warnings?: string[] } {
  const startTime = Date.now();
  const progressHandler = createProgressHandler(progressCallback);

  try {
    // Update progress: Starting
    progressHandler({
      percent: 0,
      stage: "Starting import process",
      detail: `Preparing to import ${fileName}`,
    });

    // Decode the base64 data
    progressHandler({
      percent: 5,
      stage: "Decoding file data",
      detail: "Converting base64 data to binary",
    });

    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      "application/octet-stream",
      fileName,
    );

    progressHandler({
      percent: 10,
      stage: "File decoded",
      detail: `File size: ${Math.round(blob.getBytes().length / 1024)} KB`,
    });

    // Create a temporary folder
    progressHandler({
      percent: 15,
      stage: "Creating temporary storage",
      detail: "Setting up workspace for extraction",
    });

    const tempFolder = DriveApp.createFolder(
      "Mapeo_Settings_Import_" + new Date().getTime(),
    );
    const file = tempFolder.createFile(blob);

    progressHandler({
      percent: 20,
      stage: "Analyzing file format",
      detail: "Determining file structure",
    });

    try {
      // Try to extract the file
      progressHandler({
        percent: 25,
        stage: "Extracting file contents",
        detail: "Attempting to extract as tar archive",
      });

      const extractedFiles = extractTarFile(blob, tempFolder);

      progressHandler({
        percent: 40,
        stage: "Extraction complete",
        detail: `Extracted ${extractedFiles.length} files`,
        counts: {
          files: extractedFiles.length,
        },
      });

      // Extract configuration data
      progressHandler({
        percent: 45,
        stage: "Processing configuration data",
        detail: "Parsing configuration files",
      });

      const configData = extractMapeoConfigurationData(
        extractedFiles,
        tempFolder,
      );

      progressHandler({
        percent: 70,
        stage: "Configuration processed",
        detail: "Preparing to update spreadsheet",
        counts: {
          categories: configData.presets ? configData.presets.length : 0,
          fields: configData.fields ? configData.fields.length : 0,
          icons: configData.icons ? configData.icons.length : 0,
        },
      });

      // Apply configuration to spreadsheet
      progressHandler({
        percent: 75,
        stage: "Updating spreadsheet",
        detail: "Applying configuration to sheets",
      });

      applyMapeoConfigurationToSpreadsheet(configData);

      // Clean up
      progressHandler({
        percent: 95,
        stage: "Finalizing",
        detail: "Cleaning up temporary files",
      });

      try {
        tempFolder.setTrashed(true);
      } catch (cleanupError) {
        console.warn("Error cleaning up temporary folder:", cleanupError);
      }

      // Complete
      const processingTime = Date.now() - startTime;
      progressHandler({
        percent: 100,
        stage: "Import complete",
        detail: `Completed in ${(processingTime / 1000).toFixed(2)} seconds`,
      });

      return {
        success: true,
        message: "Mapeo settings file imported successfully",
        details: {
          presets: configData.presets ? configData.presets.length : 0,
          fields: configData.fields ? configData.fields.length : 0,
          icons: configData.icons ? configData.icons.length : 0,
          processingTime: processingTime,
        },
      };
    } catch (extractError) {
      // If extraction fails, try to parse it directly
      progressHandler({
        percent: 30,
        stage: "Extraction failed",
        detail: "Attempting to parse as JSON",
      });

      const fileContent = blob.getDataAsString();

      try {
        progressHandler({
          percent: 40,
          stage: "Parsing JSON",
          detail: "Interpreting file as direct JSON configuration",
        });

        const jsonData = JSON.parse(fileContent);

        progressHandler({
          percent: 60,
          stage: "JSON parsed successfully",
          detail: "Normalizing configuration data",
        });

        // Process the JSON data
        progressHandler({
          percent: 70,
          stage: "Updating spreadsheet",
          detail: "Applying configuration to sheets",
        });

        applyMapeoJsonConfigToSpreadsheet(jsonData);

        // Clean up
        progressHandler({
          percent: 95,
          stage: "Finalizing",
          detail: "Cleaning up temporary files",
        });

        try {
          tempFolder.setTrashed(true);
        } catch (cleanupError) {
          console.warn("Error cleaning up temporary folder:", cleanupError);
        }

        // Complete
        const processingTime = Date.now() - startTime;
        progressHandler({
          percent: 100,
          stage: "Import complete",
          detail: `Completed in ${(processingTime / 1000).toFixed(2)} seconds`,
        });

        return {
          success: true,
          message: "Mapeo settings file imported successfully",
          details: {
            processingTime: processingTime,
          },
        };
      } catch (jsonError) {
        progressHandler({
          percent: 0,
          stage: "Error",
          detail:
            "Could not parse the Mapeo settings file. The file may be corrupted.",
        });

        throw new Error(
          "Could not parse the Mapeo settings file. The file may be corrupted.",
        );
      }
    }
  } catch (error) {
    console.error("Error in processMapeoSettingsFileWithProgress:", error);

    // Report error
    progressHandler({
      percent: 0,
      stage: "Error",
      detail: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
