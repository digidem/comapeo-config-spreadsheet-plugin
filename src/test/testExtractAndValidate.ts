/**
 * Test functions for the extraction and validation process
 * These functions help diagnose issues with the import workflow
 */

/**
 * Test the extraction and validation process with a sample comapeocat file
 * This function downloads a file from a URL, extracts it, and validates the contents
 * It logs detailed information at each step to help diagnose issues
 *
 * This is a developer tool intended to be run directly from the Apps Script editor
 * for debugging purposes.
 */
function testExtractAndValidate(): void {
  const ui = SpreadsheetApp.getUi();

  try {
    // Show a detailed progress dialog
    const htmlOutput = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <base target="_top">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          h3 {
            color: #4285f4;
            margin-top: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
          }
          .progress-container {
            width: 100%;
            height: 20px;
            background-color: #f1f1f1;
            border-radius: 10px;
            margin: 20px 0;
            overflow: hidden;
          }
          .progress-bar {
            height: 100%;
            width: 5%;
            background-color: #4285f4;
            border-radius: 10px;
            transition: width 0.3s ease;
          }
          .status {
            font-size: 14px;
            margin-bottom: 10px;
            min-height: 60px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #4285f4;
            white-space: pre-line;
          }
          .log-container {
            max-height: 200px;
            overflow-y: auto;
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            margin-top: 20px;
            border: 1px solid #ddd;
          }
          .log-entry {
            margin: 0;
            padding: 2px 0;
            border-bottom: 1px solid #eee;
          }
          .log-entry:last-child {
            border-bottom: none;
          }
          .success {
            color: #34a853;
          }
          .error {
            color: #ea4335;
          }
          .warning {
            color: #fbbc05;
          }
          .info {
            color: #4285f4;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h3>Testing Extraction and Validation</h3>
          <p>This test will download a sample comapeocat file and run it through the extraction and validation process.</p>

          <div class="progress-container">
            <div id="progress-bar" class="progress-bar"></div>
          </div>

          <div id="status" class="status">Initializing test...</div>

          <div class="log-container">
            <div id="log"></div>
          </div>
        </div>

        <script>
          // Initialize variables
          let logEntries = [];
          const maxLogEntries = 100;

          // Update progress bar
          function updateProgress(percent) {
            document.getElementById('progress-bar').style.width = percent + '%';
          }

          // Update status message
          function updateStatus(message) {
            document.getElementById('status').textContent = message;
          }

          // Add log entry
          function addLogEntry(message, type = 'info') {
            // Add to array and limit size
            logEntries.push({ message, type });
            if (logEntries.length > maxLogEntries) {
              logEntries.shift();
            }

            // Update display
            const logContainer = document.getElementById('log');
            logContainer.innerHTML = '';

            logEntries.forEach(entry => {
              const logEntry = document.createElement('p');
              logEntry.className = 'log-entry ' + entry.type;
              logEntry.textContent = entry.message;
              logContainer.appendChild(logEntry);
            });

            // Scroll to bottom
            logContainer.parentElement.scrollTop = logContainer.parentElement.scrollHeight;
          }

          // Start the test
          google.script.run
            .withSuccessHandler(function(result) {
              if (result.success) {
                updateProgress(100);
                updateStatus('Test completed successfully!');
                addLogEntry('Test completed successfully!', 'success');

                // Show details if available
                if (result.details) {
                  const detailsStr = Object.entries(result.details)
                    .map(([key, value]) => key + ': ' + value)
                    .join('\n');
                  addLogEntry('Details:\n' + detailsStr, 'info');
                }

                // Close after delay
                setTimeout(() => google.script.host.close(), 5000);
              } else {
                updateProgress(100);
                updateStatus('Test failed: ' + result.message);
                addLogEntry('Test failed: ' + result.message, 'error');
              }
            })
            .withFailureHandler(function(error) {
              updateProgress(100);
              updateStatus('Error: ' + error.message);
              addLogEntry('Error: ' + error.message, 'error');
            })
            .withUserObject({
              updateProgress: function(percent) {
                google.script.run.withSuccessHandler(function() {
                  updateProgress(percent);
                }).doNothing();
              },
              updateStatus: function(message) {
                google.script.run.withSuccessHandler(function() {
                  updateStatus(message);
                  addLogEntry(message);
                }).doNothing();
              },
              addLogEntry: function(message, type) {
                google.script.run.withSuccessHandler(function() {
                  addLogEntry(message, type);
                }).doNothing();
              }
            })
            .runTestExtractAndValidateProcess();
        </script>
      </body>
      </html>
    `)
    .setWidth(650)
    .setHeight(500)
    .setTitle('Testing Import Process');

    ui.showModalDialog(htmlOutput, 'Testing Import Process');
  } catch (error) {
    console.error('Error showing test dialog:', error);
    // Fall back to running the test directly if dialog fails
    runTestExtractAndValidateProcess();
  }
}

/**
 * Empty function used for callbacks
 */
function doNothing() {
  return null;
}

/**
 * Run the actual test process
 * This is called either directly or from the dialog
 * @param {Object} [userInterface] - Optional UI object for progress updates
 */
function runTestExtractAndValidateProcess(userInterface?: any): { success: boolean; message: string; details?: any } {
  // Helper function to update progress
  const updateProgress = (percent: number) => {
    console.log(`Progress: ${percent}%`);
    if (userInterface && userInterface.updateProgress) {
      userInterface.updateProgress(percent);
    }
  };

  // Helper function to update status
  const updateStatus = (message: string) => {
    console.log(message);
    if (userInterface && userInterface.updateStatus) {
      userInterface.updateStatus(message);
    }
  };

  // Helper function to add log entry
  const addLogEntry = (message: string, type: string = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    if (userInterface && userInterface.addLogEntry) {
      userInterface.addLogEntry(message, type);
    }
  };

  try {
    addLogEntry('=== STARTING EXTRACTION AND VALIDATION TEST ===');
    addLogEntry(`Test started at: ${new Date().toISOString()}`);
    updateProgress(5);

    // Step 1: Download the file from URL
    updateStatus('Step 1/5: Downloading test file...');
    addLogEntry('\n--- STEP 1: DOWNLOADING FILE ---');
    const fileUrl = 'https://luandro.com/dist/mapeo-default-min.mapeosettings';
    addLogEntry(`Downloading file from URL: ${fileUrl}`);

    const response = UrlFetchApp.fetch(fileUrl);
    addLogEntry(`Response code: ${response.getResponseCode()}`);
    updateProgress(15);

    if (response.getResponseCode() !== 200) {
      throw new Error(`Failed to download file. Response code: ${response.getResponseCode()}`);
    }

    const fileBlob = response.getBlob();
    const fileSizeKB = Math.round(fileBlob.getBytes().length / 1024);
    addLogEntry(`File downloaded successfully (${fileSizeKB} KB)`);
    addLogEntry(`Content type: ${fileBlob.getContentType()}`);
    updateProgress(20);

    // Set the file name and content type
    const fileName = 'mapeo-minimal.mapeosettings';
    fileBlob.setName(fileName);
    fileBlob.setContentType('application/gzip');
    // fileBlob.setContentType('application/octet-stream');
    addLogEntry(`File name set to: ${fileName}`);

    // Step 2: Extract and validate the file
    updateStatus('Step 2/5: Extracting and validating file...');
    addLogEntry('\n--- STEP 2: EXTRACTING AND VALIDATING FILE ---');
    addLogEntry('Starting ZIP extraction process...');
    updateProgress(25);

    // Get the extractAndValidateFile function
    // @ts-ignore - This function is defined in another file
    const extractionResult = extractAndValidateFile(fileName, fileBlob, {
      onProgress: (stage: string, percent: number) => {
        const overallPercent = 25 + Math.round(percent * 0.25); // Map 0-100 to 25-50
        updateProgress(overallPercent);
        updateStatus(`Step 2/5: ${stage} (${percent}%)...`);
      }
    });

    updateProgress(50);
    addLogEntry(`Extraction completed with result: ${extractionResult.success ? 'SUCCESS' : 'FAILURE'}`);

    if (!extractionResult.success) {
      addLogEntry(`Extraction failed: ${extractionResult.message}`, 'error');
      if (extractionResult.validationErrors) {
        extractionResult.validationErrors.forEach((error: string) => {
          addLogEntry(`Validation error: ${error}`, 'error');
        });
      }
      throw new Error(`Extraction failed: ${extractionResult.message}`);
    }

    addLogEntry('Extraction successful', 'success');
    if (extractionResult.validationWarnings && extractionResult.validationWarnings.length > 0) {
      extractionResult.validationWarnings.forEach((warning: string) => {
        addLogEntry(`Validation warning: ${warning}`, 'warning');
      });
    }

    // Step 3: Extract configuration data
    updateStatus('Step 3/5: Extracting configuration data...');
    addLogEntry('\n--- STEP 3: EXTRACTING CONFIGURATION DATA ---');
    updateProgress(55);

    if (!extractionResult.files || !extractionResult.tempFolder) {
      throw new Error('No files or temp folder in extraction result');
    }

    addLogEntry(`Number of extracted files: ${extractionResult.files.length}`);
    addLogEntry(`Extracted files: ${extractionResult.files.map(f => f.getName()).join(', ')}`);
    updateProgress(60);

    // @ts-ignore - This function is defined in another file
    const configData = extractConfigurationData(extractionResult.files, extractionResult.tempFolder, {
      onProgress: (stage: string, percent: number) => {
        const overallPercent = 60 + Math.round(percent * 0.15); // Map 0-100 to 60-75
        updateProgress(overallPercent);
        updateStatus(`Step 3/5: ${stage} (${percent}%)...`);
      }
    });

    updateProgress(75);
    addLogEntry('Configuration data extracted successfully', 'success');
    addLogEntry(`- Metadata: ${configData.metadata ? 'Present' : 'Missing'}`);
    addLogEntry(`- Package JSON: ${configData.packageJson ? 'Present' : 'Missing'}`);
    addLogEntry(`- Presets: ${configData.presets.length}`);
    addLogEntry(`- Fields: ${configData.fields.length}`);
    addLogEntry(`- Icons: ${configData.icons.length}`);
    addLogEntry(`- Languages: ${Object.keys(configData.messages).length}`);

    // Step 4: Apply configuration to spreadsheet
    updateStatus('Step 4/5: Applying configuration to spreadsheet...');
    addLogEntry('\n--- STEP 4: APPLYING CONFIGURATION TO SPREADSHEET ---');
    updateProgress(80);

    // Create a backup of the current sheets
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    addLogEntry('Creating backup of current sheets...');
    const backupSheets = backupCurrentSheets(spreadsheet);

    try {
      addLogEntry('Applying configuration to spreadsheet...');
      // @ts-ignore - This function is defined in another file
      applyConfigurationToSpreadsheet(configData, {
        onProgress: (stage: string, percent: number) => {
          const overallPercent = 80 + Math.round(percent * 0.1); // Map 0-100 to 80-90
          updateProgress(overallPercent);
          updateStatus(`Step 4/5: ${stage} (${percent}%)...`);
        }
      });

      updateProgress(90);
      addLogEntry('Configuration applied to spreadsheet successfully', 'success');

      // Verify the sheets were updated
      const categoriesSheet = spreadsheet.getSheetByName('Categories');
      const detailsSheet = spreadsheet.getSheetByName('Details');
      const metadataSheet = spreadsheet.getSheetByName('Metadata');

      if (!categoriesSheet || !detailsSheet || !metadataSheet) {
        throw new Error('One or more required sheets not found after applying configuration');
      }

      addLogEntry(`Categories sheet: ${categoriesSheet.getLastRow()} rows`);
      addLogEntry(`Details sheet: ${detailsSheet.getLastRow()} rows`);
      addLogEntry(`Metadata sheet: ${metadataSheet.getLastRow()} rows`);

      // Step 5: Clean up
      updateStatus('Step 5/5: Cleaning up...');
      addLogEntry('\n--- STEP 5: CLEANING UP ---');
      updateProgress(95);

      if (extractionResult.tempFolder) {
        addLogEntry('Cleaning up temporary resources...');
        // @ts-ignore - This function is defined in another file
        cleanupTempResources(extractionResult.tempFolder);
        addLogEntry('Temporary resources cleaned up');
      }

      // Restore the backup sheets
      addLogEntry('Restoring backup sheets...');
      restoreBackupSheets(spreadsheet, backupSheets);
      addLogEntry('Backup sheets restored');

      updateProgress(100);
      updateStatus('Test completed successfully!');
      addLogEntry('=== TEST COMPLETED SUCCESSFULLY ===', 'success');

      return {
        success: true,
        message: 'Test completed successfully',
        details: {
          presets: configData.presets.length,
          fields: configData.fields.length,
          icons: configData.icons.length,
          languages: Object.keys(configData.messages).length
        }
      };
    } catch (error) {
      addLogEntry(`Error applying configuration: ${error instanceof Error ? error.message : String(error)}`, 'error');

      // Restore the backup sheets
      addLogEntry('Restoring backup sheets after error...');
      restoreBackupSheets(spreadsheet, backupSheets);
      addLogEntry('Backup sheets restored after error');

      throw error;
    }
  } catch (error) {
    updateProgress(100);
    updateStatus(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    addLogEntry('=== TEST FAILED ===', 'error');
    addLogEntry(`Error: ${error instanceof Error ? error.message : String(error)}`, 'error');

    return {
      success: false,
      message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Create a backup of the current sheets
 * @param spreadsheet - The active spreadsheet
 * @returns Map of sheet names to their data
 */
function backupCurrentSheets(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet): Map<string, any[][]> {
  const sheetsToBackup = ['Categories', 'Details', 'Metadata'];
  const backupData = new Map<string, any[][]>();

  sheetsToBackup.forEach(sheetName => {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      backupData.set(sheetName, data);
      console.log(`Backed up ${sheetName} sheet: ${data.length} rows`);
    } else {
      console.log(`Sheet ${sheetName} not found, no backup needed`);
    }
  });

  return backupData;
}

/**
 * Restore sheets from backup
 * @param spreadsheet - The active spreadsheet
 * @param backupData - Map of sheet names to their data
 */
function restoreBackupSheets(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, backupData: Map<string, any[][]>): void {
  backupData.forEach((data, sheetName) => {
    let sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      // If the sheet doesn't exist, create it
      sheet = spreadsheet.insertSheet(sheetName);
      console.log(`Created new sheet: ${sheetName}`);
    } else {
      // Clear the existing sheet
      sheet.clear();
      console.log(`Cleared sheet: ${sheetName}`);
    }

    if (data.length > 0) {
      // Restore the data
      sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
      console.log(`Restored ${data.length} rows to ${sheetName} sheet`);
    } else {
      console.log(`No data to restore for ${sheetName} sheet`);
    }
  });
}
