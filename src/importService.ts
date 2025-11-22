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
 * Builds a lookup map from icon ID to icon data (svgData or svgUrl)
 * This allows us to persist actual icon content when importing categories
 */
function buildIconMap(icons?: Icon[]): Map<string, string> {
  const map = new Map<string, string>();

  if (!icons || !Array.isArray(icons)) return map;

  for (const icon of icons) {
    if (!icon || !icon.id) continue;

    // Prefer svgData (inline SVG), fall back to svgUrl
    if (icon.svgData) {
      // If it's raw SVG, convert to data URI for storage
      if (icon.svgData.startsWith('<svg')) {
        map.set(icon.id, `data:image/svg+xml,${encodeURIComponent(icon.svgData)}`);
      } else {
        map.set(icon.id, icon.svgData);
      }
    } else if (icon.svgUrl) {
      map.set(icon.id, icon.svgUrl);
    }
  }

  return map;
}

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

  // Identify universal fields (fields that appear in ALL categories)
  const universalFieldIds = identifyUniversalFields(config.categories || [], config.fields || []);

  // Build icon lookup map for populating categories with actual icon data
  const iconMap = buildIconMap(config.icons);

  // Populate sheets in order
  populateCategoriesSheet(spreadsheet, config.categories || [], iconMap, config.fields, universalFieldIds);
  populateDetailsSheet(spreadsheet, config.fields || [], universalFieldIds);
  populateMetadataSheet(spreadsheet, config.metadata);
  populateIconsSheet(spreadsheet, config.icons);

  // Populate translations if present, otherwise clear existing translation sheets
  if (config.translations && Object.keys(config.translations).length > 0) {
    populateTranslationSheets(spreadsheet, config);
  } else {
    clearTranslationSheets(spreadsheet);
  }
}

/**
 * Identifies fields that appear in ALL categories (universal fields)
 */
function identifyUniversalFields(categories: Category[], fields: Field[]): Set<string> {
  const universalFieldIds = new Set<string>();

  if (categories.length === 0 || fields.length === 0) {
    return universalFieldIds;
  }

  // For each field, check if it appears in all categories
  for (const field of fields) {
    if (!field.id) continue;

    const appearsInAllCategories = categories.every(cat =>
      cat.defaultFieldIds && cat.defaultFieldIds.includes(field.id)
    );

    if (appearsInAllCategories) {
      universalFieldIds.add(field.id);
    }
  }

  return universalFieldIds;
}

/**
 * Populates the Categories sheet
 * @param iconMap - Map of icon ID to actual icon data (svgData URI or svgUrl)
 * @param universalFieldIds - Set of field IDs that appear in all categories (to exclude from Fields column)
 */
function populateCategoriesSheet(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  categories: Category[],
  iconMap: Map<string, string>,
  fields?: Field[],
  universalFieldIds?: Set<string>
): void {
  let sheet = spreadsheet.getSheetByName('Categories');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('Categories');
    sheet.getRange(1, 1, 1, 6).setValues([['Name', 'Icon', 'Fields', 'ID', 'Color', 'Icon ID']]).setFontWeight('bold');
  } else {
    // Clear existing data (keep header)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 6).clear();
    }
  }

  if (!categories || categories.length === 0) return;

  // Build map from field ID to field name for converting defaultFieldIds
  const fieldIdToName = new Map<string, string>();
  if (fields && fields.length > 0) {
    for (const field of fields) {
      if (field.id && field.name) {
        fieldIdToName.set(field.id, field.name);
      }
    }
  }

  const rows: any[][] = [];
  const colors: string[] = [];

  for (const cat of categories) {
    if (!cat || !cat.name) continue;

    // Look up actual icon data from the icon map using iconId
    // This ensures icons round-trip correctly (not just the ID)
    let iconValue = '';
    if (cat.iconId) {
      iconValue = iconMap.get(cat.iconId) || '';
    }

    // Convert field IDs to field names for column C, excluding universal fields
    let fieldsValue = '';
    if (Array.isArray(cat.defaultFieldIds) && cat.defaultFieldIds.length > 0) {
      const nonUniversalFieldIds = universalFieldIds
        ? cat.defaultFieldIds.filter(id => !universalFieldIds.has(id))
        : cat.defaultFieldIds;

      const fieldNames = nonUniversalFieldIds
        .map(id => fieldIdToName.get(id) || id)  // Fall back to ID if name not found
        .filter(Boolean);
      fieldsValue = fieldNames.join(', ');
    }

    const colorValue = cat.color || '#FFFFFF';

    rows.push([cat.name, iconValue, fieldsValue, cat.id || '', colorValue, cat.iconId || '']);
    colors.push(colorValue);
  }

  if (rows.length === 0) return;

  sheet.getRange(2, 1, rows.length, 6).setValues(rows);

  // Set background colors for column A
  const bgColors = colors.map(c => [c]);
  sheet.getRange(2, 1, colors.length, 1).setBackgrounds(bgColors);
}

/**
 * Populates the Details sheet
 * @param universalFieldIds - Set of field IDs that appear in all categories
 */
function populateDetailsSheet(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  fields: Field[],
  universalFieldIds?: Set<string>
): void {
  let sheet = spreadsheet.getSheetByName('Details');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('Details');
    sheet.getRange(1, 1, 1, 6).setValues([['Name', 'Helper Text', 'Type', 'Options', 'ID', 'Universal']]).setFontWeight('bold');
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
    // Preserve option values by writing "value:label" when they differ
    let optionsValue = '';
    if (Array.isArray(field.options) && field.options.length > 0) {
      optionsValue = field.options.map(o => {
        const value = o?.value || '';
        const label = o?.label || '';
        if (!label) return '';
        // Only include value prefix if it differs from slugified label
        return value === slugify(label) ? label : `${value}:${label}`;
      }).filter(Boolean).join(', ');
    }

    // Mark as Universal if the field appears in all categories
    const isUniversal = universalFieldIds && field.id ? universalFieldIds.has(field.id) : false;

    rows.push([
      field.name,
      field.description || '',
      typeChar,
      optionsValue,
      field.id || '',  // Store original field ID for round-trip
      isUniversal ? 'TRUE' : 'FALSE'
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
      return 't';
    case 'textarea':
      return 'T';
    case 'number':
      return 'n';
    case 'integer':
      return 'i';
    case 'multiselect':
      return 'm';
    case 'select':
      return 's';
    case 'boolean':
      return 'b';
    case 'date':
      return 'd';
    case 'datetime':
      return 'D';
    case 'photo':
      return 'p';
    case 'location':
      return 'l';
    default:
      return 's';  // Fallback to select for unknown types
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
 * Populates the Icons sheet with all icons from the config
 * This ensures all icons are preserved during round-trip, not just category icons
 */
function populateIconsSheet(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, icons?: Icon[]): void {
  let sheet = spreadsheet.getSheetByName('Icons');

  if (!sheet) {
    sheet = spreadsheet.insertSheet('Icons');
    sheet.getRange(1, 1, 1, 2).setValues([['ID', 'SVG Data']]).setFontWeight('bold');
  } else {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 2).clear();
    }
  }

  if (!icons || icons.length === 0) return;

  const rows: any[][] = [];
  for (const icon of icons) {
    if (!icon || !icon.id) continue;

    // Store either svgData or svgUrl
    const svgValue = icon.svgData || icon.svgUrl || '';
    rows.push([icon.id, svgValue]);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  }
}

/**
 * Deletes all translation sheets to remove stale data when importing a config without translations.
 * Deleting rather than clearing allows auto-translate to recreate them with proper headers/formulas.
 */
function clearTranslationSheets(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet): void {
  const translationSheetNames = [
    'Category Translations',
    'Detail Label Translations',
    'Detail Helper Text Translations',
    'Detail Option Translations'
  ];

  for (const sheetName of translationSheetNames) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      spreadsheet.deleteSheet(sheet);
    }
  }
}

/**
 * Populates translation sheets from imported config
 */
function populateTranslationSheets(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, config: BuildRequest): void {
  if (!config.translations) return;

  const locales = Object.keys(config.translations).filter(Boolean);
  if (locales.length === 0) return;

  // Helper to clear entire sheet content (headers + data) to remove stale columns
  const clearSheetContent = (sheet: GoogleAppsScript.Spreadsheet.Sheet): void => {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow > 0 && lastCol > 0) {
      sheet.getRange(1, 1, lastRow, lastCol).clear();
    }
  };

  // Create Category Translations sheet
  let catSheet = spreadsheet.getSheetByName('Category Translations');
  if (!catSheet) {
    catSheet = spreadsheet.insertSheet('Category Translations');
  } else {
    clearSheetContent(catSheet);
  }

  const catHeaders = ['Name', ...locales.map(l => `${l}`)];
  catSheet.getRange(1, 1, 1, catHeaders.length).setValues([catHeaders]).setFontWeight('bold');

  // Set column A formula to reference Categories sheet
  const categoriesSheet = spreadsheet.getSheetByName('Categories');
  if (categoriesSheet && config.categories && config.categories.length > 0) {
    const lastRow = categoriesSheet.getLastRow();
    if (lastRow > 1) {
      const formula = `=Categories!A2:A${lastRow}`;
      catSheet.getRange(2, 1, lastRow - 1, 1).setFormula(formula);
    }

    // Write translation values (columns B+)
    const catTransValues: any[][] = [];
    for (const cat of config.categories) {
      if (!cat || !cat.id) continue;
      const row: any[] = [];
      for (const locale of locales) {
        const trans = config.translations[locale]?.categories?.[cat.id]?.name || '';
        row.push(trans);
      }
      catTransValues.push(row);
    }
    if (catTransValues.length > 0 && locales.length > 0) {
      catSheet.getRange(2, 2, catTransValues.length, locales.length).setValues(catTransValues);
    }
  }

  // Create Detail Label Translations sheet
  let labelSheet = spreadsheet.getSheetByName('Detail Label Translations');
  if (!labelSheet) {
    labelSheet = spreadsheet.insertSheet('Detail Label Translations');
  } else {
    clearSheetContent(labelSheet);
  }

  const labelHeaders = ['Name', ...locales.map(l => `${l}`)];
  labelSheet.getRange(1, 1, 1, labelHeaders.length).setValues([labelHeaders]).setFontWeight('bold');

  // Set column A formula to reference Details sheet column A (field names)
  const detailsSheet = spreadsheet.getSheetByName('Details');
  if (detailsSheet && config.fields && config.fields.length > 0) {
    const lastRow = detailsSheet.getLastRow();
    if (lastRow > 1) {
      const formula = `=Details!A2:A${lastRow}`;
      labelSheet.getRange(2, 1, lastRow - 1, 1).setFormula(formula);
    }

    // Write translation values (columns B+)
    const labelTransValues: any[][] = [];
    for (const field of config.fields) {
      if (!field || !field.id) continue;
      const row: any[] = [];
      for (const locale of locales) {
        const trans = config.translations[locale]?.fields?.[field.id]?.name || '';
        row.push(trans);
      }
      labelTransValues.push(row);
    }
    if (labelTransValues.length > 0 && locales.length > 0) {
      labelSheet.getRange(2, 2, labelTransValues.length, locales.length).setValues(labelTransValues);
    }
  }

  // Create Detail Helper Text Translations sheet
  let helperSheet = spreadsheet.getSheetByName('Detail Helper Text Translations');
  if (!helperSheet) {
    helperSheet = spreadsheet.insertSheet('Detail Helper Text Translations');
  } else {
    clearSheetContent(helperSheet);
  }

  const helperHeaders = ['Helper Text', ...locales.map(l => `${l}`)];
  helperSheet.getRange(1, 1, 1, helperHeaders.length).setValues([helperHeaders]).setFontWeight('bold');

  // Set column A formula to reference Details sheet column B (helper text)
  if (detailsSheet && config.fields && config.fields.length > 0) {
    const lastRow = detailsSheet.getLastRow();
    if (lastRow > 1) {
      const formula = `=Details!B2:B${lastRow}`;
      helperSheet.getRange(2, 1, lastRow - 1, 1).setFormula(formula);
    }

    // Write translation values (columns B+)
    const helperTransValues: any[][] = [];
    for (const field of config.fields) {
      if (!field || !field.id) continue;
      const row: any[] = [];
      for (const locale of locales) {
        const trans = config.translations[locale]?.fields?.[field.id]?.description || '';
        row.push(trans);
      }
      helperTransValues.push(row);
    }
    if (helperTransValues.length > 0 && locales.length > 0) {
      helperSheet.getRange(2, 2, helperTransValues.length, locales.length).setValues(helperTransValues);
    }
  }

  // Create Detail Option Translations sheet
  let optionSheet = spreadsheet.getSheetByName('Detail Option Translations');
  if (!optionSheet) {
    optionSheet = spreadsheet.insertSheet('Detail Option Translations');
  } else {
    clearSheetContent(optionSheet);
  }

  const optionHeaders = ['Options', ...locales.map(l => `${l}`)];
  optionSheet.getRange(1, 1, 1, optionHeaders.length).setValues([optionHeaders]).setFontWeight('bold');

  // Set column A formula to reference Details sheet column D (options)
  if (detailsSheet && config.fields && config.fields.length > 0) {
    const lastRow = detailsSheet.getLastRow();
    if (lastRow > 1) {
      const formula = `=Details!D2:D${lastRow}`;
      optionSheet.getRange(2, 1, lastRow - 1, 1).setFormula(formula);
    }

    // Write translation values (columns B+)
    const optionTransValues: any[][] = [];
    for (const field of config.fields) {
      if (!field || !field.id) continue;
      const row: any[] = [];
      for (const locale of locales) {
        const fieldTrans = config.translations[locale]?.fields?.[field.id];
        if (fieldTrans?.options && field.options) {
          // Join option translations in order of field.options
          const optTrans = field.options.map(opt => fieldTrans.options?.[opt.value] || '').join(', ');
          row.push(optTrans);
        } else {
          row.push('');
        }
      }
      optionTransValues.push(row);
    }
    if (optionTransValues.length > 0 && locales.length > 0) {
      optionSheet.getRange(2, 2, optionTransValues.length, locales.length).setValues(optionTransValues);
    }
  }
}
