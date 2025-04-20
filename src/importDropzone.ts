// Global function declarations
declare const locale: string;

/**
 * Interface for dropzone configuration options
 */
interface DropzoneOptions {
  acceptedFileTypes: string[];
  maxFileSize: number; // in bytes
  multiple: boolean;
}

/**
 * Shows the import dialog with a dropzone for file uploads
 */
function showImportDropzoneDialog(): void {
  const htmlOutput = HtmlService.createHtmlOutput(createDropzoneHtml())
    .setWidth(600)
    .setHeight(400)
    .setTitle('Import Configuration File');

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Import Configuration File');
}

/**
 * Creates the HTML for the dropzone dialog
 */
function createDropzoneHtml(): string {
  const dropzoneOptions: DropzoneOptions = {
    acceptedFileTypes: ['.comapeocat', '.mapeosettings'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  };

  return `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <title>Import Configuration File</title>
  <style>
    body {
      font-family: 'Roboto', Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    .warning-box {
      background-color: #fff3e0;
      border-left: 4px solid #ff9800;
      border-radius: 4px;
      padding: 12px 16px;
      margin-bottom: 20px;
      font-size: 14px;
      line-height: 1.5;
    }
    .warning-title {
      color: #e65100;
      font-weight: bold;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
    }
    .warning-icon {
      margin-right: 8px;
    }
    .warning-text {
      color: #bf360c;
    }
    .confirmation-dialog {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease;
    }
    .confirmation-dialog.visible {
      opacity: 1;
      visibility: visible;
    }
    .confirmation-content {
      background-color: white;
      border-radius: 8px;
      padding: 24px;
      width: 90%;
      max-width: 400px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    .confirmation-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 16px;
      color: #d32f2f;
    }
    .confirmation-text {
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .confirmation-buttons {
      display: flex;
      justify-content: flex-end;
    }
    .btn {
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: background-color 0.3s ease;
    }
    .btn-cancel {
      background-color: #e0e0e0;
      color: #424242;
      margin-right: 12px;
    }
    .btn-cancel:hover {
      background-color: #bdbdbd;
    }
    .btn-confirm {
      background-color: #d32f2f;
      color: white;
    }
    .btn-confirm:hover {
      background-color: #b71c1c;
    }
    h1 {
      font-size: 1.5em;
      margin-top: 0;
      margin-bottom: 20px;
      color: #4285f4;
      text-align: center;
    }
    .dropzone {
      border: 2px dashed #4285f4;
      border-radius: 5px;
      padding: 25px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: #f8f9fa;
      position: relative;
      min-height: 150px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .dropzone.dragover {
      background-color: #e8f0fe;
      border-color: #1a73e8;
    }
    .dropzone.error {
      border-color: #ea4335;
      background-color: #fce8e6;
    }
    .dropzone.success {
      border-color: #34a853;
      background-color: #e6f4ea;
    }
    .dropzone-icon {
      font-size: 48px;
      margin-bottom: 10px;
      color: #4285f4;
    }
    .dropzone-text {
      margin-bottom: 10px;
      font-size: 16px;
    }
    .dropzone-subtext {
      font-size: 12px;
      color: #5f6368;
    }
    .file-input {
      display: none;
    }
    .progress-container {
      width: 100%;
      margin-top: 15px;
      display: none;
    }
    .progress-bar {
      height: 4px;
      background-color: #e0e0e0;
      border-radius: 2px;
      overflow: hidden;
    }
    .progress {
      height: 100%;
      background-color: #4285f4;
      width: 0%;
      transition: width 0.3s ease;
    }
    .status-message {
      margin-top: 10px;
      font-size: 14px;
      text-align: center;
      min-height: 20px;
    }
    .error-message {
      color: #ea4335;
    }
    .success-message {
      color: #34a853;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Import Configuration File</h1>

    <div class="warning-box">
      <div class="warning-title">
        <span class="warning-icon">⚠️</span>
        <span>Warning</span>
      </div>
      <div class="warning-text">
        Importing a configuration file will erase all current spreadsheet data and replace it with content from the file.
        Make sure you have a backup of your current data if needed.
      </div>
    </div>

    <div id="dropzone" class="dropzone">
      <div class="dropzone-icon">📁</div>
      <div class="dropzone-text">Drag and drop your file here</div>
      <div class="dropzone-subtext">or click to browse files</div>
      <div class="dropzone-subtext">Accepted file types: .comapeocat, .mapeosettings, .zip, .tar</div>
      <input type="file" id="file-input" class="file-input" accept=".comapeocat,.mapeosettings,.zip,.tar">
      <div class="progress-container" id="progress-container">
        <div class="progress-bar">
          <div class="progress" id="progress"></div>
        </div>
      </div>
    </div>
    <div id="status-message" class="status-message"></div>
  </div>

  <!-- Confirmation Dialog -->
  <div id="confirmation-dialog" class="confirmation-dialog">
    <div class="confirmation-content">
      <div class="confirmation-title">Confirm Import</div>
      <div class="confirmation-text">
        This action will erase all current data in your spreadsheet and replace it with the content from the imported file. This cannot be undone.
        <br><br>
        Are you sure you want to continue?
      </div>
      <div class="confirmation-buttons">
        <button id="btn-cancel" class="btn btn-cancel">Cancel</button>
        <button id="btn-confirm" class="btn btn-confirm">Yes, Import</button>
      </div>
    </div>
  </div>

  <script>
    // Store dropzone options
    const dropzoneOptions = ${JSON.stringify(dropzoneOptions)};

    // DOM elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const progressContainer = document.getElementById('progress-container');
    const progress = document.getElementById('progress');
    const statusMessage = document.getElementById('status-message');
    const confirmationDialog = document.getElementById('confirmation-dialog');
    const btnCancel = document.getElementById('btn-cancel');
    const btnConfirm = document.getElementById('btn-confirm');

    // Simple event listeners that are known to work
    dropzone.onclick = function() {
      fileInput.click();
    };

    // Handle drag events
    dropzone.ondragover = handleDragOver;
    dropzone.ondragleave = handleDragLeave;
    dropzone.ondrop = handleDrop;

    // Prevent default browser behavior for drag events
    document.ondragover = function(e) { e.preventDefault(); };
    document.ondrop = function(e) { e.preventDefault(); };

    // Handle file selection
    fileInput.onchange = handleFileSelect;

    // Simple drag over handler
    function handleDragOver(e) {
      e.preventDefault();
      dropzone.classList.add('dragover');
    }

    // Simple drag leave handler
    function handleDragLeave(e) {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    }

    // Simple drop handler
    function handleDrop(e) {
      e.preventDefault();
      dropzone.classList.remove('dragover');

      if (e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0]);
      }
    }

    // Simple file selection handler
    function handleFileSelect(e) {
      if (e.target.files.length > 0) {
        processFile(e.target.files[0]);
      }
    }

    // Simple event handlers for confirmation dialog
    btnCancel.onclick = function() {
      confirmationDialog.classList.remove('visible');
      resetUI();
    };

    // Process the selected file
    function processFile(file) {
      // Reset UI
      resetUI();

      // Validate file type
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!dropzoneOptions.acceptedFileTypes.includes(fileExtension)) {
        showError('Invalid file type. Please upload a .comapeocat or .mapeosettings file.');
        return;
      }

      // Validate file size
      if (file.size > dropzoneOptions.maxFileSize) {
        showError('File is too large. Maximum file size is ' +
          (dropzoneOptions.maxFileSize / (1024 * 1024)) + 'MB.');
        return;
      }

      // Store the file for later processing
      const selectedFile = file;

      // Show confirmation dialog
      confirmationDialog.classList.add('visible');

      // Set up confirmation button action
      btnConfirm.onclick = function() {
        // Hide confirmation dialog
        confirmationDialog.classList.remove('visible');

        // Show progress
        progressContainer.style.display = 'block';
        updateProgress(10);
        statusMessage.textContent = 'Reading file...';

        // Read the file
        const reader = new FileReader();

        reader.onload = function(e) {
          updateProgress(50);
          statusMessage.textContent = 'Processing file...';

          try {
            const base64data = e.target.result.split(',')[1];

            // Call the appropriate Google Apps Script function based on file extension
            const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

            if (fileExtension === 'comapeocat' || fileExtension === 'zip') {
              google.script.run
                .withSuccessHandler(onSuccess)
                .withFailureHandler(onFailure)
                .processImportedCategoryFile(selectedFile.name, base64data);
            } else if (fileExtension === 'mapeosettings') {
              google.script.run
                .withSuccessHandler(onSuccess)
                .withFailureHandler(onFailure)
                .processMapeoSettingsFile(selectedFile.name, base64data);
            } else {
              onFailure(new Error('Unsupported file type'));
            }

            updateProgress(75);
          } catch (error) {
            onFailure(error);
          }
        };

        reader.onerror = function() {
          onFailure(new Error('Error reading file'));
        };

        reader.readAsDataURL(selectedFile);
      };
    }

    // Handle successful import
    function onSuccess(result) {
      if (result && result.success) {
        updateProgress(100);
        dropzone.classList.add('success');
        statusMessage.textContent = result.message || 'File imported successfully!';
        statusMessage.classList.add('success-message');

        // Close the dialog after a delay
        setTimeout(() => {
          google.script.host.close();
        }, 2000);
      } else {
        // Handle server-side validation errors
        onFailure({
          message: result && result.message ? result.message : 'Import failed'
        });
      }
    }

    // Handle import failure
    function onFailure(error) {
      dropzone.classList.add('error');

      // Format error message - handle multi-line errors
      const errorMsg = error.message || 'Failed to import file';

      // Replace newlines with HTML line breaks
      statusMessage.innerHTML = 'Error: ' + errorMsg.replace(/\n/g, '<br>');
      statusMessage.classList.add('error-message');
      updateProgress(0);
    }

    // Show error message
    function showError(message) {
      dropzone.classList.add('error');
      // Use innerHTML to support HTML content if needed
      statusMessage.innerHTML = message;
      statusMessage.classList.add('error-message');
    }

    // Update progress bar
    function updateProgress(percent) {
      progress.style.width = percent + '%';
    }

    // Reset UI
    function resetUI() {
      dropzone.classList.remove('error', 'success', 'dragover');
      statusMessage.textContent = '';
      statusMessage.classList.remove('error-message', 'success-message');
      updateProgress(0);
    }
  </script>
</body>
</html>`;
}

/**
 * Handles the file import process
 * @param fileName - Name of the uploaded file
 * @param base64Data - Base64 encoded file data
 * @returns Result of the import operation
 */
/**
 * Processes a .mapeosettings file (classic Mapeo configuration)
 * @param fileName - Name of the uploaded file
 * @param base64Data - Base64 encoded file data
 * @returns Result of the import operation
 */
function processMapeoSettingsFile(fileName: string, base64Data: string): { success: boolean; message: string } {
  try {
    // Decode the base64 data
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'application/octet-stream', fileName);

    // Extract and validate the file
    const extractionResult = extractAndValidateFile(fileName, blob);

    if (!extractionResult.success) {
      // Return the error message
      return {
        success: false,
        message: extractionResult.message + (extractionResult.validationErrors ?
          '\n- ' + extractionResult.validationErrors.join('\n- ') : '')
      };
    }

    // Process the extracted files
    const configData = extractMapeoConfigurationData(extractionResult.files, extractionResult.tempFolder);

    // Apply the configuration data to the spreadsheet
    applyMapeoConfigurationToSpreadsheet(configData);

    // Clean up the temporary folder
    if (extractionResult.tempFolder) {
      cleanupTempResources(extractionResult.tempFolder);
    }

    // Return success
    return {
      success: true,
      message: 'Mapeo settings file imported successfully'
    };
  } catch (error) {
    console.error('Error processing Mapeo settings file:', error);
    return {
      success: false,
      message: 'Error processing Mapeo settings file: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}

/**
 * Extracts configuration data from Mapeo settings files
 * @param extractedFiles - Array of extracted file blobs
 * @param tempFolder - Temporary folder containing the files
 * @returns Configuration data object
 */
function extractMapeoConfigurationData(extractedFiles: GoogleAppsScript.Base.Blob[], tempFolder: GoogleAppsScript.Drive.Folder): any {
  // Initialize configuration data object
  const configData: any = {
    metadata: null,
    presets: [],
    fields: [],
    icons: []
  };

  // Process each extracted file
  for (const file of extractedFiles) {
    const fileName = file.getName();
    const fileContent = file.getDataAsString();

    try {
      // Parse JSON content if applicable
      if (fileName.endsWith('.json')) {
        const jsonContent = JSON.parse(fileContent);

        // Determine file type and add to appropriate section of configData
        if (fileName === 'metadata.json' || fileName === 'meta.json') {
          configData.metadata = jsonContent;
        } else if (fileName === 'presets.json') {
          configData.presets = jsonContent.presets || [];
        } else if (fileName === 'fields.json') {
          configData.fields = jsonContent.fields || [];
        }
      } else if (fileName.startsWith('icons/') || fileName.includes('/icons/')) {
        // Save icon file to temp folder and get URL
        const iconFile = tempFolder.createFile(file);
        configData.icons.push({
          name: fileName.split('/').pop().replace(/\.[^/.]+$/, ''),
          svg: iconFile.getUrl()
        });
      }
    } catch (error) {
      console.warn('Error parsing file ' + fileName + ':', error);
      // Continue with other files even if one fails
    }
  }

  return configData;
}

/**
 * Applies Mapeo JSON configuration directly to the spreadsheet
 * @param jsonData - The parsed JSON data from the Mapeo settings file
 */
function applyMapeoJsonConfigToSpreadsheet(jsonData: any): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Create or clear necessary sheets
  const categoriesSheet = createOrClearSheet(spreadsheet, 'Categories');
  const detailsSheet = createOrClearSheet(spreadsheet, 'Details');
  const metadataSheet = createOrClearSheet(spreadsheet, 'Metadata');

  // Process metadata if available
  if (jsonData.metadata) {
    applyMetadataToSheet(metadataSheet, jsonData.metadata);
  }

  // Process presets (categories) if available
  if (jsonData.presets) {
    const presets = [];

    // Convert from Mapeo format to our internal format
    for (const presetId in jsonData.presets) {
      if (jsonData.presets.hasOwnProperty(presetId)) {
        const preset = jsonData.presets[presetId];
        presets.push({
          id: presetId,
          name: preset.name,
          icon: preset.icon,
          color: preset.color,
          fields: preset.fields || []
        });
      }
    }

    applyCategoriesFromMapeo(categoriesSheet, presets, jsonData.icons || []);
  }

  // Process fields (details) if available
  if (jsonData.fields) {
    const fields = [];

    // Convert from Mapeo format to our internal format
    for (const fieldId in jsonData.fields) {
      if (jsonData.fields.hasOwnProperty(fieldId)) {
        const field = jsonData.fields[fieldId];
        fields.push({
          id: fieldId,
          key: fieldId,
          tagKey: fieldId,
          label: field.label,
          type: field.type,
          helperText: field.placeholder || '',
          options: field.options || []
        });
      }
    }

    applyFieldsFromMapeo(detailsSheet, fields);
  }
}

/**
 * Applies metadata to the metadata sheet
 * @param sheet - The metadata sheet
 * @param metadata - Metadata object
 */
function applyMetadataToSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet, metadata: any): void {
  // Set headers
  sheet.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold');

  // Add metadata rows
  const metadataRows = Object.entries(metadata).map(([key, value]) => [key, value]);
  if (metadataRows.length > 0) {
    sheet.getRange(2, 1, metadataRows.length, 2).setValues(metadataRows);
  }
}

/**
 * Applies categories from Mapeo format to the Categories sheet
 * @param sheet - The Categories sheet
 * @param presets - Array of preset objects
 * @param icons - Array of icon objects
 */
function applyCategoriesFromMapeo(sheet: GoogleAppsScript.Spreadsheet.Sheet, presets: any[], icons: any[]): void {
  // Set headers
  sheet.getRange(1, 1, 1, 3).setValues([['English', 'Icons', 'Details']]);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold');

  // Prepare category rows
  const categoryRows = presets.map(preset => {
    // Find matching icon
    const iconObj = icons.find(icon => icon.id === preset.icon);
    const iconUrl = iconObj ? iconObj.url : '';

    // Get fields as comma-separated string
    const fields = preset.fields ? preset.fields.join(', ') : '';

    return [preset.name, iconUrl, fields];
  });

  // Add category rows
  if (categoryRows.length > 0) {
    sheet.getRange(2, 1, categoryRows.length, 3).setValues(categoryRows);
  }

  // Set background colors if available
  presets.forEach((preset, index) => {
    if (preset.color) {
      sheet.getRange(index + 2, 1).setBackground(preset.color);
    }
  });
}

/**
 * Applies fields from Mapeo format to the Details sheet
 * @param sheet - The Details sheet
 * @param fields - Array of field objects
 */
function applyFieldsFromMapeo(sheet: GoogleAppsScript.Spreadsheet.Sheet, fields: any[]): void {
  // Set headers
  sheet.getRange(1, 1, 1, 4).setValues([['Label', 'Helper Text', 'Type', 'Options']]);
  sheet.getRange(1, 1, 1, 4).setFontWeight('bold');

  // Prepare field rows
  const fieldRows = fields.map(field => {
    // Convert field type to spreadsheet format
    let typeStr = 'text';
    if (field.type === 'select') typeStr = 'select';
    if (field.type === 'multiselect') typeStr = 'multiple';
    if (field.type === 'number') typeStr = 'number';

    // Convert options to comma-separated string
    let optionsStr = '';
    if (field.options && field.options.length > 0) {
      optionsStr = field.options.map((opt: any) => opt.label || opt.value).join(', ');
    }

    return [field.label, field.helperText || '', typeStr, optionsStr];
  });

  // Add field rows
  if (fieldRows.length > 0) {
    sheet.getRange(2, 1, fieldRows.length, 4).setValues(fieldRows);
  }
}

/**
 * Applies Mapeo configuration data to the spreadsheet
 * @param configData - Configuration data object
 */
function applyMapeoConfigurationToSpreadsheet(configData: any): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Create or clear necessary sheets
  const categoriesSheet = createOrClearSheet(spreadsheet, 'Categories');
  const detailsSheet = createOrClearSheet(spreadsheet, 'Details');
  const metadataSheet = createOrClearSheet(spreadsheet, 'Metadata');

  // Apply metadata if available
  if (configData.metadata) {
    applyMetadataToSheet(metadataSheet, configData.metadata);
  }

  // Apply categories (presets) if available
  if (configData.presets && configData.presets.length > 0) {
    applyCategoriesFromMapeo(categoriesSheet, configData.presets, configData.icons);
  }

  // Apply details (fields) if available
  if (configData.fields && configData.fields.length > 0) {
    applyFieldsFromMapeo(detailsSheet, configData.fields);
  }
}

function handleFileImport(fileName: string, base64Data: string): { success: boolean; message: string } {
  try {
    // Validate file extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'comapeocat' && fileExtension !== 'mapeosettings') {
      throw new Error('Invalid file type. Please upload a .comapeocat or .mapeosettings file.');
    }

    // Process the file based on its type
    if (fileExtension === 'comapeocat') {
      // Call the global processImportedCategoryFile function
      return processImportedCategoryFile(fileName, base64Data);
    } else if (fileExtension === 'mapeosettings') {
      // Process the .mapeosettings file
      return processMapeoSettingsFile(fileName, base64Data);
    }

    throw new Error('Unsupported file type.');
  } catch (error) {
    console.error('Error importing file:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
