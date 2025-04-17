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

          // Call the Google Apps Script function to process the file
          google.script.run
            .withSuccessHandler(onSuccess)
            .withFailureHandler(onFailure)
            .processImportedCategoryFile(file.name, base64data);

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
      // TODO: Implement processing for .mapeosettings files
      throw new Error('Processing .mapeosettings files is not yet implemented.');
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
