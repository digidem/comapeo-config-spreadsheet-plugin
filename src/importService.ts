/**
 * CoMapeo Config Import Service v2.0.0
 * Handles importing .comapeocat files and populating spreadsheet
 */

// =============================================================================
// Constants
// =============================================================================

/** Minimum valid file size for .comapeocat files (bytes) */
const MIN_COMAPEOCAT_SIZE = 100;

/** Maximum file size to prevent memory issues (10MB) */
const MAX_COMAPEOCAT_SIZE = 10 * 1024 * 1024;

/** ZIP file signature bytes */
const ZIP_SIGNATURE = [0x50, 0x4B, 0x03, 0x04];

// =============================================================================
// Main Import Functions
// =============================================================================

/**
 * Prompts user to select a .comapeocat file and imports it
 */
function importCoMapeoCatFile(): void {
  const ui = SpreadsheetApp.getUi();

  // Show file picker dialog with sanitized HTML
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      input { margin: 10px 0; }
      button { padding: 10px 20px; background: #4285f4; color: white; border: none; cursor: pointer; border-radius: 4px; }
      button:hover { background: #3367d6; }
      button:disabled { background: #ccc; cursor: not-allowed; }
      .info { color: #666; font-size: 12px; margin-top: 10px; }
      .error { color: #d93025; font-size: 12px; margin-top: 5px; display: none; }
    </style>
    <p>Enter the Google Drive file ID or URL of the .comapeocat file:</p>
    <input type="text" id="fileInput" style="width: 100%; padding: 8px;" placeholder="File ID or Drive URL">
    <p class="error" id="errorMsg"></p>
    <br>
    <button id="submitBtn" onclick="submitFile()">Import</button>
    <p class="info">You can find the file ID in the Drive URL: drive.google.com/file/d/<b>FILE_ID</b>/view</p>
    <script>
      function submitFile() {
        var input = document.getElementById('fileInput').value.trim();
        var errorMsg = document.getElementById('errorMsg');
        var submitBtn = document.getElementById('submitBtn');

        // Basic client-side validation
        if (!input) {
          errorMsg.textContent = 'Please enter a file ID or URL';
          errorMsg.style.display = 'block';
          return;
        }

        errorMsg.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Importing...';

        google.script.run
          .withSuccessHandler(function() {
            google.script.host.close();
          })
          .withFailureHandler(function(error) {
            errorMsg.textContent = 'Error: ' + (error.message || error);
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Import';
          })
          .processImportFile(input);
      }

      // Allow Enter key to submit
      document.getElementById('fileInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') submitFile();
      });
    </script>
  `)
    .setWidth(450)
    .setHeight(220);

  ui.showModalDialog(html, 'Import CoMapeo Category');
}

/**
 * Processes the import file from user input
 * @param fileIdOrUrl - Google Drive file ID or URL
 */
function processImportFile(fileIdOrUrl: string): void {
  // Validate input
  if (!fileIdOrUrl || typeof fileIdOrUrl !== 'string') {
    throw new Error('Please provide a valid file ID or URL.');
  }

  const trimmedInput = fileIdOrUrl.trim();
  if (trimmedInput.length === 0) {
    throw new Error('Please provide a valid file ID or URL.');
  }

  const fileId = extractFileId(trimmedInput);

  if (!fileId) {
    throw new Error('Invalid file ID or URL format. Please provide a valid Google Drive file ID or URL.');
  }

  // Validate file ID format (alphanumeric with hyphens/underscores)
  if (!/^[\w-]+$/.test(fileId)) {
    throw new Error('Invalid file ID format.');
  }

  let file: GoogleAppsScript.Drive.File;
  try {
    file = DriveApp.getFileById(fileId);
  } catch (e) {
    throw new Error('Could not access file. Please check the file ID and ensure you have permission to access it.');
  }

  // Validate file size
  const fileSize = file.getSize();
  if (fileSize < MIN_COMAPEOCAT_SIZE) {
    throw new Error('File is too small to be a valid .comapeocat file.');
  }
  if (fileSize > MAX_COMAPEOCAT_SIZE) {
    throw new Error('File is too large (max 10MB).');
  }

  let blob: GoogleAppsScript.Base.Blob;
  try {
    blob = file.getBlob();
  } catch (e) {
    throw new Error('Could not read file contents. The file may be corrupted or inaccessible.');
  }

  const content = extractConfigFromComapeocat(blob);

  // Validate extracted content
  validateBuildRequest(content);

  populateSpreadsheetFromConfig(content);

  SpreadsheetApp.getUi().alert(
    'Import Successful',
    'The configuration has been imported. Please review the Categories and Details sheets.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Validates that a BuildRequest has required fields
 */
function validateBuildRequest(content: BuildRequest): void {
  if (!content) {
    throw new Error('Invalid configuration: empty content.');
  }

  if (!content.metadata) {
    throw new Error('Invalid configuration: missing metadata.');
  }

  if (!content.metadata.name || typeof content.metadata.name !== 'string') {
    throw new Error('Invalid configuration: missing or invalid metadata.name.');
  }

  if (!content.metadata.version || typeof content.metadata.version !== 'string') {
    throw new Error('Invalid configuration: missing or invalid metadata.version.');
  }

  if (!Array.isArray(content.categories)) {
    throw new Error('Invalid configuration: categories must be an array.');
  }

  if (!Array.isArray(content.fields)) {
    throw new Error('Invalid configuration: fields must be an array.');
  }
}

/**
 * Extracts file ID from a Drive URL or returns the ID if already provided
 */
function extractFileId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  // Check if it's already a file ID (alphanumeric with hyphens/underscores, reasonable length)
  if (/^[\w-]{10,100}$/.test(trimmed)) {
    return trimmed;
  }

  // Extract from various Google Drive URL formats
  const patterns = [
    /\/file\/d\/([^\/\?]+)/,   // /file/d/FILE_ID
    /[?&]id=([^&]+)/,          // ?id=FILE_ID or &id=FILE_ID
    /\/d\/([^\/\?]+)/,         // /d/FILE_ID
    /\/open\?id=([^&]+)/       // /open?id=FILE_ID
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const extractedId = match[1].trim();
      // Validate extracted ID format
      if (/^[\w-]{10,100}$/.test(extractedId)) {
        return extractedId;
      }
    }
  }

  return null;
}

// =============================================================================
// File Parsing
// =============================================================================

/**
 * Extracts configuration JSON from a .comapeocat file
 * .comapeocat files are ZIP archives containing configuration data
 */
function extractConfigFromComapeocat(blob: GoogleAppsScript.Base.Blob): BuildRequest {
  if (!blob) {
    throw new Error('Invalid file: no data.');
  }

  let bytes: number[];
  try {
    bytes = blob.getBytes();
  } catch (e) {
    throw new Error('Could not read file bytes.');
  }

  if (!bytes || bytes.length < MIN_COMAPEOCAT_SIZE) {
    throw new Error('File is too small or empty.');
  }

  // Check for ZIP signature (PK\x03\x04)
  const isZip = bytes.length >= 4 &&
    bytes[0] === ZIP_SIGNATURE[0] &&
    bytes[1] === ZIP_SIGNATURE[1] &&
    bytes[2] === ZIP_SIGNATURE[2] &&
    bytes[3] === ZIP_SIGNATURE[3];

  if (!isZip) {
    // Try parsing as raw JSON (for backwards compatibility or direct JSON export)
    return parseAsJson(blob);
  }

  // Unzip and find configuration
  return parseAsZip(blob);
}

/**
 * Attempts to parse blob as raw JSON
 */
function parseAsJson(blob: GoogleAppsScript.Base.Blob): BuildRequest {
  let jsonStr: string;
  try {
    jsonStr = blob.getDataAsString('UTF-8');
  } catch (e) {
    throw new Error('Could not read file as text.');
  }

  if (!jsonStr || jsonStr.trim().length === 0) {
    throw new Error('File is empty.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error('Invalid file format: not a valid JSON or ZIP file.');
  }

  // Validate it has expected structure
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON: expected an object.');
  }

  if (!parsed.metadata || !Array.isArray(parsed.categories)) {
    throw new Error('Invalid configuration structure: missing metadata or categories.');
  }

  return parsed as BuildRequest;
}

/**
 * Parses a ZIP blob to extract configuration
 */
function parseAsZip(blob: GoogleAppsScript.Base.Blob): BuildRequest {
  let unzipped: GoogleAppsScript.Base.Blob[];
  try {
    unzipped = Utilities.unzip(blob);
  } catch (e) {
    throw new Error('Could not unzip file. The file may be corrupted.');
  }

  if (!unzipped || unzipped.length === 0) {
    throw new Error('ZIP file is empty.');
  }

  // Look for config.json first
  for (const file of unzipped) {
    const name = file.getName();
    if (name === 'config.json' || name.endsWith('/config.json')) {
      return parseJsonFile(file, name);
    }
  }

  // Try to find any JSON file with the expected structure
  for (const file of unzipped) {
    const name = file.getName();
    if (name.endsWith('.json')) {
      try {
        const content = parseJsonFile(file, name);
        if (content.metadata && Array.isArray(content.categories)) {
          return content;
        }
      } catch {
        // Continue to next file
        continue;
      }
    }
  }

  throw new Error('Could not find configuration data in .comapeocat file. Expected config.json or similar.');
}

/**
 * Parses a single JSON file from the ZIP
 */
function parseJsonFile(file: GoogleAppsScript.Base.Blob, fileName: string): BuildRequest {
  let content: string;
  try {
    content = file.getDataAsString('UTF-8');
  } catch (e) {
    throw new Error(`Could not read ${fileName}.`);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON in ${fileName}.`);
  }

  return parsed as BuildRequest;
}

// =============================================================================
// Spreadsheet Population
// =============================================================================

/**
 * Populates the spreadsheet with imported configuration data
 */
function populateSpreadsheetFromConfig(config: BuildRequest): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('No active spreadsheet found.');
  }

  // Set category selection from imported order
  if (config.categories && config.categories.length > 0) {
    setCategorySelection(config.categories.map(c => c.id));
  }

  // Populate sheets in order
  populateCategoriesSheet(spreadsheet, config.categories || []);
  populateDetailsSheet(spreadsheet, config.fields || []);
  populateMetadataSheet(spreadsheet, config.metadata);

  // Populate translations if present
  if (config.translations && Object.keys(config.translations).length > 0) {
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

  if (!categories || categories.length === 0) return;

  const rows: any[][] = [];
  const colors: string[] = [];

  for (const cat of categories) {
    if (!cat || !cat.name) continue;

    const iconValue = cat.iconId || '';
    const fieldsValue = Array.isArray(cat.defaultFieldIds) ? cat.defaultFieldIds.join(', ') : '';
    const colorValue = cat.color || '#FFFFFF';

    rows.push([cat.name, iconValue, fieldsValue, colorValue]);
    colors.push(colorValue);
  }

  if (rows.length === 0) return;

  sheet.getRange(2, 1, rows.length, 4).setValues(rows);

  // Set background colors for column A
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

  if (!fields || fields.length === 0) return;

  const rows: any[][] = [];

  for (const field of fields) {
    if (!field || !field.name) continue;

    const typeChar = mapFieldTypeToChar(field.type);
    const optionsValue = Array.isArray(field.options)
      ? field.options.map(o => o?.label || '').filter(Boolean).join(', ')
      : '';

    rows.push([
      field.name,
      field.description || '',
      typeChar,
      optionsValue,
      '',
      field.required ? 'TRUE' : 'FALSE'
    ]);
  }

  if (rows.length === 0) return;

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
  if (!metadata) return;

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
    ['name', metadata.name || ''],
    ['version', metadata.version || ''],
    ['description', metadata.description || '']
  ];

  sheet.getRange(2, 1, rows.length, 2).setValues(rows);
}

/**
 * Populates translation sheets from imported config
 */
function populateTranslationSheets(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, config: BuildRequest): void {
  if (!config.translations) return;

  const locales = Object.keys(config.translations).filter(Boolean);
  if (locales.length === 0) return;

  // Create Category Translations sheet
  let catSheet = spreadsheet.getSheetByName('Category Translations');
  if (!catSheet) {
    catSheet = spreadsheet.insertSheet('Category Translations');
  } else {
    const lastRow = catSheet.getLastRow();
    if (lastRow > 1) {
      catSheet.getRange(2, 1, lastRow - 1, catSheet.getLastColumn() || 1).clear();
    }
  }

  const catHeaders = ['Name', ...locales.map(l => `${l}`)];
  catSheet.getRange(1, 1, 1, catHeaders.length).setValues([catHeaders]).setFontWeight('bold');

  if (config.categories && config.categories.length > 0) {
    const catRows: any[][] = [];
    for (const cat of config.categories) {
      if (!cat || !cat.id) continue;
      const row = [cat.name || ''];
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
  } else {
    const lastRow = labelSheet.getLastRow();
    if (lastRow > 1) {
      labelSheet.getRange(2, 1, lastRow - 1, labelSheet.getLastColumn() || 1).clear();
    }
  }

  const labelHeaders = ['Name', ...locales.map(l => `${l}`)];
  labelSheet.getRange(1, 1, 1, labelHeaders.length).setValues([labelHeaders]).setFontWeight('bold');

  if (config.fields && config.fields.length > 0) {
    const labelRows: any[][] = [];
    for (const field of config.fields) {
      if (!field || !field.id) continue;
      const row = [field.name || ''];
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
