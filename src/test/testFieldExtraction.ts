/**
 * Test function for field extraction and application to the Details tab
 * This function tests the extraction and application of fields from a configuration file
 */

/**
 * Test the field extraction and application functionality
 * @param url - URL of the test file to download (optional)
 */
function testFieldExtraction(url?: string) {
  // const ui = SpreadsheetApp.getUi();

  try {
    // Show a progress dialog
    const htmlOutput = HtmlService.createHtmlOutput(
      '<div style="text-align: center; padding: 20px;">' +
        "<h3>Testing Field Extraction</h3>" +
        '<div id="progress-container" style="width: 100%; background-color: #f1f1f1; border-radius: 5px; margin: 20px 0;">' +
        '<div id="progress-bar" style="width: 0%; height: 30px; background-color: #4CAF50; border-radius: 5px; text-align: center; line-height: 30px; color: white;">0%</div>' +
        "</div>" +
        '<div id="status">Initializing test...</div>' +
        '<div id="log" style="text-align: left; margin-top: 20px; height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; font-family: monospace; font-size: 12px;"></div>' +
        "</div>" +
        "<script>" +
        "function updateProgress(percent, status, logMessage, logType) {" +
        '  document.getElementById("progress-bar").style.width = percent + "%";' +
        '  document.getElementById("progress-bar").innerHTML = percent + "%";' +
        '  if (status) document.getElementById("status").innerHTML = status;' +
        "  if (logMessage) {" +
        '    const log = document.getElementById("log");' +
        '    const logEntry = document.createElement("div");' +
        '    if (logType) logEntry.style.color = logType === "error" ? "#F44336" : logType === "warning" ? "#FF9800" : logType === "success" ? "#4CAF50" : "#2196F3";' +
        "    logEntry.textContent = logMessage;" +
        "    log.appendChild(logEntry);" +
        "    log.scrollTop = log.scrollHeight;" +
        "  }" +
        "}" +
        "</script>",
    )
      .setWidth(600)
      .setHeight(400);

    // const dialog = ui.showModelessDialog(
    //   htmlOutput,
    //   "Testing Field Extraction",
    // );

    // Helper function to update progress
    const updateProgress = (
      percent: number,
      status: string,
      logMessage?: string,
      logType?: string,
    ) => {
      const script = `updateProgress(${percent}, "${status}", ${logMessage ? `"${logMessage.replace(/"/g, '\\"')}"` : "null"}, ${logType ? `"${logType}"` : "null"});`;
      try {
        htmlOutput.append(`<script>${script}</script>`);
      } catch (e) {
        console.error("Error updating progress:", e);
      }
    };

    // Log function
    const log = (
      message: string,
      type?: "info" | "success" | "warning" | "error",
    ) => {
      console.log(message);
      updateProgress(null, null, message, type);
    };

    // Start the test
    updateProgress(5, "Starting test...");
    log("Starting field extraction test", "info");

    // Use a default URL if none provided
    if (!url) {
      url = "https://luandro.com/dist/mapeo-default-min.mapeosettings";
      log(`Using default test file: ${url}`, "info");
    }

    // Download the test file
    updateProgress(10, "Downloading test file...");
    log(`Downloading file from: ${url}`, "info");

    let fileBlob: GoogleAppsScript.Base.Blob;
    try {
      const response = UrlFetchApp.fetch(url);
      fileBlob = response.getBlob();
      log(
        `Downloaded file: ${fileBlob.getName()} (${fileBlob.getBytes().length} bytes)`,
        "success",
      );
    } catch (error) {
      log(`Error downloading file: ${error}`, "error");
      throw new Error(`Failed to download file: ${error}`);
    }

    // Create a temporary folder
    updateProgress(20, "Creating temporary folder...");
    const tempFolder = DriveApp.createFolder(
      "Field_Extraction_Test_" + new Date().getTime(),
    );
    log(`Created temporary folder: ${tempFolder.getName()}`, "info");

    // Extract the file
    updateProgress(30, "Extracting file...");
    let extractionResult;

    try {
      extractionResult = extractAndValidateFile(fileBlob.getName(), fileBlob);

      if (!extractionResult.success) {
        log(`Extraction failed: ${extractionResult.message}`, "error");
        throw new Error("Extraction failed");
      }

      log(
        `Extraction successful: ${extractionResult.files.length} files extracted`,
        "success",
      );
    } catch (error) {
      log(`Error during extraction: ${error}`, "error");
      throw new Error(`Failed to extract file: ${error}`);
    }

    // Extract configuration data
    updateProgress(50, "Extracting configuration data...");
    let configData;

    try {
      configData = extractConfigurationData(
        extractionResult.files,
        extractionResult.tempFolder,
      );

      log("Configuration data extracted:", "success");
      log(
        `- Fields: ${configData.fields ? configData.fields.length : 0}`,
        "info",
      );

      if (configData.fields && configData.fields.length > 0) {
        // Log the first few fields for debugging
        const sampleFields = configData.fields.slice(0, 3);
        sampleFields.forEach((field, index) => {
          log(
            `Sample field ${index + 1}: ${field.label || field.id || "unnamed"} (${field.type || "unknown type"})`,
            "info",
          );
        });
      } else {
        log("No fields found in configuration data", "warning");
      }
    } catch (error) {
      log(`Error extracting configuration data: ${error}`, "error");
      throw new Error(`Failed to extract configuration data: ${error}`);
    }

    // Create a backup of the current sheets
    updateProgress(70, "Creating backup of current sheets...");
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const backupSheets = {};

    // Backup Details sheet
    const detailsSheet = spreadsheet.getSheetByName("Details");
    if (detailsSheet) {
      log("Backing up Details sheet...", "info");
      const detailsData = detailsSheet.getDataRange().getValues();
      backupSheets["Details"] = detailsData;
    }

    // Apply fields to spreadsheet
    updateProgress(80, "Applying fields to spreadsheet...");
    try {
      // Create or clear the Details sheet
      let sheet = spreadsheet.getSheetByName("Details");
      if (!sheet) {
        log("Creating new Details sheet", "info");
        sheet = spreadsheet.insertSheet("Details");
      } else {
        log("Clearing existing Details sheet", "info");
        sheet.clear();
      }
      console.log("configData", configData);
      // Apply fields
      if (configData.fields && configData.fields.length > 0) {
        log(
          `Applying ${configData.fields.length} fields to Details sheet`,
          "info",
        );
        applyFields(spreadsheet, configData.fields);

        // Verify fields were applied
        const newDetailsSheet = spreadsheet.getSheetByName("Details");
        if (newDetailsSheet) {
          const lastRow = newDetailsSheet.getLastRow();
          log(
            `Details sheet now has ${lastRow - 1} fields (header row excluded)`,
            "success",
          );

          if (lastRow <= 1) {
            log("No fields were added to the Details sheet!", "error");
          } else if (lastRow - 1 !== configData.fields.length) {
            log(
              `Warning: Expected ${configData.fields.length} fields but found ${lastRow - 1}`,
              "warning",
            );
          }
        } else {
          log("Details sheet not found after applying fields", "error");
        }
      } else {
        log("No fields to apply", "warning");
      }
    } catch (error) {
      log(`Error applying fields to spreadsheet: ${error}`, "error");

      // Restore backup
      log("Restoring backup...", "info");

      // Restore Details sheet
      if (backupSheets["Details"] && detailsSheet) {
        detailsSheet.clear();
        detailsSheet
          .getRange(
            1,
            1,
            backupSheets["Details"].length,
            backupSheets["Details"][0].length,
          )
          .setValues(backupSheets["Details"]);
        log("Restored Details sheet", "success");
      }

      throw new Error(`Failed to apply fields to spreadsheet: ${error}`);
    }

    // Clean up
    updateProgress(95, "Cleaning up...");
    try {
      extractionResult.tempFolder.setTrashed(true);
      log("Temporary folder deleted", "info");
    } catch (error) {
      log(`Error cleaning up temporary folder: ${error}`, "warning");
    }

    // Restore backup
    updateProgress(98, "Restoring backup...");
    log("Restoring backup...", "info");

    // Restore Details sheet
    if (backupSheets["Details"] && detailsSheet) {
      detailsSheet.clear();
      detailsSheet
        .getRange(
          1,
          1,
          backupSheets["Details"].length,
          backupSheets["Details"][0].length,
        )
        .setValues(backupSheets["Details"]);
      log("Restored Details sheet", "success");
    }

    // Complete
    updateProgress(100, "Test completed successfully");
    log("Field extraction test completed successfully", "success");

    return {
      success: true,
      message: "Field extraction test completed successfully",
    };
  } catch (error) {
    console.error("Error in field extraction test:", error);
    return {
      success: false,
      message: `Error in field extraction test: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
