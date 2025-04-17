// Get the locale from the global variable
declare const locale: string;
import { importCategoryDialogTexts } from './text/dialog';

/**
 * Shows the import category dialog.
 */
export function showImportCategoryDialog() {
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
export function processImportedCategoryFile(fileName: string, base64Data: string) {
  try {
    // Decode the base64 data
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'application/octet-stream', fileName);

    // Create a temporary folder in Drive to extract the file
    const tempFolder = DriveApp.createFolder('CoMapeo_Import_Temp_' + new Date().getTime());

    // Save the blob to the temp folder
    tempFolder.createFile(blob);

    // Process the file based on its extension
    if (fileName.endsWith('.comapeocat') || fileName.endsWith('.zip')) {
      // Extract the zip file
      const unzippedFiles = Utilities.unzip(blob);

      // Look for the configuration files
      const configData = extractConfigurationData(unzippedFiles, tempFolder);

      // Apply the configuration data to the spreadsheet
      applyConfigurationToSpreadsheet(configData);

      // Clean up the temporary folder
      tempFolder.setTrashed(true);

      // Return success
      return { success: true, message: 'Category file imported successfully' };
    } else {
      throw new Error('Unsupported file format. Please upload a .comapeocat or .zip file.');
    }
  } catch (error) {
    console.error('Error processing imported file:', error);
    throw error;
  }
}

/**
 * Extracts configuration data from unzipped files.
 * @param unzippedFiles - Array of unzipped file blobs
 * @param tempFolder - Temporary folder to save extracted files
 * @returns Configuration data object
 */
function extractConfigurationData(unzippedFiles: GoogleAppsScript.Base.Blob[], tempFolder: GoogleAppsScript.Drive.Folder) {
  // Initialize configuration data object
  const configData: any = {
    metadata: null,
    packageJson: null,
    presets: [],
    fields: [],
    messages: {},
    icons: []
  };

  // Process each unzipped file
  for (const file of unzippedFiles) {
    const fileName = file.getName();
    const fileContent = file.getDataAsString();

    try {
      // Parse JSON content
      const jsonContent = JSON.parse(fileContent);

      // Determine file type and add to appropriate section of configData
      if (fileName === 'metadata.json') {
        configData.metadata = jsonContent;
      } else if (fileName === 'package.json') {
        configData.packageJson = jsonContent;
      } else if (fileName.startsWith('presets/')) {
        configData.presets.push(jsonContent);
      } else if (fileName.startsWith('fields/')) {
        configData.fields.push(jsonContent);
      } else if (fileName.startsWith('messages/')) {
        const langCode = fileName.replace('messages/', '').replace('.json', '');
        configData.messages[langCode] = jsonContent;
      } else if (fileName.startsWith('icons/')) {
        // Save icon file to temp folder and get URL
        const iconFile = tempFolder.createFile(file);
        configData.icons.push({
          name: fileName.replace('icons/', '').replace(/\.\w+$/, ''),
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
