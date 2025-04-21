/**
 * Test functions for the extraction and validation process
 * These functions help diagnose issues with the import workflow
 */

/**
 * Test the extraction and validation process with a sample comapeocat file
 * This function downloads a file from a URL, extracts it, and validates the contents
 * It logs detailed information at each step to help diagnose issues
 */
function testExtractAndValidate(): void {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // Show a loading dialog
    const htmlOutput = HtmlService.createHtmlOutput(
      '<div style="text-align: center; padding: 20px;">' +
      '<h3>Testing Extraction and Validation</h3>' +
      '<p>Please wait while we download and process the test file...</p>' +
      '<div style="width: 100%; height: 10px; background-color: #f1f1f1; border-radius: 5px; margin-top: 20px;">' +
      '<div id="progress" style="width: 10%; height: 100%; background-color: #4285f4; border-radius: 5px;"></div>' +
      '</div>' +
      '</div>' +
      '<script>' +
      'function updateProgress(percent) {' +
      '  document.getElementById("progress").style.width = percent + "%";' +
      '}' +
      'google.script.run.withSuccessHandler(function(result) {' +
      '  google.script.host.close();' +
      '}).runTestExtractAndValidateProcess();' +
      '</script>'
    )
    .setWidth(400)
    .setHeight(200)
    .setTitle('Testing Import Process');
    
    ui.showModalDialog(htmlOutput, 'Testing Import Process');
  } catch (error) {
    console.error('Error showing test dialog:', error);
    // Fall back to running the test directly if dialog fails
    runTestExtractAndValidateProcess();
  }
}

/**
 * Run the actual test process
 * This is called either directly or from the dialog
 */
function runTestExtractAndValidateProcess(): { success: boolean; message: string; details?: any } {
  try {
    console.log('=== STARTING EXTRACTION AND VALIDATION TEST ===');
    console.log('Test started at:', new Date().toISOString());
    
    // Step 1: Download the file from URL
    console.log('\n--- STEP 1: DOWNLOADING FILE ---');
    const fileUrl = 'https://github.com/digidem/comapeo-category-library/releases/download/v1.0.0/comapeo-biodiversity-comapeo-config-generator-v24.10.24.comapeocat';
    console.log('Downloading file from URL:', fileUrl);
    
    const response = UrlFetchApp.fetch(fileUrl);
    console.log('Response code:', response.getResponseCode());
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`Failed to download file. Response code: ${response.getResponseCode()}`);
    }
    
    const fileBlob = response.getBlob();
    console.log('File downloaded successfully');
    console.log('File size:', fileBlob.getBytes().length, 'bytes');
    console.log('Content type:', fileBlob.getContentType());
    
    // Set the file name and content type
    const fileName = 'test-comapeo-biodiversity.comapeocat';
    fileBlob.setName(fileName);
    fileBlob.setContentType('application/octet-stream');
    console.log('File name set to:', fileName);
    
    // Step 2: Extract and validate the file
    console.log('\n--- STEP 2: EXTRACTING AND VALIDATING FILE ---');
    console.log('Calling extractAndValidateFile function...');
    
    // Get the extractAndValidateFile function
    // @ts-ignore - This function is defined in another file
    const extractionResult = extractAndValidateFile(fileName, fileBlob);
    
    console.log('Extraction result:', JSON.stringify(extractionResult, null, 2));
    
    if (!extractionResult.success) {
      console.error('Extraction failed:', extractionResult.message);
      if (extractionResult.validationErrors) {
        console.error('Validation errors:', extractionResult.validationErrors);
      }
      throw new Error(`Extraction failed: ${extractionResult.message}`);
    }
    
    console.log('Extraction successful');
    if (extractionResult.validationWarnings) {
      console.warn('Validation warnings:', extractionResult.validationWarnings);
    }
    
    // Step 3: Extract configuration data
    console.log('\n--- STEP 3: EXTRACTING CONFIGURATION DATA ---');
    
    if (!extractionResult.files || !extractionResult.tempFolder) {
      throw new Error('No files or temp folder in extraction result');
    }
    
    console.log('Number of extracted files:', extractionResult.files.length);
    console.log('File names:', extractionResult.files.map(f => f.getName()));
    
    // @ts-ignore - This function is defined in another file
    const configData = extractConfigurationData(extractionResult.files, extractionResult.tempFolder);
    
    console.log('Configuration data extracted:');
    console.log('- Metadata:', configData.metadata ? 'Present' : 'Missing');
    console.log('- Package JSON:', configData.packageJson ? 'Present' : 'Missing');
    console.log('- Presets:', configData.presets.length);
    console.log('- Fields:', configData.fields.length);
    console.log('- Icons:', configData.icons.length);
    console.log('- Languages:', Object.keys(configData.messages).length);
    
    // Step 4: Apply configuration to spreadsheet
    console.log('\n--- STEP 4: APPLYING CONFIGURATION TO SPREADSHEET ---');
    
    // Create a backup of the current sheets
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const backupSheets = backupCurrentSheets(spreadsheet);
    
    try {
      // @ts-ignore - This function is defined in another file
      applyConfigurationToSpreadsheet(configData);
      
      console.log('Configuration applied to spreadsheet successfully');
      
      // Verify the sheets were updated
      const categoriesSheet = spreadsheet.getSheetByName('Categories');
      const detailsSheet = spreadsheet.getSheetByName('Details');
      const metadataSheet = spreadsheet.getSheetByName('Metadata');
      
      if (!categoriesSheet || !detailsSheet || !metadataSheet) {
        throw new Error('One or more required sheets not found after applying configuration');
      }
      
      console.log('Categories sheet last row:', categoriesSheet.getLastRow());
      console.log('Details sheet last row:', detailsSheet.getLastRow());
      console.log('Metadata sheet last row:', metadataSheet.getLastRow());
      
      // Step 5: Clean up
      console.log('\n--- STEP 5: CLEANING UP ---');
      
      if (extractionResult.tempFolder) {
        // @ts-ignore - This function is defined in another file
        cleanupTempResources(extractionResult.tempFolder);
        console.log('Temporary resources cleaned up');
      }
      
      // Restore the backup sheets
      restoreBackupSheets(spreadsheet, backupSheets);
      console.log('Backup sheets restored');
      
      // Show success message
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        'Test Completed Successfully',
        'The extraction and validation test completed successfully. Check the logs for detailed information.',
        ui.ButtonSet.OK
      );
      
      console.log('=== TEST COMPLETED SUCCESSFULLY ===');
      return {
        success: true,
        message: 'Test completed successfully',
        details: {
          presets: configData.presets.length,
          fields: configData.fields.length,
          icons: configData.icons.length,
          languages: Object.keys(configData.messages)
        }
      };
    } catch (error) {
      console.error('Error applying configuration:', error);
      
      // Restore the backup sheets
      restoreBackupSheets(spreadsheet, backupSheets);
      console.log('Backup sheets restored after error');
      
      throw error;
    }
  } catch (error) {
    console.error('=== TEST FAILED ===');
    console.error('Error:', error);
    
    // Show error message
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Test Failed',
      'The extraction and validation test failed. Error: ' + (error instanceof Error ? error.message : String(error)) + '\n\nCheck the logs for detailed information.',
      ui.ButtonSet.OK
    );
    
    return {
      success: false,
      message: 'Test failed: ' + (error instanceof Error ? error.message : String(error))
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
