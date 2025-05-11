// Global function declarations
declare const locale: string;

// External function declarations
declare function createOrClearSheet(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  sheetName: string,
): GoogleAppsScript.Spreadsheet.Sheet;
declare function processImportedCategoryFile(
  fileName: string,
  base64Data: string,
): { success: boolean; message: string; details?: any };
declare function extractConfigurationData(
  extractedFiles: GoogleAppsScript.Base.Blob[],
  tempFolder: GoogleAppsScript.Drive.Folder,
): any;
declare function normalizeConfig(jsonData: any): any;
declare function applyConfigurationToSpreadsheet(config: any): void;

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
    .setTitle("Import Configuration File");

  SpreadsheetApp.getUi().showModalDialog(
    htmlOutput,
    "Import Configuration File",
  );
}

/**
 * Creates the HTML for the dropzone dialog
 */
function createDropzoneHtml(): string {
  const dropzoneOptions: DropzoneOptions = {
    acceptedFileTypes: [".comapeocat", ".mapeosettings"],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
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
      height: 8px;
      background-color: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }
    .progress {
      height: 100%;
      background-color: #4285f4;
      width: 0%;
      transition: width 0.3s ease;
      position: relative;
    }

    .progress::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        -45deg,
        rgba(255, 255, 255, 0.2) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.2) 50%,
        rgba(255, 255, 255, 0.2) 75%,
        transparent 75%
      );
      background-size: 16px 16px;
      animation: progress-animation 1s linear infinite;
      z-index: 1;
    }

    @keyframes progress-animation {
      0% {
        background-position: 0 0;
      }
      100% {
        background-position: 16px 0;
      }
    }
    .status-message {
      margin-top: 10px;
      font-size: 14px;
      text-align: center;
      min-height: 20px;
    }
    .error-message {
      color: #ea4335;
      margin-bottom: 15px;
    }
    .success-message {
      color: #34a853;
    }
    .details-text {
      font-size: 12px;
      color: #5f6368;
      display: block;
      margin-top: 5px;
    }
    .error-details {
      margin-top: 10px;
      font-size: 13px;
      text-align: left;
      background-color: #fce8e6;
      border-radius: 4px;
      padding: 10px;
    }
    .error-details ul {
      margin: 5px 0;
      padding-left: 20px;
    }
    .error-stage {
      font-style: italic;
      margin-top: 8px;
      font-size: 12px;
    }
    .warnings-container {
      margin-top: 10px;
      font-size: 13px;
      text-align: left;
      background-color: #fff3e0;
      border-radius: 4px;
      padding: 10px;
      color: #e65100;
    }
    .warnings-container ul {
      margin: 5px 0;
      padding-left: 20px;
    }
    .retry-button, .view-button, .cancel-button {
      display: inline-block;
      margin: 15px 5px 0;
      padding: 8px 16px;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    }
    .retry-button {
      background-color: #4285f4;
    }
    .view-button {
      background-color: #34a853;
    }
    .cancel-button {
      background-color: #ea4335;
    }
    .retry-button:hover, .view-button:hover, .cancel-button:hover {
      box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
      transform: translateY(-1px);
    }
    .retry-button:hover {
      background-color: #1a73e8;
    }
    .view-button:hover {
      background-color: #2d9348;
    }
    .cancel-button:hover {
      background-color: #d33426;
    }
    .warning-message {
      background-color: #fff3e0;
      border-left: 4px solid #ff9800;
      padding: 12px;
      margin-bottom: 15px;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Import Configuration File</h1>
    <div class="warning-message">
      <strong>Warning:</strong> Importing a configuration file will erase all current spreadsheet data. This action cannot be undone.
    </div>
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
    // @ts-nocheck - This is client-side JavaScript code that will be embedded in HTML
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
        updateProgress(20);
        statusMessage.innerHTML = 'Processing file...<br><span class="details-text">Preparing to extract file contents</span>';

        try {
          const base64data = e.target.result.toString().split(',')[1];

          // Call the appropriate Google Apps Script function based on file extension
          const fileExtension = file.name.toString().split('.').pop().toLowerCase();

          // Create a progress handler function
          const progressHandler = function(progressData) {
            try {
              if (progressData && typeof progressData === 'object') {
                // Update progress bar
                if (progressData.percent !== undefined) {
                  updateProgress(20 + Math.round(progressData.percent * 0.8)); // Scale to 20-100%
                }

                // Update status message
                if (progressData.stage) {
                  let statusHtml = 'Processing: ' + progressData.stage;

                  // Add details if available
                  if (progressData.detail) {
                    statusHtml += '<br><span class="details-text">' + progressData.detail + '</span>';
                  }

                  // Add counts if available
                  if (progressData.counts) {
                    const countsArray = [];
                    for (const key in progressData.counts) {
                      if (progressData.counts[key]) {
                        countsArray.push(progressData.counts[key] + ' ' + key);
                      }
                    }
                    if (countsArray.length > 0) {
                      statusHtml += '<br><span class="details-text">Found: ' + countsArray.join(', ') + '</span>';
                    }
                  }

                  statusMessage.innerHTML = statusHtml;
                }
              }
            } catch (e) {
              console.error('Error in progress handler:', e);
            }
          };

          // @ts-ignore - file is defined in the JavaScript context
          if (fileExtension === 'comapeocat' || fileExtension === 'zip') {
            google.script.run
              .withSuccessHandler(onSuccess)
              .withFailureHandler(onFailure)
              .withUserObject({ fileName: file.name })
              .processImportedCategoryFileWithProgress(file.name, base64data, progressHandler);
          } else if (fileExtension === 'mapeosettings') {
            google.script.run
              .withSuccessHandler(onSuccess)
              .withFailureHandler(onFailure)
              .withUserObject({ fileName: file.name })
              .processMapeoSettingsFileWithProgress(file.name, base64data, progressHandler);
          } else {
            onFailure(new Error('Unsupported file type'));
          }
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
    function onSuccess(result, userObject) {
      updateProgress(100);
      dropzone.classList.add('success');

      // Display success message with details if available
      let successMessage = 'File imported successfully!';
      if (userObject && userObject.fileName) {
        successMessage = 'File "' + userObject.fileName + '" imported successfully!';
      }

      if (result && result.details) {
        const details = result.details;
        const detailsText = [];

        if (details.presets) detailsText.push(details.presets + ' categories');
        if (details.fields) detailsText.push(details.fields + ' details');
        if (details.icons) detailsText.push(details.icons + ' icons');
        if (details.languages) {
          const langCount = Array.isArray(details.languages) ?
            details.languages.length :
            (typeof details.languages === 'object' ? Object.keys(details.languages).length : 0);

          if (langCount > 0) {
            detailsText.push(langCount + ' languages');
          }
        }

        if (detailsText.length > 0) {
          successMessage += '<br><span class="details-text">Imported: ' + detailsText.join(', ') + '</span>';
        }

        // Add processing time if available
        if (details.processingTime) {
          const seconds = (details.processingTime / 1000).toFixed(2);
          successMessage += '<br><span class="details-text">Processing time: ' + seconds + ' seconds</span>';
        }
      }

      statusMessage.innerHTML = successMessage;
      statusMessage.classList.add('success-message');

      // Show warnings if any
      if (result && result.warnings && result.warnings.length > 0) {
        const warningsContainer = document.createElement('div');
        warningsContainer.className = 'warnings-container';
        warningsContainer.innerHTML = '<strong>Warnings:</strong><ul>' +
          result.warnings.map(function(w) { return '<li>' + (w.userMessage || w) + '</li>'; }).join('') +
          '</ul>';
        statusMessage.appendChild(warningsContainer);
      }

      // Add a "View Spreadsheet" button
      const viewButton = document.createElement('button');
      viewButton.className = 'view-button';
      viewButton.textContent = 'View Spreadsheet';
      viewButton.onclick = function() {
        google.script.host.close();
      };
      statusMessage.appendChild(viewButton);

      // Close the dialog automatically after a longer delay
      setTimeout(() => {
        google.script.host.close();
      }, 5000);
    }

    // Handle import failure
    function onFailure(error, userObject) {
      dropzone.classList.add('error');
      updateProgress(0);

      // Create detailed error message
      let errorMessage = 'Error importing file';
      if (userObject && userObject.fileName) {
        errorMessage = 'Error importing file "' + userObject.fileName + '"';
      }

      if (error) {
        if (typeof error === 'string') {
          errorMessage += ': ' + error;
        } else if (error.message) {
          errorMessage += ': ' + error.message;
        }
      }

      statusMessage.innerHTML = errorMessage;
      statusMessage.classList.add('error-message');

      // Add more details if available
      if (error && error.details) {
        const errorDetails = document.createElement('div');
        errorDetails.className = 'error-details';

        // If there are specific errors in the details
        if (error.details.errors && error.details.errors.length > 0) {
          const errorList = document.createElement('ul');
          error.details.errors.forEach(err => {
            const li = document.createElement('li');
            li.textContent = err.userMessage || err;
            errorList.appendChild(li);
          });
          errorDetails.appendChild(errorList);
        }

        // If there's a stage indication
        if (error.details.stage) {
          const stagePara = document.createElement('p');
          stagePara.className = 'error-stage';
          stagePara.textContent = 'Error occurred during: ' + error.details.stage;
          errorDetails.appendChild(stagePara);
        }

        statusMessage.appendChild(errorDetails);
      }

      // Add a retry button
      const retryButton = document.createElement('button');
      retryButton.className = 'retry-button';
      retryButton.textContent = 'Try Again';
      retryButton.onclick = function() {
        resetUI();
      };
      statusMessage.appendChild(retryButton);

      // Add a cancel button
      const cancelButton = document.createElement('button');
      cancelButton.className = 'cancel-button';
      cancelButton.textContent = 'Cancel';
      cancelButton.onclick = function() {
        google.script.host.close();
      };
      statusMessage.appendChild(cancelButton);
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
function processMapeoSettingsFile(
  fileName: string,
  base64Data: string,
): { success: boolean; message: string } {
  try {
    console.log(`Starting import of Mapeo settings file: ${fileName}`);

    // Decode the base64 data
    console.log("Decoding base64 data...");
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      "application/octet-stream",
      fileName,
    );
    console.log(`Decoded file size: ${blob.getBytes().length} bytes`);

    // Create a temporary folder in Drive to extract the file
    console.log("Creating temporary folder...");
    const tempFolder = DriveApp.createFolder(
      "Mapeo_Settings_Import_" + new Date().getTime(),
    );

    // Save the blob to the temp folder
    const file = tempFolder.createFile(blob);
    console.log(`Saved file to temp folder: ${file.getName()}`);

    // Extract the tar file (mapeosettings is a tar file)
    // Note: Google Apps Script doesn't have built-in tar extraction
    // We'll need to use a workaround or external library

    try {
      // Try to extract using a custom function or service
      console.log("Attempting to extract file...");
      const extractedFiles = extractTarFile(blob, tempFolder);
      console.log(`Extracted ${extractedFiles.length} files`);

      // Look for the configuration files
      console.log("Extracting configuration data...");
      const configData = extractMapeoConfigurationData(
        extractedFiles,
        tempFolder,
      );
      console.log("Configuration data extracted successfully");

      // Apply the configuration data to the spreadsheet
      console.log("Applying configuration to spreadsheet...");
      applyMapeoConfigurationToSpreadsheet(configData);
      console.log("Configuration applied successfully");

      // Clean up the temporary folder
      console.log("Cleaning up temporary resources...");
      tempFolder.setTrashed(true);

      // Return success
      console.log("Import completed successfully");
      return {
        success: true,
        message: "Mapeo settings file imported successfully",
      };
    } catch (extractError) {
      console.error("Error extracting tar file:", extractError);

      // If extraction fails, try to parse it directly
      console.log("Attempting to parse file as JSON...");
      const fileContent = blob.getDataAsString();
      let jsonData: any;

      try {
        jsonData = JSON.parse(fileContent);
        console.log("Successfully parsed file as JSON");

        // Process the JSON data
        console.log("Applying JSON configuration to spreadsheet...");
        applyMapeoJsonConfigToSpreadsheet(jsonData);
        console.log("Configuration applied successfully");

        // Clean up
        console.log("Cleaning up temporary resources...");
        tempFolder.setTrashed(true);

        console.log("Import completed successfully");
        return {
          success: true,
          message: "Mapeo settings file imported successfully",
        };
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        throw new Error(
          `Could not parse the Mapeo settings file. The file may be corrupted.`,
        );
      }
    }
  } catch (error) {
    console.error("Error processing Mapeo settings file:", error);
    throw error;
  }
}

/**
 * Extracts configuration data from Mapeo settings files
 * @param extractedFiles - Array of extracted file blobs
 * @param tempFolder - Temporary folder containing the files
 * @returns Configuration data object
 */
function extractMapeoConfigurationData(
  extractedFiles: GoogleAppsScript.Base.Blob[],
  tempFolder: GoogleAppsScript.Drive.Folder,
): any {
  // Use the extractConfigurationData function from importCategory.ts
  // This will automatically detect and normalize the format
  return extractConfigurationData(extractedFiles, tempFolder);
}

/**
 * Applies Mapeo JSON configuration directly to the spreadsheet
 * @param jsonData - The parsed JSON data from the Mapeo settings file
 */
function applyMapeoJsonConfigToSpreadsheet(jsonData: any): void {
  // Normalize the configuration data
  const normalizedConfig = normalizeConfig(jsonData);

  // Apply the normalized configuration to the spreadsheet
  applyConfigurationToSpreadsheet({
    metadata: normalizedConfig.metadata,
    presets: normalizedConfig.presets,
    fields: normalizedConfig.fields,
    icons: normalizedConfig.icons || [],
    messages: normalizedConfig.messages || {},
  });
}

/**
 * Applies metadata to the metadata sheet
 * @param sheet - The metadata sheet
 * @param metadata - Metadata object
 */
function applyMetadataToSheet(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  metadata: any,
): void {
  // Set headers
  sheet.getRange(1, 1, 1, 2).setValues([["Key", "Value"]]);
  sheet.getRange(1, 1, 1, 2).setFontWeight("bold");

  // Add metadata rows
  const metadataRows = Object.entries(metadata).map(([key, value]) => [
    key,
    value,
  ]);
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
function applyCategoriesFromMapeo(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  presets: any[],
  icons: any[],
): void {
  // Set headers
  sheet.getRange(1, 1, 1, 3).setValues([["English", "Icons", "Details"]]);
  sheet.getRange(1, 1, 1, 3).setFontWeight("bold");

  // Prepare category rows
  const categoryRows = presets.map((preset) => {
    // Find matching icon
    const iconObj = icons.find((icon) => icon.id === preset.icon);
    const iconUrl = iconObj ? iconObj.url : "";

    // Get fields as comma-separated string
    const fields = preset.fields ? preset.fields.join(", ") : "";

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
function applyFieldsFromMapeo(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  fields: any[],
): void {
  // Set headers
  sheet
    .getRange(1, 1, 1, 4)
    .setValues([["Label", "Helper Text", "Type", "Options"]]);
  sheet.getRange(1, 1, 1, 4).setFontWeight("bold");

  // Prepare field rows
  const fieldRows = fields.map((field) => {
    // Convert field type to spreadsheet format
    let typeStr = "text";
    if (field.type === "select") typeStr = "select";
    if (field.type === "multiselect") typeStr = "multiple";
    if (field.type === "number") typeStr = "number";

    // Convert options to comma-separated string
    let optionsStr = "";
    if (field.options && field.options.length > 0) {
      optionsStr = field.options
        .map((opt: any) => opt.label || opt.value)
        .join(", ");
    }

    return [field.label, field.helperText || "", typeStr, optionsStr];
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
  // Normalize the configuration data
  const normalizedConfig = normalizeConfig(configData);

  // Apply the normalized configuration to the spreadsheet
  applyConfigurationToSpreadsheet({
    metadata: normalizedConfig.metadata,
    presets: normalizedConfig.presets,
    fields: normalizedConfig.fields,
    icons: normalizedConfig.icons || [],
    messages: normalizedConfig.messages || {},
  });
}

function handleFileImport(
  fileName: string,
  base64Data: string,
): { success: boolean; message: string } {
  try {
    // Validate file extension
    const fileExtension = fileName.toString().split(".").pop()?.toLowerCase();
    if (fileExtension !== "comapeocat" && fileExtension !== "mapeosettings") {
      throw new Error(
        `Invalid file type. Please upload a .comapeocat or .mapeosettings file.`,
      );
    }

    // Process the file based on its type
    if (fileExtension === "comapeocat") {
      // Call the global processImportedCategoryFile function
      return processImportedCategoryFile(fileName, base64Data);
    } else if (fileExtension === "mapeosettings") {
      // Process the .mapeosettings file
      return processMapeoSettingsFile(fileName, base64Data);
    }

    throw new Error(`Unsupported file type.`);
  } catch (error) {
    console.error("Error importing file:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
