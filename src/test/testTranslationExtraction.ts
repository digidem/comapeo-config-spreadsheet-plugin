/**
 * Test function for translation extraction
 * This function tests the extraction and application of translations from different formats
 */

/**
 * Test the translation extraction functionality
 * @param url - URL of the test file to download (optional)
 */
function testTranslationExtraction(url?: string) {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // Show a progress dialog
    const htmlOutput = HtmlService.createHtmlOutput(
      '<div style="text-align: center; padding: 20px;">' +
      '<h3>Testing Translation Extraction</h3>' +
      '<div id="progress-container" style="width: 100%; background-color: #f1f1f1; border-radius: 5px; margin: 20px 0;">' +
      '<div id="progress-bar" style="width: 0%; height: 30px; background-color: #4CAF50; border-radius: 5px; text-align: center; line-height: 30px; color: white;">0%</div>' +
      '</div>' +
      '<div id="status">Initializing test...</div>' +
      '<div id="log" style="text-align: left; margin-top: 20px; height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; font-family: monospace; font-size: 12px;"></div>' +
      '</div>' +
      '<script>' +
      'function updateProgress(percent, status, logMessage, logType) {' +
      '  document.getElementById("progress-bar").style.width = percent + "%";' +
      '  document.getElementById("progress-bar").innerHTML = percent + "%";' +
      '  if (status) document.getElementById("status").innerHTML = status;' +
      '  if (logMessage) {' +
      '    const log = document.getElementById("log");' +
      '    const logEntry = document.createElement("div");' +
      '    if (logType) logEntry.style.color = logType === "error" ? "#F44336" : logType === "warning" ? "#FF9800" : logType === "success" ? "#4CAF50" : "#2196F3";' +
      '    logEntry.textContent = logMessage;' +
      '    log.appendChild(logEntry);' +
      '    log.scrollTop = log.scrollHeight;' +
      '  }' +
      '}' +
      '</script>'
    )
    .setWidth(600)
    .setHeight(400);
    
    const dialog = ui.showModelessDialog(htmlOutput, 'Testing Translation Extraction');
    
    // Helper function to update progress
    const updateProgress = (percent: number, status: string, logMessage?: string, logType?: string) => {
      const script = `updateProgress(${percent}, "${status}", ${logMessage ? `"${logMessage.replace(/"/g, '\\"')}"` : 'null'}, ${logType ? `"${logType}"` : 'null'});`;
      try {
        htmlOutput.append(`<script>${script}</script>`);
      } catch (e) {
        console.error('Error updating progress:', e);
      }
    };
    
    // Log function
    const log = (message: string, type?: 'info' | 'success' | 'warning' | 'error') => {
      console.log(message);
      updateProgress(null, null, message, type);
    };
    
    // Start the test
    updateProgress(5, 'Starting test...');
    log('Starting translation extraction test', 'info');
    
    // Use a default URL if none provided
    if (!url) {
      url = 'https://github.com/digidem/mapeo-config-es/releases/download/v1.0.0/mapeo-config-es-v1.0.0.mapeosettings';
      log(`Using default test file: ${url}`, 'info');
    }
    
    // Download the test file
    updateProgress(10, 'Downloading test file...');
    log(`Downloading file from: ${url}`, 'info');
    
    let fileBlob: GoogleAppsScript.Base.Blob;
    try {
      const response = UrlFetchApp.fetch(url);
      fileBlob = response.getBlob();
      log(`Downloaded file: ${fileBlob.getName()} (${fileBlob.getBytes().length} bytes)`, 'success');
    } catch (error) {
      log(`Error downloading file: ${error}`, 'error');
      throw new Error(`Failed to download file: ${error}`);
    }
    
    // Create a temporary folder
    updateProgress(20, 'Creating temporary folder...');
    const tempFolder = DriveApp.createFolder('Translation_Extraction_Test_' + new Date().getTime());
    log(`Created temporary folder: ${tempFolder.getName()}`, 'info');
    
    // Extract the file
    updateProgress(30, 'Extracting file...');
    let extractedFiles: GoogleAppsScript.Base.Blob[];
    let translationsJson: any = null;
    
    try {
      // Determine file type based on URL
      if (url.endsWith('.comapeocat') || url.endsWith('.zip')) {
        log('Detected .comapeocat or .zip file, using zip extractor', 'info');
        extractedFiles = extractZipFile(fileBlob, tempFolder);
        
        // Find translations.json
        const translationsFile = extractedFiles.find(file => file.getName() === 'translations.json');
        if (translationsFile) {
          translationsJson = JSON.parse(translationsFile.getDataAsString());
          log('Found translations.json in zip file', 'success');
        }
      } else if (url.endsWith('.mapeosettings') || url.endsWith('.tar')) {
        log('Detected .mapeosettings or .tar file, using tar extractor', 'info');
        try {
          extractedFiles = extractTarFile(fileBlob, tempFolder);
          
          // Find translations.json
          const translationsFile = extractedFiles.find(file => file.getName() === 'translations.json');
          if (translationsFile) {
            translationsJson = JSON.parse(translationsFile.getDataAsString());
            log('Found translations.json in tar file', 'success');
          }
        } catch (tarError) {
          log(`Tar extraction failed, trying to parse as JSON: ${tarError}`, 'warning');
          // If tar extraction fails, try to parse as JSON
          const fileContent = fileBlob.getDataAsString();
          const jsonData = JSON.parse(fileContent);
          
          // Check if it has translations
          if (jsonData.translations) {
            translationsJson = jsonData.translations;
            log('Found translations in JSON file', 'success');
          }
        }
      } else {
        log('Unknown file type, trying to parse as JSON', 'warning');
        // Try to parse as JSON
        const fileContent = fileBlob.getDataAsString();
        const jsonData = JSON.parse(fileContent);
        
        // Check if it has translations
        if (jsonData.translations) {
          translationsJson = jsonData.translations;
          log('Found translations in JSON file', 'success');
        }
      }
      
      if (!translationsJson) {
        log('No translations found in the file', 'warning');
        // Create a sample translations object for testing
        translationsJson = {
          "es": {
            "presets.river.name": {
              "message": "Río",
              "description": "River in Spanish"
            },
            "fields.name.label": {
              "message": "Nombre",
              "description": "Name field label in Spanish"
            }
          },
          "pt": {
            "presets.river.name": {
              "message": "Rio",
              "description": "River in Portuguese"
            },
            "fields.name.label": {
              "message": "Nome",
              "description": "Name field label in Portuguese"
            }
          }
        };
        log('Created sample translations for testing', 'info');
      }
    } catch (error) {
      log(`Error extracting file: ${error}`, 'error');
      throw new Error(`Failed to extract file: ${error}`);
    }
    
    // Extract translations
    updateProgress(50, 'Extracting translations...');
    try {
      const normalizedTranslations = extractTranslations(translationsJson);
      
      // Log translation statistics
      log('Translation extraction results:', 'info');
      for (const language in normalizedTranslations) {
        const translations = normalizedTranslations[language];
        log(`Language: ${language} - ${translations.length} translations`, 'info');
        
        // Count by type
        const presetCount = translations.filter(t => t.type === 'preset').length;
        const fieldCount = translations.filter(t => t.type === 'field').length;
        const helperTextCount = translations.filter(t => t.type === 'helperText').length;
        const optionCount = translations.filter(t => t.type === 'option').length;
        const otherCount = translations.filter(t => t.type === 'other').length;
        
        log(`  - Presets: ${presetCount}`, 'info');
        log(`  - Fields: ${fieldCount}`, 'info');
        log(`  - Helper Texts: ${helperTextCount}`, 'info');
        log(`  - Options: ${optionCount}`, 'info');
        log(`  - Other: ${otherCount}`, 'info');
        
        // Show some examples
        if (translations.length > 0) {
          log('Examples:', 'info');
          const examples = translations.slice(0, Math.min(5, translations.length));
          examples.forEach(t => {
            log(`  - ${t.key}: "${t.message}" (${t.type})`, 'info');
          });
        }
      }
      
      updateProgress(80, 'Creating test data...');
      
      // Create test presets and fields
      const testPresets = [
        { icon: 'river', name: 'River', fields: ['name', 'width'] },
        { icon: 'building', name: 'Building', fields: ['name', 'height'] }
      ];
      
      const testFields = [
        { tagKey: 'name', label: 'Name', type: 'text', helperText: 'Enter a name' },
        { tagKey: 'width', label: 'Width', type: 'number', helperText: 'Enter width in meters' },
        { tagKey: 'height', label: 'Height', type: 'number', helperText: 'Enter height in meters' },
        { 
          tagKey: 'type', 
          label: 'Type', 
          type: 'selectOne', 
          helperText: 'Select a type',
          options: [
            { label: 'Type A', value: 'a' },
            { label: 'Type B', value: 'b' }
          ]
        }
      ];
      
      // Apply translations to test spreadsheet
      updateProgress(90, 'Applying translations to test spreadsheet...');
      
      // Create a test spreadsheet
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      
      // Apply translations
      applyExtractedTranslations(spreadsheet, normalizedTranslations, testPresets, testFields);
      
      log('Translations applied to spreadsheet', 'success');
    } catch (error) {
      log(`Error processing translations: ${error}`, 'error');
      throw new Error(`Failed to process translations: ${error}`);
    }
    
    // Clean up
    updateProgress(95, 'Cleaning up...');
    tempFolder.setTrashed(true);
    log('Temporary folder deleted', 'info');
    
    // Complete
    updateProgress(100, 'Test completed successfully');
    log('Translation extraction test completed successfully', 'success');
    
    return {
      success: true,
      message: 'Translation extraction test completed successfully'
    };
  } catch (error) {
    console.error('Error in translation extraction test:', error);
    return {
      success: false,
      message: `Error in translation extraction test: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
