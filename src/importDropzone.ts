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
    acceptedFileTypes: ['.comapeocat', '.mapeosettings', '.zip', '.tar'],
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
      font-weight: bold;
    }
    .success-message {
      color: #34a853;
      font-weight: bold;
    }
    .info-message {
      color: #4285f4;
    }
    .warning-message {
      color: #fbbc05;
      font-weight: bold;
    }
    .browse-button {
      margin-top: 15px;
      padding: 8px 16px;
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    .browse-button:hover {
      background-color: #1a73e8;
    }
  </style>
</head>
<body>
  <div class="container" onclick="if(event.target.id === 'dropzone' || event.target.closest('#dropzone')) handleDropzoneClick(event);">
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

    <div id="dropzone" class="dropzone" onclick="handleDropzoneClick(event)">
      <div class="dropzone-icon" onclick="handleDropzoneClick(event)">📁</div>
      <div class="dropzone-text" onclick="handleDropzoneClick(event)">Drag and drop your file here</div>
      <div class="dropzone-subtext" onclick="handleDropzoneClick(event)">or click to browse files</div>
      <div class="dropzone-subtext" onclick="handleDropzoneClick(event)">Accepted file types: .comapeocat, .mapeosettings, .zip, .tar</div>
      <button class="browse-button" onclick="document.getElementById('file-input').click(); return false;">Browse Files</button>
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

    // Global click handler for dropzone
    function handleDropzoneClick(e) {
      console.log('Dropzone clicked (global handler)');
      document.getElementById('file-input').click();
      return false;
    }

    // Wait for DOM to be fully loaded
    window.onload = function() {
      // DOM elements
      const dropzone = document.getElementById('dropzone');
      const fileInput = document.getElementById('file-input');
      const progressContainer = document.getElementById('progress-container');
      const progress = document.getElementById('progress');
      const statusMessage = document.getElementById('status-message');
      const confirmationDialog = document.getElementById('confirmation-dialog');
      const btnCancel = document.getElementById('btn-cancel');
      const btnConfirm = document.getElementById('btn-confirm');

      console.log('DOM elements initialized');

      // Multiple click handlers for dropzone to ensure at least one works
      // Method 1: Direct onclick property
      dropzone.onclick = function(e) {
        console.log('Dropzone clicked (onclick property)');
        if (e.target === dropzone) {
          fileInput.click();
        }
      };

      // Method 2: addEventListener
      dropzone.addEventListener('click', function(e) {
        console.log('Dropzone clicked (addEventListener)');
        if (e.target === dropzone) {
          fileInput.click();
        }
      });

      // Method 3: Direct click handlers on child elements
      const dropzoneIcon = document.querySelector('.dropzone-icon');
      const dropzoneText = document.querySelector('.dropzone-text');
      const dropzoneSubtext = document.querySelectorAll('.dropzone-subtext');

      if (dropzoneIcon) {
        dropzoneIcon.onclick = function(e) {
          console.log('Dropzone icon clicked');
          e.preventDefault();
          e.stopPropagation();
          fileInput.click();
        };
      }

      if (dropzoneText) {
        dropzoneText.onclick = function(e) {
          console.log('Dropzone text clicked');
          e.preventDefault();
          e.stopPropagation();
          fileInput.click();
        };
      }

      dropzoneSubtext.forEach(function(element) {
        element.onclick = function(e) {
          console.log('Dropzone subtext clicked');
          e.preventDefault();
          e.stopPropagation();
          fileInput.click();
        };
      });

      // Method 4: Attach the global handler
      dropzone.setAttribute('onclick', 'handleDropzoneClick(event)');

      // Make sure the dropzone is actually clickable
      dropzone.style.cursor = 'pointer';

      // Drag and drop handlers
      dropzone.ondragover = function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      };

      dropzone.ondragleave = function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      };

      dropzone.ondrop = function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
          processFile(files[0]);
        }
      };

      // File input change handler
      fileInput.onchange = function(e) {
        const files = e.target.files;
        if (files.length > 0) {
          processFile(files[0]);
        }
      };

      // Cancel button handler
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
          showError('Invalid file type. Please upload a .comapeocat, .mapeosettings, .zip, or .tar file.');
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

        // Confirm button handler
        btnConfirm.onclick = function() {
          // Hide confirmation dialog
          confirmationDialog.classList.remove('visible');

          // Show progress
          progressContainer.style.display = 'block';
          updateProgress(10);
          updateStatus('Reading file...', 'info');

          // Set a timeout to show a message if processing takes too long
          const processingTimeout = setTimeout(() => {
            updateStatus('Still processing... This may take a few minutes for large files.', 'info');
          }, 10000); // 10 seconds

          // Read the file
          const reader = new FileReader();

          reader.onload = function(e) {
            updateProgress(50);
            updateStatus('Processing file...', 'info');

            try {
              const base64data = e.target.result.split(',')[1];

              // Call the appropriate Google Apps Script function based on file extension
              const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
              updateStatus(`Extracting ${fileExtension} file...`, 'info');

              // Set a longer timeout for server processing
              const serverTimeout = setTimeout(() => {
                updateStatus('Server is still processing the file. This may take several minutes for large files...', 'info');

                // Add another timeout for very long operations
                setTimeout(() => {
                  updateStatus('Processing is taking longer than expected. Please be patient...', 'warning');
                }, 30000); // 30 seconds more
              }, 20000); // 20 seconds

              // Success handler with timeout clearing
              const successHandler = function(result) {
                clearTimeout(processingTimeout);
                clearTimeout(serverTimeout);
                onSuccess(result);
              };

              // Failure handler with timeout clearing
              const failureHandler = function(error) {
                clearTimeout(processingTimeout);
                clearTimeout(serverTimeout);
                onFailure(error);
              };

              if (fileExtension === 'comapeocat' || fileExtension === 'zip') {
                google.script.run
                  .withSuccessHandler(successHandler)
                  .withFailureHandler(failureHandler)
                  .processImportedCategoryFile(selectedFile.name, base64data);
              } else if (fileExtension === 'mapeosettings' || fileExtension === 'tar') {
                google.script.run
                  .withSuccessHandler(successHandler)
                  .withFailureHandler(failureHandler)
                  .processMapeoSettingsFile(selectedFile.name, base64data);
              } else {
                clearTimeout(processingTimeout);
                onFailure(new Error('Unsupported file type'));
              }

              updateProgress(75);
              updateStatus('Waiting for server response...', 'info');
            } catch (error) {
              clearTimeout(processingTimeout);
              onFailure(error);
            }
          };

          reader.onerror = function() {
            clearTimeout(processingTimeout);
            onFailure(new Error('Error reading file'));
          };

          reader.readAsDataURL(selectedFile);
        };
      }

      // Update status message with type (info, warning, error, success)
      function updateStatus(message, type = 'info') {
        // Clear previous status classes
        statusMessage.classList.remove('info-message', 'warning-message', 'error-message', 'success-message');

        // Add appropriate class based on type
        statusMessage.classList.add(`${type}-message`);

        // Update message content
        statusMessage.innerHTML = message;

        // Log to console for debugging
        console.log(`[${type}] ${message}`);
      }

      // Handle successful import
      function onSuccess(result) {
        if (result && result.success) {
          updateProgress(100);
          dropzone.classList.add('success');

          // Log details for debugging
          console.log('Import successful:', result);

          // Create a detailed success message if details are available
          let successMessage = result.message || 'File imported successfully!';

          if (result.details) {
            // Add details to the success message
            const details = result.details;
            let detailsMessage = '<br><br><strong>Imported:</strong><ul>';

            if (details.presets) {
              detailsMessage += `<li>${details.presets} categories</li>`;
            }

            if (details.fields) {
              detailsMessage += `<li>${details.fields} detail fields</li>`;
            }

            if (details.icons) {
              detailsMessage += `<li>${details.icons} icons</li>`;
            }

            if (details.languages && Array.isArray(details.languages)) {
              detailsMessage += `<li>${details.languages.length} languages: ${details.languages.join(', ')}</li>`;
            }

            detailsMessage += '</ul>';
            successMessage += detailsMessage;
          }

          updateStatus(successMessage, 'success');

          // Close the dialog after a delay
          setTimeout(() => {
            google.script.host.close();
          }, 5000); // Longer delay to allow reading the details
        } else {
          // Handle server-side validation errors
          console.warn('Server returned error:', result);

          // Create a detailed error message if details are available
          let errorMessage = result && result.message ? result.message : 'Import failed';

          if (result && result.details) {
            const details = result.details;
            if (details.stage) {
              errorMessage += `<br><br>Failed during: <strong>${details.stage}</strong>`;
            }

            if (details.errors && Array.isArray(details.errors)) {
              errorMessage += '<br><br><strong>Errors:</strong><ul>';
              details.errors.forEach(err => {
                errorMessage += `<li>${err}</li>`;
              });
              errorMessage += '</ul>';
            }
          }

          onFailure({
            message: errorMessage
          });
        }
      }

      // Handle import failure
      function onFailure(error) {
        dropzone.classList.add('error');

        // Format error message - handle multi-line errors
        const errorMsg = error.message || 'Failed to import file';

        // Log the error for debugging
        console.error('Import failed:', error);

        // Replace newlines with HTML line breaks
        updateStatus('Error: ' + errorMsg.replace(/\\n/g, '<br>'), 'error');
        updateProgress(0);
      }

      // Show error message
      function showError(message) {
        dropzone.classList.add('error');
        updateStatus(message, 'error');
        console.error('Validation error:', message);
      }

      // Update progress bar
      function updateProgress(percent) {
        progress.style.width = percent + '%';
      }

      // Reset UI
      function resetUI() {
        dropzone.classList.remove('error', 'success', 'dragover');
        statusMessage.innerHTML = '';
        statusMessage.classList.remove('error-message', 'success-message', 'info-message', 'warning-message');
        updateProgress(0);
      }
    };
  </script>
</body>
</html>`;
}

/**
 * Processes a .mapeosettings file (classic Mapeo configuration)
 * @param fileName - Name of the uploaded file
 * @param base64Data - Base64 encoded file data
 * @returns Result of the import operation
 */
function processMapeoSettingsFile(fileName: string, base64Data: string): { success: boolean; message: string; details?: any } {
  try {
    console.log(`Starting import of Mapeo settings file: ${fileName}`);

    // Decode the base64 data
    console.log('Decoding base64 data...');
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'application/octet-stream', fileName);
    console.log(`Decoded file size: ${blob.getBytes().length} bytes`);

    // Extract and validate the file
    console.log('Extracting and validating file...');
    const extractionResult = extractAndValidateFile(fileName, blob);

    if (!extractionResult.success) {
      // Return the error message
      console.error('Extraction failed:', extractionResult.message, extractionResult.validationErrors);
      return {
        success: false,
        message: extractionResult.message + (extractionResult.validationErrors ?
          '\n- ' + extractionResult.validationErrors.join('\n- ') : ''),
        details: {
          stage: 'extraction',
          errors: extractionResult.validationErrors
        }
      };
    }

    // If we have warnings, log them but continue
    if (extractionResult.validationWarnings && extractionResult.validationWarnings.length > 0) {
      console.log('Validation warnings:', extractionResult.validationWarnings);
    }

    // Process the extracted files
    console.log('Extracting Mapeo configuration data from files...');
    const configData = extractMapeoConfigurationData(extractionResult.files, extractionResult.tempFolder);
    console.log('Configuration data extracted');

    // Apply the configuration data to the spreadsheet
    console.log('Applying configuration data to spreadsheet...');
    applyMapeoConfigurationToSpreadsheet(configData);
    console.log('Configuration data applied to spreadsheet successfully');

    // Clean up the temporary folder
    if (extractionResult.tempFolder) {
      console.log('Cleaning up temporary resources...');
      cleanupTempResources(extractionResult.tempFolder);
    }

    // Return success with details
    console.log('Import completed successfully');
    return {
      success: true,
      message: 'Mapeo settings file imported successfully',
      details: {
        metadata: !!configData.metadata,
        presets: configData.presets ? Object.keys(configData.presets).length : 0,
        fields: configData.fields ? Object.keys(configData.fields).length : 0,
        icons: configData.icons ? configData.icons.length : 0
      }
    };
  } catch (error) {
    console.error('Error processing Mapeo settings file:', error);

    // Get stack trace if available
    const stack = error instanceof Error && error.stack ? error.stack : 'No stack trace available';
    console.error('Stack trace:', stack);

    return {
      success: false,
      message: 'Error processing Mapeo settings file: ' + (error instanceof Error ? error.message : String(error)),
      details: {
        stage: 'processing',
        error: String(error),
        stack: stack
      }
    };
  }
}
