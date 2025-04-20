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
    <div id="dropzone" class="dropzone">
      <div class="dropzone-icon">📁</div>
      <div class="dropzone-text">Drag and drop your file here</div>
      <div class="dropzone-subtext">or click to browse files</div>
      <div class="dropzone-subtext">Accepted file types: .comapeocat, .mapeosettings</div>
      <input type="file" id="file-input" class="file-input" accept=".comapeocat,.mapeosettings">
      <div class="progress-container" id="progress-container">
        <div class="progress-bar">
          <div class="progress" id="progress"></div>
        </div>
      </div>
    </div>
    <div id="status-message" class="status-message"></div>
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

    // Add event listeners
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', handleDragOver);
    dropzone.addEventListener('dragleave', handleDragLeave);
    dropzone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Handle drag over event
    function handleDragOver(e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    }

    // Handle drag leave event
    function handleDragLeave(e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    }

    // Handle drop event
    function handleDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    }

    // Handle file selection
    function handleFileSelect(e) {
      const files = e.target.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    }

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
          const fileExtension = file.name.split('.').pop().toLowerCase();

          if (fileExtension === 'comapeocat' || fileExtension === 'zip') {
            google.script.run
              .withSuccessHandler(onSuccess)
              .withFailureHandler(onFailure)
              .processImportedCategoryFile(file.name, base64data);
          } else if (fileExtension === 'mapeosettings') {
            google.script.run
              .withSuccessHandler(onSuccess)
              .withFailureHandler(onFailure)
              .processMapeoSettingsFile(file.name, base64data);
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

      reader.readAsDataURL(file);
    }

    // Handle successful import
    function onSuccess(result) {
      updateProgress(100);
      dropzone.classList.add('success');
      statusMessage.textContent = 'File imported successfully!';
      statusMessage.classList.add('success-message');

      // Close the dialog after a delay
      setTimeout(() => {
        google.script.host.close();
      }, 2000);
    }

    // Handle import failure
    function onFailure(error) {
      dropzone.classList.add('error');
      statusMessage.textContent = 'Error: ' + (error.message || 'Failed to import file');
      statusMessage.classList.add('error-message');
      updateProgress(0);
    }

    // Show error message
    function showError(message) {
      dropzone.classList.add('error');
      statusMessage.textContent = message;
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

    // Create a temporary folder in Drive to extract the file
    const tempFolder = DriveApp.createFolder('Mapeo_Settings_Import_' + new Date().getTime());

    // Save the blob to the temp folder
    const file = tempFolder.createFile(blob);

    // Extract the tar file (mapeosettings is a tar file)
    // Note: Google Apps Script doesn't have built-in tar extraction
    // We'll need to use a workaround or external library

    try {
      // Try to extract using a custom function or service
      const extractedFiles = extractTarFile(blob, tempFolder);

      // Look for the configuration files
      const configData = extractMapeoConfigurationData(extractedFiles, tempFolder);

      // Apply the configuration data to the spreadsheet
      applyMapeoConfigurationToSpreadsheet(configData);

      // Clean up the temporary folder
      tempFolder.setTrashed(true);

      // Return success
      return {
        success: true,
        message: 'Mapeo settings file imported successfully'
      };
    } catch (extractError) {
      console.error('Error extracting tar file:', extractError);

      // If extraction fails, try to parse it directly
      const fileContent = blob.getDataAsString();
      let jsonData;

      try {
        jsonData = JSON.parse(fileContent);

        // Process the JSON data
        applyMapeoJsonConfigToSpreadsheet(jsonData);

        // Clean up
        tempFolder.setTrashed(true);

        return {
          success: true,
          message: 'Mapeo settings file imported successfully'
        };
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        throw new Error('Could not parse the Mapeo settings file. The file may be corrupted.');
      }
    }
  } catch (error) {
    console.error('Error processing Mapeo settings file:', error);
    throw error;
  }
}

/**
 * Extracts a tar file (workaround since GAS doesn't support tar extraction natively)
 * @param blob - The tar file blob
 * @param folder - The folder to extract to
 * @returns Array of extracted file blobs
 */
function extractTarFile(blob: GoogleAppsScript.Base.Blob, folder: GoogleAppsScript.Drive.Folder): GoogleAppsScript.Base.Blob[] {
  // This is a placeholder. In a real implementation, you would:
  // 1. Either use an external service to extract the tar
  // 2. Or implement a JavaScript tar extractor
  // 3. Or convert the tar to a zip file first

  // For now, we'll throw an error that will be caught and handled
  throw new Error('TAR extraction not implemented');
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
