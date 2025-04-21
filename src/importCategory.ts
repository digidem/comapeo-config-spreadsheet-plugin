// Get the locale from the global variable
declare const locale: string;
import { importCategoryDialogTexts } from './text/dialog';

/**
 * Shows the import category dialog.
 */
function showImportCategoryDialog() {
  const title = importCategoryDialogTexts[locale].title;
  const htmlOutput = HtmlService.createHtmlOutput(createImportCategoryHtml())
    .setWidth(800)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, title);
}

/**
 * Creates the HTML for the import category dialog.
 */
function createImportCategoryHtml(): string {
  const title = importCategoryDialogTexts[locale].title;
  const messages = importCategoryDialogTexts[locale].message.map(msg => '<p>' + msg + '</p>').join('');
  const buttonText = importCategoryDialogTexts[locale].buttonText;

  return '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '  <base target="_top">' +
    '  <style>' +
    '    body {' +
    '      font-family: "Roboto", sans-serif;' +
    '      line-height: 1.6;' +
    '      color: #e0e0e0;' +
    '      background: linear-gradient(135deg, #1a1a1a, #2c2c2c);' +
    '      padding: 20px;' +
    '    }' +
    '    h1 {' +
    '      color: #6d44d9;' +
    '      font-size: 1.2em;' +
    '      margin-bottom: 20px;' +
    '      text-align: center;' +
    '    }' +
    '    p {' +
    '      margin-bottom: 15px;' +
    '      text-align: center;' +
    '    }' +
    '    .file-upload-container {' +
    '      margin: 20px 0;' +
    '      text-align: center;' +
    '    }' +
    '    .file-upload-label {' +
    '      display: inline-block;' +
    '      padding: 12px 20px;' +
    '      background: linear-gradient(45deg, #330B9E, #6d44d9);' +
    '      color: white;' +
    '      border-radius: 50px;' +
    '      cursor: pointer;' +
    '      transition: all 0.3s ease;' +
    '    }' +
    '    .file-upload-label:hover {' +
    '      background: linear-gradient(45deg, #4A0ED6, #8a67e8);' +
    '      transform: translateY(-2px);' +
    '    }' +
    '    .upload-icon {' +
    '      margin-right: 8px;' +
    '      font-size: 1.2em;' +
    '    }' +
    '    .file-info {' +
    '      margin: 15px 0;' +
    '      text-align: center;' +
    '    }' +
    '    .upload-status {' +
    '      margin: 15px 0;' +
    '      text-align: center;' +
    '    }' +
    '    .success {' +
    '      color: #4CAF50;' +
    '      font-weight: bold;' +
    '    }' +
    '    .error {' +
    '      color: #F44336;' +
    '      font-weight: bold;' +
    '    }' +
    '  </style>' +
    '</head>' +
    '<body>' +
    '  <h1>' + title + '</h1>' +
    '  ' + messages + '' +
    '  ' +
    '  <div class="file-upload-container">' +
    '    <label for="file" class="file-upload-label">' +
    '      <span class="upload-icon">📂</span>' +
    '      <span class="upload-text">' + buttonText + '</span>' +
    '    </label>' +
    '    <input type="file" id="file" name="file" accept=".comapeocat,.zip" style="display: none;" onchange="handleFileSelect()">' +
    '  </div>' +
    '  <div id="file-info" class="file-info"></div>' +
    '  <div id="upload-status" class="upload-status"></div>' +
    '  ' +
    '  <script>' +
    '    function handleFileSelect() {' +
    '      const fileInput = document.getElementById("file");' +
    '      const fileInfo = document.getElementById("file-info");' +
    '      const uploadStatus = document.getElementById("upload-status");' +
    '      ' +
    '      if (fileInput.files.length > 0) {' +
    '        const file = fileInput.files[0];' +
    '        fileInfo.innerHTML = "<p>Selected file: " + file.name + " (" + (file.size / 1024).toFixed(2) + " KB)</p>";' +
    '        uploadStatus.innerHTML = "<p>Processing file...</p>";' +
    '        ' +
    '        // Read the file and convert to base64' +
    '        const reader = new FileReader();' +
    '        reader.onload = function(e) {' +
    '          const base64data = e.target.result.split(",")[1];' +
    '          google.script.run' +
    '            .withSuccessHandler(onSuccess)' +
    '            .withFailureHandler(onFailure)' +
    '            .processImportedCategoryFile(file.name, base64data);' +
    '        };' +
    '        reader.readAsDataURL(file);' +
    '      }' +
    '    }' +
    '    ' +
    '    function onSuccess(result) {' +
    '      const uploadStatus = document.getElementById("upload-status");' +
    '      uploadStatus.innerHTML = "<p class=\"success\">File imported successfully!</p>";' +
    '      setTimeout(function() {' +
    '        google.script.host.close();' +
    '      }, 2000);' +
    '    }' +
    '    ' +
    '    function onFailure(error) {' +
    '      const uploadStatus = document.getElementById("upload-status");' +
    '      uploadStatus.innerHTML = "<p class=\"error\">Error: " + error.message + "</p>";' +
    '    }' +
    '  </script>' +
    '</body>' +
    '</html>';
}

/**
 * Processes an imported category file.
 * @param fileName - The name of the imported file
 * @param base64Data - The file content as base64 string
 * @returns Success message if import was successful
 */
function processImportedCategoryFile(fileName: string, base64Data: string): { success: boolean; message: string; details?: any } {
  try {
    console.log(`Starting import of file: ${fileName}`);

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

    // Look for the configuration files
    console.log('Extracting configuration data from files...');
    const configData = extractConfigurationData(extractionResult.files, extractionResult.tempFolder);
    console.log('Configuration data extracted:', {
      metadata: !!configData.metadata,
      presets: configData.presets.length,
      fields: configData.fields.length,
      icons: configData.icons.length,
      languages: Object.keys(configData.messages).length
    });

    // Apply the configuration data to the spreadsheet
    console.log('Applying configuration data to spreadsheet...');
    applyConfigurationToSpreadsheet(configData);
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
      message: 'Category file imported successfully',
      details: {
        presets: configData.presets.length,
        fields: configData.fields.length,
        icons: configData.icons.length,
        languages: Object.keys(configData.messages)
      }
    };
  } catch (error) {
    console.error('Error processing imported file:', error);

    // Get stack trace if available
    const stack = error instanceof Error && error.stack ? error.stack : 'No stack trace available';
    console.error('Stack trace:', stack);

    // Create a detailed error message
    let errorMessage = 'Error processing imported file: ' + (error instanceof Error ? error.message : String(error));

    return {
      success: false,
      message: errorMessage,
      details: {
        stage: 'processing',
        error: String(error),
        stack: stack
      }
    };
  }
}

/**
 * Extracts configuration data from unzipped files.
 * @param unzippedFiles - Array of unzipped file blobs
 * @param tempFolder - Temporary folder to save extracted files
 * @param options - Optional extraction options
 * @returns Configuration data object
 */
function extractConfigurationData(unzippedFiles: GoogleAppsScript.Base.Blob[], tempFolder: GoogleAppsScript.Drive.Folder, options?: any) {
  // Helper function to report progress
  const reportProgress = (stage: string, percent: number) => {
    if (options?.onProgress) {
      options.onProgress(stage, percent);
    }
  };

  // Initialize configuration data object
  const configData: any = {
    metadata: null,
    packageJson: null,
    presets: [],
    fields: [],
    messages: {},
    icons: []
  };

  reportProgress('Processing extracted files', 10);
  console.log(`Processing ${unzippedFiles.length} extracted files...`);

  // First pass: collect all JSON files to determine format
  const jsonFiles: { [key: string]: any } = {};
  const iconFiles: GoogleAppsScript.Base.Blob[] = [];

  unzippedFiles.forEach((file, index) => {
    const fileName = file.getName();
    const progress = 10 + Math.round((index / unzippedFiles.length) * 30); // 10-40%
    reportProgress(`Processing file ${index + 1}/${unzippedFiles.length}`, progress);

    try {
      if (fileName.endsWith('.json')) {
        const fileContent = file.getDataAsString();
        const jsonContent = JSON.parse(fileContent);
        jsonFiles[fileName] = jsonContent;
        console.log(`Parsed JSON file: ${fileName}`);
      } else if (fileName.endsWith('.svg') || fileName.endsWith('.png') ||
                fileName.includes('/icons/') || fileName.startsWith('icons/')) {
        iconFiles.push(file);
        console.log(`Found icon file: ${fileName}`);
      }
    } catch (error) {
      console.warn(`Error processing file ${fileName}:`, error);
      // Continue with other files even if one fails
    }
  });

  reportProgress('Analyzing configuration format', 40);
  console.log('Analyzing configuration format...');

  // Determine the configuration format and structure
  let configFormat = 'unknown';
  let combinedConfig: any = {};

  // Check for CoMapeo structure (separate files in directories)
  if (jsonFiles['metadata.json'] &&
      (Object.keys(jsonFiles).some(f => f.startsWith('presets/')) ||
       Object.keys(jsonFiles).some(f => f.startsWith('fields/')))) {
    configFormat = 'comapeo-directory';
    console.log('Detected CoMapeo directory structure');

    // Build combined config from directory structure
    combinedConfig.metadata = jsonFiles['metadata.json'];
    combinedConfig.packageJson = jsonFiles['package.json'];
    combinedConfig.presets = [];
    combinedConfig.fields = [];
    combinedConfig.messages = {};

    // Process presets
    Object.keys(jsonFiles)
      .filter(f => f.startsWith('presets/'))
      .forEach(f => combinedConfig.presets.push(jsonFiles[f]));

    // Process fields
    Object.keys(jsonFiles)
      .filter(f => f.startsWith('fields/'))
      .forEach(f => combinedConfig.fields.push(jsonFiles[f]));

    // Process messages
    Object.keys(jsonFiles)
      .filter(f => f.startsWith('messages/'))
      .forEach(f => {
        const langCode = f.replace('messages/', '').replace('.json', '');
        combinedConfig.messages[langCode] = jsonFiles[f];
      });
  }
  // Check for CoMapeo flat structure (presets.json, fields.json, etc.)
  else if (jsonFiles['metadata.json'] &&
           (jsonFiles['presets.json'] || jsonFiles['fields.json'] || jsonFiles['translations.json'])) {
    configFormat = 'comapeo-flat';
    console.log('Detected CoMapeo flat structure');

    // Build combined config from flat structure
    combinedConfig.metadata = jsonFiles['metadata.json'];
    combinedConfig.packageJson = jsonFiles['package.json'];

    // Process presets
    if (jsonFiles['presets.json']) {
      if (jsonFiles['presets.json'].presets) {
        if (typeof jsonFiles['presets.json'].presets === 'object' &&
            !Array.isArray(jsonFiles['presets.json'].presets)) {
          // Convert object to array
          combinedConfig.presets = Object.entries(jsonFiles['presets.json'].presets)
            .map(([id, preset]) => ({ id, ...preset }));
        } else {
          combinedConfig.presets = jsonFiles['presets.json'].presets;
        }
      } else {
        combinedConfig.presets = [];
      }
    } else {
      combinedConfig.presets = [];
    }

    // Process fields
    if (jsonFiles['fields.json']) {
      if (jsonFiles['fields.json'].fields) {
        if (typeof jsonFiles['fields.json'].fields === 'object' &&
            !Array.isArray(jsonFiles['fields.json'].fields)) {
          // Convert object to array
          combinedConfig.fields = Object.entries(jsonFiles['fields.json'].fields)
            .map(([id, field]) => ({ id, ...field }));
        } else {
          combinedConfig.fields = jsonFiles['fields.json'].fields;
        }
      } else {
        combinedConfig.fields = [];
      }
    } else {
      combinedConfig.fields = [];
    }

    // Process translations
    if (jsonFiles['translations.json']) {
      combinedConfig.messages = jsonFiles['translations.json'];
    } else {
      combinedConfig.messages = {};
    }
  }
  // Check for Mapeo structure (single JSON file with presets and fields as objects)
  else if (Object.keys(jsonFiles).length === 1) {
    const fileName = Object.keys(jsonFiles)[0];
    const content = jsonFiles[fileName];

    if (content.presets && typeof content.presets === 'object' &&
        content.fields && typeof content.fields === 'object') {
      configFormat = 'mapeo';
      console.log('Detected Mapeo structure in single file');
      combinedConfig = content;
    }
  }
  // If no structure detected, try to combine all JSON files
  else {
    console.log('No specific structure detected, combining all JSON files');
    combinedConfig = Object.values(jsonFiles).reduce((combined, current) => {
      return { ...combined, ...current };
    }, {});
  }

  reportProgress('Normalizing configuration', 70);
  console.log('Normalizing configuration...');

  // Process icons
  combinedConfig.icons = [];
  iconFiles.forEach((file, index) => {
    const fileName = file.getName();
    const iconFile = tempFolder.createFile(file);
    combinedConfig.icons.push({
      name: fileName.split('/').pop().replace(/\.[^/.]+$/, ''),
      svg: iconFile.getUrl()
    });
    console.log(`Processed icon file: ${fileName}`);
  });

  // Normalize the configuration to a consistent format
  const normalizedConfig = normalizeConfig(combinedConfig);

  reportProgress('Configuration normalized', 90);
  console.log('Configuration normalized successfully');

  // Convert normalized config back to the format expected by the rest of the code
  configData.metadata = normalizedConfig.metadata;
  configData.presets = normalizedConfig.presets;
  configData.fields = normalizedConfig.fields;
  configData.icons = normalizedConfig.icons;
  configData.messages = normalizedConfig.messages || {};

  // Generate package.json if not present
  if (!configData.packageJson && configData.metadata) {
    configData.packageJson = {
      name: configData.metadata.dataset_id || 'comapeo-config',
      version: configData.metadata.version || '1.0.0',
      description: `Configuration for ${configData.metadata.name || 'CoMapeo'}`,
      dependencies: {
        "mapeo-settings-builder": "^6.0.0"
      },
      scripts: {
        build: "mkdir -p build && mapeo-settings build -l 'en' -o build/${configData.metadata.dataset_id}-v${configData.metadata.version}.comapeocat",
        lint: "mapeo-settings lint"
      }
    };
  }

  reportProgress('Configuration extraction complete', 100);
  console.log('Configuration extraction complete');

  return configData;
}

/**
 * Normalizes configuration data to a consistent format
 * @param configData - The configuration data to normalize
 * @returns Normalized configuration data
 */
function normalizeConfig(configData: any): any {
  console.log(`Normalizing configuration...`);

  // Detect format based on structure
  const format = detectConfigFormat(configData);
  console.log(`Detected format: ${format}`);

  switch (format) {
    case 'comapeo':
      return normalizeCoMapeoConfig(configData);
    case 'mapeo':
      return normalizeMapeoConfig(configData);
    default:
      // For unknown formats, try to extract as much as possible
      console.warn('Attempting to normalize unknown format');
      return {
        metadata: extractMetadata(configData),
        fields: extractFields(configData),
        presets: extractPresets(configData),
        icons: configData.icons || []
      };
  }
}

/**
 * Detects the format of a configuration based on its structure
 * @param configData - The configuration data to analyze
 * @returns The detected format
 */
function detectConfigFormat(configData: any): string {
  console.log('Detecting configuration format...');

  // Check for empty or invalid data
  if (!configData) {
    console.warn('Empty configuration data');
    return 'unknown';
  }

  // Check for CoMapeo format indicators
  if (
    // Check for CoMapeo metadata structure
    (configData.metadata &&
     typeof configData.metadata.dataset_id === 'string' &&
     typeof configData.metadata.name === 'string') ||
    // Check for CoMapeo fields structure
    (Array.isArray(configData.fields) &&
     configData.fields.length > 0 &&
     configData.fields[0].tagKey) ||
    // Check for CoMapeo presets structure
    (Array.isArray(configData.presets) &&
     configData.presets.length > 0 &&
     configData.presets[0].geometry)
  ) {
    console.log('Detected CoMapeo format');
    return 'comapeo';
  }

  // Check for Mapeo format indicators
  if (
    // Check for Mapeo presets structure (object with preset IDs as keys)
    (configData.presets &&
     !Array.isArray(configData.presets) &&
     typeof configData.presets === 'object') ||
    // Check for Mapeo fields structure (object with field IDs as keys)
    (configData.fields &&
     !Array.isArray(configData.fields) &&
     typeof configData.fields === 'object') ||
    // Check for Mapeo metadata structure
    (configData.metadata &&
     typeof configData.metadata.name === 'string' &&
     !configData.metadata.dataset_id)
  ) {
    console.log('Detected Mapeo format');
    return 'mapeo';
  }

  console.warn('Unknown configuration format');
  return 'unknown';
}

/**
 * Normalizes a CoMapeo configuration
 * @param configData - CoMapeo configuration data
 * @returns Normalized configuration
 */
function normalizeCoMapeoConfig(configData: any): any {
  console.log('Normalizing CoMapeo configuration...');

  // CoMapeo format is already close to our normalized format
  return {
    metadata: configData.metadata || {},
    fields: Array.isArray(configData.fields)
      ? configData.fields.map(normalizeCoMapeoField)
      : [],
    presets: Array.isArray(configData.presets)
      ? configData.presets.map(normalizeCoMapeoPreset)
      : [],
    icons: configData.icons || [],
    messages: configData.messages
  };
}

/**
 * Normalizes a Mapeo configuration
 * @param configData - Mapeo configuration data
 * @returns Normalized configuration
 */
function normalizeMapeoConfig(configData: any): any {
  console.log('Normalizing Mapeo configuration...');

  // Convert Mapeo fields (object with keys) to array of normalized fields
  const fields: any[] = [];
  if (configData.fields && typeof configData.fields === 'object') {
    for (const fieldId in configData.fields) {
      if (configData.fields.hasOwnProperty(fieldId)) {
        const field = configData.fields[fieldId];
        fields.push(normalizeMapeoField(fieldId, field));
      }
    }
  }

  // Convert Mapeo presets (object with keys) to array of normalized presets
  const presets: any[] = [];
  if (configData.presets && typeof configData.presets === 'object') {
    for (const presetId in configData.presets) {
      if (configData.presets.hasOwnProperty(presetId)) {
        const preset = configData.presets[presetId];
        presets.push(normalizeMapeoPreset(presetId, preset));
      }
    }
  }

  return {
    metadata: normalizeMapeoMetadata(configData.metadata || {}),
    fields,
    presets,
    icons: configData.icons || []
  };
}

/**
 * Normalizes a CoMapeo field
 * @param field - CoMapeo field object
 * @returns Normalized field
 */
function normalizeCoMapeoField(field: any): any {
  return {
    id: field.tagKey || '',
    tagKey: field.tagKey || '',
    label: field.label || '',
    type: field.type || 'text',
    helperText: field.helperText || '',
    options: field.options || undefined,
    universal: field.universal || false
  };
}

/**
 * Normalizes a Mapeo field
 * @param fieldId - Field ID
 * @param field - Mapeo field object
 * @returns Normalized field
 */
function normalizeMapeoField(fieldId: string, field: any): any {
  // Convert Mapeo field type to CoMapeo field type
  let normalizedType = 'text';
  if (field.type) {
    switch (field.type.toLowerCase()) {
      case 'select_one':
        normalizedType = 'selectOne';
        break;
      case 'select_multiple':
        normalizedType = 'selectMultiple';
        break;
      case 'number':
        normalizedType = 'number';
        break;
      default:
        normalizedType = 'text';
    }
  }

  // Convert Mapeo options to CoMapeo options format
  let normalizedOptions;
  if (field.options) {
    if (Array.isArray(field.options)) {
      // If options is an array of strings
      normalizedOptions = field.options.map((opt: any) => {
        if (typeof opt === 'string') {
          return { label: opt, value: slugify(opt) };
        } else if (typeof opt === 'object' && opt.label) {
          return {
            label: opt.label,
            value: opt.value || slugify(opt.label)
          };
        }
        return null;
      }).filter(Boolean);
    } else if (typeof field.options === 'object') {
      // If options is an object with keys
      normalizedOptions = Object.entries(field.options).map(([key, value]) => ({
        label: typeof value === 'string' ? value : key,
        value: key
      }));
    }
  }

  return {
    id: fieldId,
    tagKey: fieldId,
    label: field.label || fieldId,
    type: normalizedType,
    helperText: field.placeholder || field.helperText || '',
    options: normalizedOptions,
    universal: field.universal || false
  };
}

/**
 * Normalizes a CoMapeo preset
 * @param preset - CoMapeo preset object
 * @returns Normalized preset
 */
function normalizeCoMapeoPreset(preset: any): any {
  return {
    id: preset.icon || '',
    name: preset.name || '',
    icon: preset.icon || '',
    color: preset.color || '#0000FF',
    fields: preset.fields || []
  };
}

/**
 * Normalizes a Mapeo preset
 * @param presetId - Preset ID
 * @param preset - Mapeo preset object
 * @returns Normalized preset
 */
function normalizeMapeoPreset(presetId: string, preset: any): any {
  return {
    id: presetId,
    name: preset.name || presetId,
    icon: preset.icon || presetId,
    color: preset.color || '#0000FF',
    fields: preset.fields || []
  };
}

/**
 * Normalizes Mapeo metadata to CoMapeo format
 * @param metadata - Mapeo metadata
 * @returns Normalized metadata
 */
function normalizeMapeoMetadata(metadata: any): any {
  // Create a dataset_id from the name if not present
  const name = metadata.name || 'mapeo-config';
  const dataset_id = metadata.dataset_id || `comapeo-${slugify(name)}`;

  return {
    dataset_id,
    name,
    version: metadata.version || new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    ...metadata // Include all other metadata properties
  };
}

/**
 * Extracts metadata from an unknown configuration format
 * @param configData - Configuration data
 * @returns Extracted metadata
 */
function extractMetadata(configData: any): any {
  const metadata: any = {
    dataset_id: 'unknown-config',
    name: 'Unknown Configuration',
    version: new Date().toISOString().slice(0, 10).replace(/-/g, '.')
  };

  // Try to extract metadata from various possible locations
  if (configData.metadata) {
    Object.assign(metadata, configData.metadata);
  }

  // Ensure required fields exist
  if (!metadata.dataset_id && metadata.name) {
    metadata.dataset_id = `comapeo-${slugify(metadata.name)}`;
  }

  return metadata;
}

/**
 * Extracts fields from an unknown configuration format
 * @param configData - Configuration data
 * @returns Extracted fields
 */
function extractFields(configData: any): any[] {
  const fields: any[] = [];

  // Try to extract fields from various possible locations
  if (Array.isArray(configData.fields)) {
    // Fields as array
    configData.fields.forEach((field: any) => {
      if (field) {
        fields.push({
          id: field.id || field.key || field.tagKey || '',
          tagKey: field.tagKey || field.key || field.id || '',
          label: field.label || '',
          type: field.type || 'text',
          helperText: field.helperText || field.placeholder || '',
          options: field.options
        });
      }
    });
  } else if (configData.fields && typeof configData.fields === 'object') {
    // Fields as object with keys
    for (const fieldId in configData.fields) {
      if (configData.fields.hasOwnProperty(fieldId)) {
        const field = configData.fields[fieldId];
        fields.push({
          id: fieldId,
          tagKey: fieldId,
          label: field.label || fieldId,
          type: field.type || 'text',
          helperText: field.helperText || field.placeholder || '',
          options: field.options
        });
      }
    }
  }

  return fields;
}

/**
 * Extracts presets from an unknown configuration format
 * @param configData - Configuration data
 * @returns Extracted presets
 */
function extractPresets(configData: any): any[] {
  const presets: any[] = [];

  // Try to extract presets from various possible locations
  if (Array.isArray(configData.presets)) {
    // Presets as array
    configData.presets.forEach((preset: any) => {
      if (preset) {
        presets.push({
          id: preset.id || preset.icon || '',
          name: preset.name || '',
          icon: preset.icon || '',
          color: preset.color || '#0000FF',
          fields: preset.fields || []
        });
      }
    });
  } else if (configData.presets && typeof configData.presets === 'object') {
    // Presets as object with keys
    for (const presetId in configData.presets) {
      if (configData.presets.hasOwnProperty(presetId)) {
        const preset = configData.presets[presetId];
        presets.push({
          id: presetId,
          name: preset.name || presetId,
          icon: preset.icon || presetId,
          color: preset.color || '#0000FF',
          fields: preset.fields || []
        });
      }
    }
  }

  return presets;
}

/**
 * Converts a string to a slug format.
 * @param input The input string to be converted.
 * @returns The slugified string.
 */
function slugify(input: any): string {
  const str = typeof input === 'string' ? input : String(input);
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Applies configuration data to the spreadsheet.
 * @param configData - Configuration data object
 */
function applyConfigurationToSpreadsheet(configData: any) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Create or clear necessary sheets
  createOrClearSheet(spreadsheet, 'Categories');
  createOrClearSheet(spreadsheet, 'Details');
  createOrClearSheet(spreadsheet, 'Metadata');

  // Apply metadata
  if (configData.metadata) {
    applyMetadata(spreadsheet, configData.metadata);
  }

  // Apply categories (presets)
  if (configData.presets && configData.presets.length > 0) {
    applyCategories(spreadsheet, configData.presets, configData.icons);
  }

  // Apply details (fields)
  if (configData.fields && configData.fields.length > 0) {
    applyFields(spreadsheet, configData.fields);
  }

  // Apply translations
  if (configData.messages && Object.keys(configData.messages).length > 0) {
    applyTranslations(spreadsheet, configData.messages, configData.presets, configData.fields);
  }
}

/**
 * Creates or clears a sheet in the spreadsheet.
 * @param spreadsheet - The active spreadsheet
 * @param sheetName - Name of the sheet to create or clear
 * @returns The sheet object
 */
function createOrClearSheet(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, sheetName: string): GoogleAppsScript.Spreadsheet.Sheet {
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    // Create the sheet if it doesn't exist
    sheet = spreadsheet.insertSheet(sheetName);
  } else {
    // Clear the sheet if it exists
    sheet.clear();
  }

  return sheet;
}

/**
 * Applies metadata to the Metadata sheet.
 * @param spreadsheet - The active spreadsheet
 * @param metadata - Metadata object
 */
function applyMetadata(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, metadata: any) {
  const sheet = spreadsheet.getSheetByName('Metadata');

  if (sheet) {
    // Set headers
    sheet.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold');

    // Add metadata rows
    const metadataRows = Object.entries(metadata).map(([key, value]) => [key, value]);
    if (metadataRows.length > 0) {
      sheet.getRange(2, 1, metadataRows.length, 2).setValues(metadataRows);
    }
  }
}

/**
 * Applies categories (presets) to the Categories sheet.
 * @param spreadsheet - The active spreadsheet
 * @param presets - Array of preset objects
 * @param icons - Array of icon objects
 */
function applyCategories(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, presets: any[], icons: any[]) {
  const sheet = spreadsheet.getSheetByName('Categories');

  if (sheet) {
    // Set headers (assuming English as primary language)
    sheet.getRange(1, 1, 1, 3).setValues([['English', 'Icons', 'Details']]);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');

    // Prepare category rows
    const categoryRows = presets.map(preset => {
      // Find matching icon
      const iconObj = icons.find(icon => icon.name === preset.icon);
      const iconUrl = iconObj ? iconObj.svg : '';

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
}

/**
 * Applies fields (details) to the Details sheet.
 * @param spreadsheet - The active spreadsheet
 * @param fields - Array of field objects
 */
function applyFields(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, fields: any[]) {
  const sheet = spreadsheet.getSheetByName('Details');

  if (sheet) {
    // Set headers
    sheet.getRange(1, 1, 1, 4).setValues([['Label', 'Helper Text', 'Type', 'Options']]);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');

    // Prepare field rows
    const fieldRows = fields.map(field => {
      // Convert field type to spreadsheet format
      let typeStr = 'text';
      if (field.type === 'selectOne') typeStr = 'select';
      if (field.type === 'selectMultiple') typeStr = 'multiple';
      if (field.type === 'number') typeStr = 'number';

      // Convert options to comma-separated string
      let optionsStr = '';
      if (field.options && field.options.length > 0) {
        optionsStr = field.options.map((opt: any) => opt.label).join(', ');
      }

      return [field.label, field.helperText || '', typeStr, optionsStr];
    });

    // Add field rows
    if (fieldRows.length > 0) {
      sheet.getRange(2, 1, fieldRows.length, 4).setValues(fieldRows);
    }
  }
}

/**
 * Applies translations to the translation sheets.
 * @param spreadsheet - The active spreadsheet
 * @param messages - Messages object with translations
 * @param presets - Array of preset objects
 * @param fields - Array of field objects
 */
function applyTranslations(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, messages: any, presets: any[], fields: any[]) {
  // Get language codes (excluding primary language)
  const langCodes = Object.keys(messages);

  if (langCodes.length === 0) return;

  // Create translation sheets if they don't exist
  const translationSheets = [
    'Category Translations',
    'Detail Label Translations',
    'Detail Helper Text Translations',
    'Detail Option Translations'
  ];

  translationSheets.forEach(sheetName => {
    createOrClearSheet(spreadsheet, sheetName);
  });

  // Apply category translations
  const categorySheet = spreadsheet.getSheetByName('Category Translations');
  if (categorySheet) {
    // Set headers
    const headers = ['English', ...langCodes];
    categorySheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    categorySheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

    // Prepare category translation rows
    const categoryRows = presets.map(preset => {
      const row = [preset.name];

      // Add translations for each language
      langCodes.forEach(langCode => {
        const langMessages = messages[langCode];
        const translationKey = 'presets.' + preset.icon + '.name';
        const translation = langMessages[translationKey] ? langMessages[translationKey].message : '';
        row.push(translation);
      });

      return row;
    });

    // Add category translation rows
    if (categoryRows.length > 0) {
      categorySheet.getRange(2, 1, categoryRows.length, headers.length).setValues(categoryRows);
    }
  }

  // Apply detail label translations
  const labelSheet = spreadsheet.getSheetByName('Detail Label Translations');
  if (labelSheet) {
    // Set headers
    const headers = ['English', ...langCodes];
    labelSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    labelSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

    // Prepare label translation rows
    const labelRows = fields.map(field => {
      const row = [field.label];

      // Add translations for each language
      langCodes.forEach(langCode => {
        const langMessages = messages[langCode];
        const translationKey = 'fields.' + field.tagKey + '.label';
        const translation = langMessages[translationKey] ? langMessages[translationKey].message : '';
        row.push(translation);
      });

      return row;
    });

    // Add label translation rows
    if (labelRows.length > 0) {
      labelSheet.getRange(2, 1, labelRows.length, headers.length).setValues(labelRows);
    }
  }

  // Apply helper text translations
  const helperSheet = spreadsheet.getSheetByName('Detail Helper Text Translations');
  if (helperSheet) {
    // Set headers
    const headers = ['English', ...langCodes];
    helperSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    helperSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

    // Prepare helper text translation rows
    const helperRows = fields.filter(field => field.helperText).map(field => {
      const row = [field.helperText];

      // Add translations for each language
      langCodes.forEach(langCode => {
        const langMessages = messages[langCode];
        const translationKey = 'fields.' + field.tagKey + '.helperText';
        const translation = langMessages[translationKey] ? langMessages[translationKey].message : '';
        row.push(translation);
      });

      return row;
    });

    // Add helper text translation rows
    if (helperRows.length > 0) {
      helperSheet.getRange(2, 1, helperRows.length, headers.length).setValues(helperRows);
    }
  }

  // Apply option translations
  const optionSheet = spreadsheet.getSheetByName('Detail Option Translations');
  if (optionSheet) {
    // Set headers
    const headers = ['English', ...langCodes];
    optionSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    optionSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

    // Collect all options from all fields
    const allOptions = [];
    fields.forEach(field => {
      if (field.options && field.options.length > 0) {
        field.options.forEach((option: any) => {
          allOptions.push({
            label: option.label,
            value: option.value,
            fieldTagKey: field.tagKey
          });
        });
      }
    });

    // Prepare option translation rows
    const optionRows = allOptions.map(option => {
      const row = [option.label];

      // Add translations for each language
      langCodes.forEach(langCode => {
        const langMessages = messages[langCode];
        const translationKey = 'fields.' + option.fieldTagKey + '.options.' + option.value;
        const translation = langMessages[translationKey] ? langMessages[translationKey].message : '';
        row.push(translation);
      });

      return row;
    });

    // Add option translation rows
    if (optionRows.length > 0) {
      optionSheet.getRange(2, 1, optionRows.length, headers.length).setValues(optionRows);
    }
  }
}
