/**
 * Test function for format detection and mapping
 * This function downloads and processes a test file to verify format detection and mapping
 */

/**
 * Test the format detection and mapping functionality
 * @param url - URL of the test file to download (optional)
 */
function testFormatDetection(url?: string) {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // Show a progress dialog
    const htmlOutput = HtmlService.createHtmlOutput(
      '<div style="text-align: center; padding: 20px;">' +
      '<h3>Testing Format Detection</h3>' +
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
    
    const dialog = ui.showModelessDialog(htmlOutput, 'Testing Format Detection');
    
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
    log('Starting format detection test', 'info');
    
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
    const tempFolder = DriveApp.createFolder('Format_Detection_Test_' + new Date().getTime());
    log(`Created temporary folder: ${tempFolder.getName()}`, 'info');
    
    // Extract the file
    updateProgress(30, 'Extracting file...');
    let extractedFiles: GoogleAppsScript.Base.Blob[];
    try {
      // Determine file type based on URL
      if (url.endsWith('.comapeocat') || url.endsWith('.zip')) {
        log('Detected .comapeocat or .zip file, using zip extractor', 'info');
        extractedFiles = extractZipFile(fileBlob, tempFolder);
      } else if (url.endsWith('.mapeosettings') || url.endsWith('.tar')) {
        log('Detected .mapeosettings or .tar file, using tar extractor', 'info');
        try {
          extractedFiles = extractTarFile(fileBlob, tempFolder);
        } catch (tarError) {
          log(`Tar extraction failed, trying to parse as JSON: ${tarError}`, 'warning');
          // If tar extraction fails, try to parse as JSON
          const fileContent = fileBlob.getDataAsString();
          const jsonData = JSON.parse(fileContent);
          
          // Create a blob for the JSON data
          const jsonBlob = Utilities.newBlob(
            JSON.stringify(jsonData, null, 2),
            'application/json',
            'config.json'
          );
          
          // Save to temp folder
          tempFolder.createFile(jsonBlob);
          extractedFiles = [jsonBlob];
        }
      } else {
        log('Unknown file type, trying to parse as JSON', 'warning');
        // Try to parse as JSON
        const fileContent = fileBlob.getDataAsString();
        const jsonData = JSON.parse(fileContent);
        
        // Create a blob for the JSON data
        const jsonBlob = Utilities.newBlob(
          JSON.stringify(jsonData, null, 2),
          'application/json',
          'config.json'
        );
        
        // Save to temp folder
        tempFolder.createFile(jsonBlob);
        extractedFiles = [jsonBlob];
      }
      
      log(`Extracted ${extractedFiles.length} files`, 'success');
    } catch (error) {
      log(`Error extracting file: ${error}`, 'error');
      throw new Error(`Failed to extract file: ${error}`);
    }
    
    // Extract configuration data
    updateProgress(50, 'Extracting configuration data...');
    let configData: any;
    try {
      configData = extractConfigurationData(extractedFiles, tempFolder, {
        onProgress: (stage: string, percent: number) => {
          updateProgress(50 + Math.round(percent * 0.3), `Extracting: ${stage}`);
        }
      });
      log('Configuration data extracted successfully', 'success');
    } catch (error) {
      log(`Error extracting configuration data: ${error}`, 'error');
      throw new Error(`Failed to extract configuration data: ${error}`);
    }
    
    // Analyze the configuration
    updateProgress(80, 'Analyzing configuration...');
    log('Configuration analysis:', 'info');
    log(`Format: ${configData.format || 'unknown'}`, 'info');
    log(`Metadata: ${JSON.stringify(configData.metadata, null, 2)}`, 'info');
    log(`Presets: ${configData.presets.length}`, 'info');
    log(`Fields: ${configData.fields.length}`, 'info');
    log(`Icons: ${configData.icons.length}`, 'info');
    log(`Messages: ${Object.keys(configData.messages || {}).length} languages`, 'info');
    
    // Clean up
    updateProgress(90, 'Cleaning up...');
    tempFolder.setTrashed(true);
    log('Temporary folder deleted', 'info');
    
    // Complete
    updateProgress(100, 'Test completed successfully');
    log('Format detection test completed successfully', 'success');
    
    return {
      success: true,
      message: 'Format detection test completed successfully',
      details: {
        format: configData.format,
        presets: configData.presets.length,
        fields: configData.fields.length,
        icons: configData.icons.length,
        languages: Object.keys(configData.messages || {})
      }
    };
  } catch (error) {
    console.error('Error in format detection test:', error);
    return {
      success: false,
      message: `Error in format detection test: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
