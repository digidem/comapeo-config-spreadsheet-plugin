/**
 * CoMapeo Config Import Service v2.0.0
 * Handles importing .comapeocat files and populating spreadsheet
 */

/**
 * Prompts user to select a .comapeocat file and imports it
 */
function importCoMapeoCatFile(): void {
  const ui = SpreadsheetApp.getUi();

  // Show file picker dialog
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      input { margin: 10px 0; }
      button { padding: 10px 20px; background: #4285f4; color: white; border: none; cursor: pointer; border-radius: 4px; }
      button:hover { background: #3367d6; }
      .info { color: #666; font-size: 12px; margin-top: 10px; }
    </style>
    <p>Enter the Google Drive file ID or URL of the .comapeocat file:</p>
    <input type="text" id="fileInput" style="width: 100%; padding: 8px;" placeholder="File ID or Drive URL">
    <br><br>
    <button onclick="submitFile()">Import</button>
    <p class="info">You can find the file ID in the Drive URL: drive.google.com/file/d/<b>FILE_ID</b>/view</p>
    <script>
      function submitFile() {
        const input = document.getElementById('fileInput').value.trim();
        google.script.run.withSuccessHandler(function() {
          google.script.host.close();
        }).withFailureHandler(function(error) {
          alert('Error: ' + error.message);
        }).processImportFile(input);
      }
    </script>
  `)
    .setWidth(450)
    .setHeight(200);

  ui.showModalDialog(html, 'Import CoMapeo Category');
}

/**
 * Processes the import file from user input
 */
function processImportFile(fileIdOrUrl: string): void {
  const fileId = extractFileId(fileIdOrUrl);

  if (!fileId) {
    throw new Error('Invalid file ID or URL. Please provide a valid Google Drive file ID or URL.');
  }

  try {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const content = extractConfigFromComapeocat(blob);
    populateSpreadsheetFromConfig(content);

    SpreadsheetApp.getUi().alert(
      'Import Successful',
      'The configuration has been imported. Please review the Categories and Details sheets.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    throw new Error(`Failed to import file: ${error.message}`);
  }
}

/**
 * Extracts file ID from a Drive URL or returns the ID if already provided
 */
function extractFileId(input: string): string | null {
  if (!input) return null;

  // Check if it's already a file ID (alphanumeric with hyphens/underscores)
  if (/^[\w-]+$/.test(input) && input.length > 10) {
    return input;
  }

  // Extract from various Google Drive URL formats
  const patterns = [
    /\/file\/d\/([^\/]+)/,
    /id=([^&]+)/,
    /\/d\/([^\/]+)/
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extracts configuration JSON from a .comapeocat file
 * .comapeocat files are ZIP archives containing config.json
 */
function extractConfigFromComapeocat(blob: GoogleAppsScript.Base.Blob): BuildRequest {
  const bytes = blob.getBytes();

  // Check ZIP signature
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
    // Try parsing as raw JSON (for backwards compatibility)
    try {
      return JSON.parse(blob.getDataAsString());
    } catch {
      throw new Error('Invalid .comapeocat file format');
    }
  }

  // Unzip and find config.json
  const unzipped = Utilities.unzip(blob);

  for (const file of unzipped) {
    const name = file.getName();
    if (name === 'config.json' || name.endsWith('/config.json')) {
      const content = file.getDataAsString();
      return JSON.parse(content);
    }
  }

  // Try to find any JSON file with the expected structure
  for (const file of unzipped) {
    if (file.getName().endsWith('.json')) {
      try {
        const content = JSON.parse(file.getDataAsString());
        if (content.metadata && content.categories !== undefined) {
          return content;
        }
      } catch {
        continue;
      }
    }
  }

  throw new Error('Could not find configuration data in .comapeocat file');
}

/**
 * Populates the spreadsheet with imported configuration data
 */
function populateSpreadsheetFromConfig(config: BuildRequest): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Set category selection from imported order
  if (config.categories) {
    setCategorySelection(config.categories.map(c => c.id));
  }

  // Populate Categories sheet
  populateCategoriesSheet(spreadsheet, config.categories || []);

  // Populate Details sheet
  populateDetailsSheet(spreadsheet, config.fields || []);

  // Populate Metadata sheet
  populateMetadataSheet(spreadsheet, config.metadata);

  // Populate translations if present
  if (config.translations) {
    populateTranslationSheets(spreadsheet, config);
  }
}

/**
 * Populates the Categories sheet
 */
function populateCategoriesSheet(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, categories: Category[]): void {
  let sheet = spreadsheet.getSheetByName('Categories');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('Categories');
    sheet.getRange(1, 1, 1, 4).setValues([['Name', 'Icon', 'Fields', 'Color']]).setFontWeight('bold');
  } else {
    // Clear existing data (keep header)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 4).clear();
    }
  }

  if (categories.length === 0) return;

  const rows: any[][] = [];
  const colors: string[] = [];

  for (const cat of categories) {
    const iconValue = cat.iconId || '';
    const fieldsValue = cat.defaultFieldIds?.join(', ') || '';
    rows.push([cat.name, iconValue, fieldsValue, cat.color || '']);
    colors.push(cat.color || '#FFFFFF');
  }

  sheet.getRange(2, 1, rows.length, 4).setValues(rows);

  // Set background colors
  const bgColors = colors.map(c => [c]);
  sheet.getRange(2, 1, colors.length, 1).setBackgrounds(bgColors);
}

/**
 * Populates the Details sheet
 */
function populateDetailsSheet(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, fields: Field[]): void {
  let sheet = spreadsheet.getSheetByName('Details');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('Details');
    sheet.getRange(1, 1, 1, 6).setValues([['Name', 'Helper Text', 'Type', 'Options', '', 'Universal']]).setFontWeight('bold');
  } else {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 6).clear();
    }
  }

  if (fields.length === 0) return;

  const rows: any[][] = [];

  for (const field of fields) {
    const typeChar = mapFieldTypeToChar(field.type);
    const optionsValue = field.options?.map(o => o.label).join(', ') || '';
    rows.push([
      field.name,
      field.description || '',
      typeChar,
      optionsValue,
      '',
      field.required ? 'TRUE' : 'FALSE'
    ]);
  }

  sheet.getRange(2, 1, rows.length, 6).setValues(rows);
}

/**
 * Maps API field type to spreadsheet type character
 */
function mapFieldTypeToChar(type: FieldType): string {
  switch (type) {
    case 'text':
    case 'textarea':
      return 't';
    case 'number':
    case 'integer':
      return 'n';
    case 'multiselect':
      return 'm';
    case 'select':
    default:
      return 's';
  }
}

/**
 * Populates the Metadata sheet
 */
function populateMetadataSheet(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, metadata: Metadata): void {
  let sheet = spreadsheet.getSheetByName('Metadata');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('Metadata');
    sheet.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]).setFontWeight('bold');
  } else {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 2).clear();
    }
  }

  const rows = [
    ['name', metadata.name],
    ['version', metadata.version],
    ['description', metadata.description || '']
  ];

  sheet.getRange(2, 1, rows.length, 2).setValues(rows);
}

/**
 * Populates translation sheets from imported config
 */
function populateTranslationSheets(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, config: BuildRequest): void {
  if (!config.translations) return;

  const locales = Object.keys(config.translations);
  if (locales.length === 0) return;

  // Create Category Translations sheet
  let catSheet = spreadsheet.getSheetByName('Category Translations');
  if (!catSheet) {
    catSheet = spreadsheet.insertSheet('Category Translations');
  }

  const catHeaders = ['Name', 'Original', 'ID', ...locales.map(l => `Translation - ${l}`)];
  catSheet.getRange(1, 1, 1, catHeaders.length).setValues([catHeaders]).setFontWeight('bold');

  if (config.categories && config.categories.length > 0) {
    const catRows: any[][] = [];
    for (const cat of config.categories) {
      const row = [cat.name, cat.name, cat.id];
      for (const locale of locales) {
        const trans = config.translations[locale]?.categories?.[cat.id]?.name || '';
        row.push(trans);
      }
      catRows.push(row);
    }
    if (catRows.length > 0) {
      catSheet.getRange(2, 1, catRows.length, catHeaders.length).setValues(catRows);
    }
  }

  // Create Detail Label Translations sheet
  let labelSheet = spreadsheet.getSheetByName('Detail Label Translations');
  if (!labelSheet) {
    labelSheet = spreadsheet.insertSheet('Detail Label Translations');
  }

  const labelHeaders = ['Name', 'Original', ...locales.map(l => `Translation - ${l}`)];
  labelSheet.getRange(1, 1, 1, labelHeaders.length).setValues([labelHeaders]).setFontWeight('bold');

  if (config.fields && config.fields.length > 0) {
    const labelRows: any[][] = [];
    for (const field of config.fields) {
      const row = [field.name, field.name];
      for (const locale of locales) {
        const trans = config.translations[locale]?.fields?.[field.id]?.name || '';
        row.push(trans);
      }
      labelRows.push(row);
    }
    if (labelRows.length > 0) {
      labelSheet.getRange(2, 1, labelRows.length, labelHeaders.length).setValues(labelRows);
    }
  }
}
