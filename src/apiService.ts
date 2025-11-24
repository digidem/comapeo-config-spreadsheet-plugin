/**
 * CoMapeo Config API Service v2.0.0
 * JSON-only build endpoint, no ZIP workflow
 */

// =============================================================================
// Constants
// =============================================================================

/** API base URL */
const API_BASE_URL = "http://137.184.153.36:3000";

/** Column indices for Categories sheet (0-based) */
const CATEGORY_COL = {
  NAME: 0,
  ICON: 1,
  FIELDS: 2,
  ID: 3,  // Category ID (optional, for preserving original IDs on import)
  COLOR: 4,  // Explicit color value (column E)
  ICON_ID: 5,  // Icon ID (optional, for preserving original iconId on import)
  COLOR_BACKGROUND: 0  // Fallback: Color from background of column A
};

/** Column indices for Details sheet (0-based) */
const DETAILS_COL = {
  NAME: 0,
  HELPER_TEXT: 1,
  TYPE: 2,
  OPTIONS: 3,
  ID: 4,  // Field ID (optional, for preserving original IDs on import)
  UNIVERSAL: 5
};

/** Column indices for translation sheets (0-based) */
const TRANSLATION_COL = {
  SOURCE_TEXT: 0,       // Column A - original text
  FIRST_LANGUAGE: 1     // Column B - first translation language
};

/** Expected sheet headers for validation */
const EXPECTED_HEADERS = {
  CATEGORIES: ['Name', 'Icon', 'Fields', 'ID', 'Color', 'Icon ID'],
  DETAILS: ['Name', 'Helper Text', 'Type', 'Options', 'ID', 'Universal']
};

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validates that sheet headers match expected format
 * Logs warnings if headers don't match but doesn't throw to allow flexibility
 *
 * @param sheetName - Name of the sheet being validated
 * @param headers - Actual headers from the sheet
 * @param expected - Expected headers
 * @returns true if valid, false if invalid (but doesn't throw)
 */
function validateSheetHeaders(
  sheetName: string,
  headers: string[],
  expected: string[]
): boolean {
  if (headers.length < expected.length) {
    console.warn(
      `${sheetName} sheet has ${headers.length} columns but expected ${expected.length}. ` +
      `Expected: [${expected.join(', ')}], Found: [${headers.join(', ')}]. ` +
      `This may cause issues if columns are misaligned.`
    );
    return false;
  }

  for (let i = 0; i < expected.length; i++) {
    if (headers[i] !== expected[i]) {
      console.warn(
        `${sheetName} sheet column ${i + 1} header mismatch: ` +
        `expected "${expected[i]}" but found "${headers[i]}". ` +
        `Data may not be read correctly.`
      );
      return false;
    }
  }

  return true;
}

/** Default retry configuration */
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000
};

/** Plugin identification */
const PLUGIN_INFO = {
  NAME: "comapeo-config-spreadsheet-plugin",
  VERSION: "2.0.0"
};

// =============================================================================
// API Communication
// =============================================================================

/**
 * Sends a JSON build request to the API and returns the .comapeocat file
 *
 * @param buildRequest - The build request payload
 * @param maxRetries - Maximum number of total attempts (default: 3)
 * @returns URL to the saved .comapeocat file
 */
function sendBuildRequest(buildRequest: BuildRequest, maxRetries: number = RETRY_CONFIG.MAX_RETRIES): string {
  const apiUrl = `${API_BASE_URL}/build`;
  let attemptNumber = 0;
  let lastError: Error | null = null;

  while (attemptNumber < maxRetries) {
    attemptNumber++;

    try {
      if (attemptNumber > 1) {
        const ui = SpreadsheetApp.getUi();
        ui.alert(
          "Retrying API Request",
          `Retry ${attemptNumber - 1} of ${maxRetries - 1}. Previous attempt failed: ${lastError?.message || "Unknown error"}`,
          ui.ButtonSet.OK
        );
      }

      console.log(`Sending JSON build request to API (attempt ${attemptNumber} of ${maxRetries}):`, apiUrl);

      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(buildRequest),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(apiUrl, options);
      const responseCode = response.getResponseCode();
      console.log('Response code:', responseCode);

      if (responseCode === 200) {
        const responseBlob = response.getBlob();
        const contentType = response.getHeaders()['Content-Type'] || '';
        console.log('Content-Type:', contentType);

        // Verify we got a binary file response
        if (contentType.includes('application/octet-stream') || contentType.includes('application/zip')) {
          const fileName = `${buildRequest.metadata.name}-${buildRequest.metadata.version}.comapeocat`;
          const blob = responseBlob.setName(fileName);
          return saveComapeocatToDrive(blob);
        }

        // Check if it's actually an error response in JSON
        try {
          const errorResponse: ApiErrorResponse = JSON.parse(response.getContentText());
          lastError = new Error(`API Error: ${errorResponse.message}` +
            (errorResponse.details?.errors ? ` - ${errorResponse.details.errors.join(', ')}` : ''));
        } catch {
          lastError = new Error("API returned unexpected response format");
        }
      } else {
        // Handle error response
        try {
          const errorResponse: ApiErrorResponse = JSON.parse(response.getContentText());
          lastError = new Error(`API Error (${responseCode}): ${errorResponse.message}` +
            (errorResponse.details?.errors ? ` - ${errorResponse.details.errors.join(', ')}` : ''));
        } catch {
          lastError = new Error(`API request failed with status ${responseCode}: ${response.getContentText()}`);
        }
      }

      console.error(lastError?.message);

      // Only sleep if we're going to retry (not on last attempt)
      if (attemptNumber < maxRetries) {
        Utilities.sleep(RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, attemptNumber - 1));
      }
    } catch (error) {
      lastError = error;
      console.error(`Error in API request (attempt ${attemptNumber} of ${maxRetries}):`, error);

      // Only sleep if we're going to retry (not on last attempt)
      if (attemptNumber < maxRetries) {
        Utilities.sleep(RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, attemptNumber - 1));
      }
    }
  }

  // Exhausted all retries
  const ui = SpreadsheetApp.getUi();
  const errorMessage = `Failed to generate the CoMapeo category file after ${maxRetries} attempts.\n\n` +
    `Last error: ${lastError?.message || "Unknown error"}\n\n` +
    `Please check your internet connection and try again.`;

  ui.alert("Error Generating CoMapeo Category", errorMessage, ui.ButtonSet.OK);

  throw new Error(`Failed to generate CoMapeo category after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`);
}

/**
 * Saves the .comapeocat blob to Google Drive
 *
 * @param blob - The .comapeocat file blob (name should already be set to name-version.comapeocat)
 * @returns URL to the saved file
 */
function saveComapeocatToDrive(blob: GoogleAppsScript.Base.Blob): string {
  console.log('Saving .comapeocat file to Drive...');
  const configFolder = getConfigFolder();

  // Get or create builds folder
  let buildsFolderObj: GoogleAppsScript.Drive.Folder;
  const buildsFolders = configFolder.getFoldersByName('builds');
  if (buildsFolders.hasNext()) {
    buildsFolderObj = buildsFolders.next();
  } else {
    buildsFolderObj = configFolder.createFolder('builds');
  }

  // Use the blob's existing name (already set to name-version.comapeocat pattern)
  // This preserves both name and version to prevent file collisions
  const file = buildsFolderObj.createFile(blob);
  const fileUrl = file.getUrl();
  console.log(`Download the .comapeocat file here: ${fileUrl}`);

  return fileUrl;
}

// =============================================================================
// Payload Building
// =============================================================================

/**
 * Migrates old 4-column spreadsheet format to new 6-column format with ID columns
 * Old format: Name, Icon, Fields, Color
 * New format: Name, Icon, Fields, ID, Color, Icon ID
 *
 * This function is idempotent - it checks if migration is needed before proceeding.
 * It validates the exact format before migrating to prevent data corruption.
 *
 * MANUAL TESTING CHECKLIST (cannot be automated due to SpreadsheetApp dependency):
 * [ ] Test migration from old 4-column Categories format (Name, Icon, Fields, Color)
 * [ ] Test migration from old Details format without ID column
 * [ ] Test that already-migrated sheets are not re-migrated (idempotency)
 * [ ] Test data preservation during migration (verify no data loss)
 * [ ] Test edge case: empty sheets
 * [ ] Test edge case: sheets with unexpected number of columns
 * [ ] Test edge case: repeated calls to migration (should be safe)
 * [ ] Verify console logs show appropriate messages for each scenario
 */
function migrateSpreadsheetFormat(): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Migrate Categories sheet
  const categoriesSheet = spreadsheet.getSheetByName('Categories');
  if (categoriesSheet) {
    const lastCol = categoriesSheet.getLastColumn();
    if (lastCol === 0) {
      console.log('Categories sheet is empty, skipping migration');
    } else {
      const headers = categoriesSheet.getRange(1, 1, 1, lastCol).getValues()[0];

      // Check if already in new 6-column format (idempotency check)
      const expectedNewHeaders = ['Name', 'Icon', 'Fields', 'ID', 'Color', 'Icon ID'];
      if (headers.length >= 6 &&
          headers[0] === expectedNewHeaders[0] &&
          headers[3] === expectedNewHeaders[3] &&
          headers[5] === expectedNewHeaders[5]) {
        console.log('Categories sheet already in new 6-column format, skipping migration');
      }
      // Check if it's the exact old 4-column format that needs migration
      else if (headers.length === 4 &&
               headers[0] === 'Name' &&
               headers[1] === 'Icon' &&
               headers[2] === 'Fields' &&
               headers[3] === 'Color') {
        console.log('Migrating Categories sheet from 4-column to 6-column format...');

        // Insert column D for ID (this shifts Color from D to E)
        categoriesSheet.insertColumnAfter(3);

        // Insert column F for Icon ID (after the new column E which has Color)
        categoriesSheet.insertColumnAfter(5);

        // Update headers
        categoriesSheet.getRange(1, 1, 1, 6).setValues([['Name', 'Icon', 'Fields', 'ID', 'Color', 'Icon ID']]).setFontWeight('bold');

        console.log('Categories sheet migrated successfully');
      }
      // Ambiguous format - log warning and skip to prevent data corruption
      else {
        console.warn(`Categories sheet has unexpected format (${headers.length} columns: ${headers.join(', ')}). Skipping migration to avoid data loss. Please verify the sheet format manually.`);
      }
    }
  }

  // Migrate Details sheet
  const detailsSheet = spreadsheet.getSheetByName('Details');
  if (detailsSheet) {
    const lastCol = detailsSheet.getLastColumn();
    if (lastCol === 0) {
      console.log('Details sheet is empty, skipping migration');
    } else {
      const headers = detailsSheet.getRange(1, 1, 1, lastCol).getValues()[0];

      // Check if already has ID column in correct position (idempotency check)
      const expectedNewHeaders = ['Name', 'Helper Text', 'Type', 'Options', 'ID', 'Universal'];
      if (headers.length >= 6 &&
          headers[0] === expectedNewHeaders[0] &&
          headers[4] === expectedNewHeaders[4] &&
          headers[5] === expectedNewHeaders[5]) {
        console.log('Details sheet already in new format with ID column, skipping migration');
      }
      // Check if it's old format without ID column (4 or 5 columns)
      else if ((headers.length === 4 || headers.length === 5) &&
               headers[0] === 'Name' &&
               headers[1] === 'Helper Text' &&
               headers[2] === 'Type' &&
               headers[3] === 'Options') {
        console.log('Migrating Details sheet to include ID column...');

        // Insert column E for ID (after OPTIONS in column D)
        detailsSheet.insertColumnAfter(4);

        // Preserve Universal column if it exists, otherwise add it
        const hasUniversal = headers.length >= 5 && headers[4];
        const newHeaders = ['Name', 'Helper Text', 'Type', 'Options', 'ID'];
        if (hasUniversal) {
          newHeaders.push(headers[4]);  // Preserve existing header name
        } else {
          newHeaders.push('Universal');
        }

        detailsSheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]).setFontWeight('bold');

        console.log('Details sheet migrated successfully');
      }
      // Ambiguous format - log warning and skip to prevent data corruption
      else {
        console.warn(`Details sheet has unexpected format (${headers.length} columns: ${headers.join(', ')}). Skipping migration to avoid data loss. Please verify the sheet format manually.`);
      }
    }
  }
}

/**
 * Creates a BuildRequest payload from spreadsheet data
 *
 * @param data - Spreadsheet data from getSpreadsheetData()
 * @returns BuildRequest payload ready for API
 */
function createBuildPayload(data: SheetData): BuildRequest {
  const fields = buildFields(data);
  const categories = buildCategories(data, fields);
  const icons = buildIconsFromSheet(data);
  const metadata = buildMetadata(data);
  const translations = buildTranslationsPayload(data, categories, fields);

  // Set category selection in exact spreadsheet order
  const categoryIds = categories.map(c => c.id);
  setCategorySelection(categoryIds);

  console.log(`Built payload with ${categories.length} categories, ${fields.length} fields, ${icons.length} icons`);

  return {
    metadata,
    categories,
    fields,
    icons: icons.length > 0 ? icons : undefined,
    translations: Object.keys(translations).length > 0 ? translations : undefined
  };
}

/**
 * Builds metadata from spreadsheet
 * Note: data.documentName is a string (spreadsheet name), not an array
 */
function buildMetadata(data: SheetData): Metadata {
  // FIXED: documentName is a string from getSpreadsheetData(), not a nested array
  const documentName = typeof data.documentName === 'string'
    ? data.documentName
    : String(data.documentName || "Unnamed Config");

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let metadataSheet = spreadsheet.getSheetByName('Metadata');

  if (!metadataSheet) {
    metadataSheet = spreadsheet.insertSheet('Metadata');
    metadataSheet.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]).setFontWeight('bold');
  }

  const sheetData = metadataSheet.getDataRange().getValues();

  const getValue = (key: string, defaultVal: string): string => {
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === key) {
        if (key === 'version') {
          // Always update version with current date
          const newVersion = Utilities.formatDate(new Date(), 'UTC', 'yy.MM.dd');
          metadataSheet.getRange(i + 1, 2).setValue(newVersion);
          return newVersion;
        }
        return String(sheetData[i][1]);
      }
    }
    // Key not found - append new row
    metadataSheet.appendRow([key, defaultVal]);
    return defaultVal;
  };

  const name = getValue('name', `config-${slugify(documentName)}`);
  const version = getValue('version', Utilities.formatDate(new Date(), 'UTC', 'yy.MM.dd'));
  const description = getValue('description', '');

  return {
    name,
    version,
    description: description || undefined,
    builderName: PLUGIN_INFO.NAME,
    builderVersion: PLUGIN_INFO.VERSION
  };
}

/**
 * Builds fields array from Details sheet
 */
function buildFields(data: SheetData): Field[] {
  const details = data.Details?.slice(1) || [];

  // Validate Details sheet headers
  const detailsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Details');
  if (detailsSheet) {
    const headers = detailsSheet.getRange(1, 1, 1, 6).getValues()[0];
    validateSheetHeaders('Details', headers, EXPECTED_HEADERS.DETAILS);
  }

  return details
    .map((row, index) => {
      const name = String(row[DETAILS_COL.NAME] || '').trim();
      if (!name) {
        console.log(`Skipping Details row ${index + 2}: empty field name`);
        return null;  // Skip blank rows
      }

      const helperText = String(row[DETAILS_COL.HELPER_TEXT] || '');
      const typeStr = String(row[DETAILS_COL.TYPE] || 't').charAt(0);  // Case-sensitive: 'd' = date, 'D' = datetime
      const optionsStr = String(row[DETAILS_COL.OPTIONS] || '');
      const idStr = String(row[DETAILS_COL.ID] || '').trim();
      // Note: DETAILS_COL.UNIVERSAL is used by buildCategories to add fields to all categories,
      // but it does NOT map to field.required (universal fields can be optional)

      let type: FieldType;
      let options: SelectOption[] | undefined;

      switch (typeStr) {
        case 'm':
          type = 'multiselect';
          options = parseOptions(optionsStr);
          break;
        case 'n':
          type = 'number';
          break;
        case 'i':
          type = 'integer';
          break;
        case 't':
          type = 'text';
          break;
        case 'T':
          type = 'textarea';
          break;
        case 'b':
          type = 'boolean';
          break;
        case 'd':
          type = 'date';
          break;
        case 'D':
          type = 'datetime';
          break;
        case 'p':
          type = 'photo';
          break;
        case 'l':
          type = 'location';
          break;
        default:
          // Default to 'select' for 's' or any other value
          type = 'select';
          options = parseOptions(optionsStr);
      }

      return {
        id: idStr || slugify(name),  // Use explicit ID if provided, otherwise slugify name
        name,
        type,
        description: helperText || undefined,
        options
        // Note: required property is not set from spreadsheet - universal flag is separate from required
      } as Field;
    })
    .filter((field): field is Field => field !== null);
}

/**
 * Parses comma-separated options string into SelectOption array
 * Supports two formats:
 * - "Label" -> {value: slugify(Label), label: Label}
 * - "value:Label" -> {value: value, label: Label}
 */
function parseOptions(optionsStr: string): SelectOption[] | undefined {
  if (!optionsStr) return undefined;

  const opts = optionsStr.split(',').map(s => s.trim()).filter(Boolean);
  if (opts.length === 0) return undefined;

  return opts.map(opt => {
    // Check for "value:label" format
    const colonIndex = opt.indexOf(':');
    if (colonIndex > 0) {
      const value = opt.substring(0, colonIndex);
      const label = opt.substring(colonIndex + 1);
      return { value, label };
    }
    // Default format: just label
    return {
      value: slugify(opt),
      label: opt
    };
  });
}

/**
 * Builds categories array from Categories sheet
 * Categories are built in exact spreadsheet order for setCategorySelection
 */
function buildCategories(data: SheetData, fields: Field[]): Category[] {
  const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  const categories = data.Categories?.slice(1) || [];

  if (!categoriesSheet || categories.length === 0) {
    return [];
  }

  // Validate Categories sheet headers
  const headers = categoriesSheet.getRange(1, 1, 1, 6).getValues()[0];
  validateSheetHeaders('Categories', headers, EXPECTED_HEADERS.CATEGORIES);

  // Build map from field name to field ID for converting defaultFieldIds
  const fieldNameToId = new Map<string, string>();
  if (fields && fields.length > 0) {
    for (const field of fields) {
      if (field.name && field.id) {
        fieldNameToId.set(field.name, field.id);
      }
    }
  }

  // Identify universal fields (fields marked as Universal in Details sheet)
  const details = data.Details?.slice(1) || [];
  const universalFieldIds: string[] = [];
  details.forEach(row => {
    const universalVal = row[DETAILS_COL.UNIVERSAL];
    const isUniversal = universalVal === true || universalVal === 'TRUE' || universalVal === 'true';
    if (isUniversal) {
      const name = String(row[DETAILS_COL.NAME] || '');
      const idStr = String(row[DETAILS_COL.ID] || '').trim();
      const fieldId = idStr || slugify(name);
      if (fieldId) {
        universalFieldIds.push(fieldId);
      }
    }
  });

  // Get background colors from column A (where category names are)
  const backgroundColors = categoriesSheet.getRange(2, 1, categories.length, 1).getBackgrounds();

  return categories
    .map((row, index) => {
      const name = String(row[CATEGORY_COL.NAME] || '').trim();
      if (!name) {
        console.log(`Skipping Categories row ${index + 2}: empty category name`);
        return null;  // Skip blank rows
      }

      const iconData = String(row[CATEGORY_COL.ICON] || '').trim();
      const fieldsStr = String(row[CATEGORY_COL.FIELDS] || '');
      const idStr = String(row[CATEGORY_COL.ID] || '').trim();
      const colorStr = String(row[CATEGORY_COL.COLOR] || '').trim();
      const iconIdStr = String(row[CATEGORY_COL.ICON_ID] || '').trim();
      // Use explicit color from column E if present, otherwise fall back to background color
      const color = colorStr || backgroundColors[index]?.[CATEGORY_COL.COLOR_BACKGROUND] || '#0000FF';

      // Convert field names to field IDs using actual IDs from Details sheet
      const explicitFieldIds: string[] = [];
      if (fieldsStr) {
        const fieldNames = fieldsStr.split(',').map(f => f.trim()).filter(Boolean);
        const fieldIds = fieldNames
          .map(name => fieldNameToId.get(name) || slugify(name))  // Fall back to slugify if not found
          .filter(Boolean);
        explicitFieldIds.push(...fieldIds);
      }

      // Merge universal fields with explicit fields (universal fields first, then explicit)
      // Use Set to avoid duplicates if a universal field is also explicitly listed
      const allFieldIds = [...new Set([...universalFieldIds, ...explicitFieldIds])];
      const defaultFieldIds = allFieldIds.length > 0 ? allFieldIds : undefined;

      const categoryId = idStr || slugify(name);  // Use explicit ID if provided, otherwise slugify name

      return {
        id: categoryId,
        name,
        color,
        iconId: iconIdStr || (iconData ? categoryId : undefined),  // Use explicit iconId from column F, or categoryId if icon data present
        defaultFieldIds
      } as Category;
    })
    .filter((cat): cat is Category => cat !== null);
}

/**
 * Builds icons array from Icons sheet and Categories sheet column B
 * This preserves all icons from imported configs AND standard workflow icons
 */
function buildIconsFromSheet(data: SheetData): Icon[] {
  const icons: Icon[] = [];
  const iconIds = new Set<string>();  // Track icon IDs to avoid duplicates

  // Helper function to process icon data
  const processIconData = (iconId: string, iconUrlOrData: string) => {
    if (!iconId || !iconUrlOrData || iconIds.has(iconId)) return;

    iconIds.add(iconId);

    if (iconUrlOrData.startsWith('<svg')) {
      // Inline SVG data
      icons.push({ id: iconId, svgData: iconUrlOrData });
    } else if (iconUrlOrData.startsWith('data:image/svg+xml')) {
      // Data URI SVG
      const svgContent = decodeURIComponent(iconUrlOrData.replace(/^data:image\/svg\+xml,/, ''));
      icons.push({ id: iconId, svgData: svgContent });
    } else if (iconUrlOrData.startsWith('https://drive.google.com')) {
      // Google Drive URL - fetch and convert to inline SVG
      try {
        const fileId = iconUrlOrData.split('/d/')[1]?.split('/')[0];
        if (fileId) {
          const file = DriveApp.getFileById(fileId);
          const svgContent = file.getBlob().getDataAsString();
          icons.push({ id: iconId, svgData: svgContent });
        }
      } catch (e) {
        console.warn(`Failed to fetch icon from Drive for ${iconId}:`, e);
        // Fall back to URL reference
        icons.push({ id: iconId, svgUrl: iconUrlOrData });
      }
    } else if (iconUrlOrData.startsWith('http')) {
      // External URL
      icons.push({ id: iconId, svgUrl: iconUrlOrData });
    }
  };

  // First, read from Icons sheet (for imported icons)
  const iconsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Icons');
  if (iconsSheet) {
    const lastRow = iconsSheet.getLastRow();
    if (lastRow >= 2) {
      const sheetData = iconsSheet.getRange(2, 1, lastRow - 1, 2).getValues();
      for (const row of sheetData) {
        const iconId = String(row[0] || '').trim();
        const iconUrlOrData = String(row[1] || '').trim();
        processIconData(iconId, iconUrlOrData);
      }
    }
  }

  // Second, read from Categories sheet column B (for standard workflow icons)
  const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  if (categoriesSheet) {
    const lastRow = categoriesSheet.getLastRow();
    if (lastRow >= 2) {
      const categories = data.Categories?.slice(1) || [];
      const sheetData = categoriesSheet.getRange(2, 1, Math.min(lastRow - 1, categories.length), 6).getValues();

      for (const row of sheetData) {
        const name = String(row[CATEGORY_COL.NAME] || '').trim();
        const iconUrlOrData = String(row[CATEGORY_COL.ICON] || '').trim();
        const idStr = String(row[CATEGORY_COL.ID] || '').trim();
        const iconIdStr = String(row[CATEGORY_COL.ICON_ID] || '').trim();

        if (!name || !iconUrlOrData) continue;

        // Determine icon ID: use explicit iconId, then category ID, then slugified name
        const iconId = iconIdStr || idStr || slugify(name);
        processIconData(iconId, iconUrlOrData);
      }
    }
  }

  return icons;
}

// =============================================================================
// Translations
// =============================================================================

/**
 * Extracts language codes from translation sheet headers
 * Handles common language names, ISO codes, and custom formats
 *
 * Supports three formats:
 * 1. Common language names: "Spanish", "French", "German", etc. → ISO code
 * 2. "Name - ISO" format: "Spanish - es" → extracts ISO code
 * 3. Raw ISO 639-1/639-2 codes: "es", "fr", "pt" → uses as-is
 */
function extractLanguagesFromHeaders(headers: any[]): string[] {
  // Map of common language names (English and native) to ISO 639-1 codes
  const languageNameToCode: Record<string, string> = {
    // English names
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Portuguese': 'pt',
    'Russian': 'ru',
    'Chinese': 'zh',
    'Japanese': 'ja',
    'Korean': 'ko',
    'Arabic': 'ar',
    'Hindi': 'hi',
    'Bengali': 'bn',
    'Dutch': 'nl',
    'Swedish': 'sv',
    'Norwegian': 'no',
    'Danish': 'da',
    'Finnish': 'fi',
    'Polish': 'pl',
    'Turkish': 'tr',
    'Greek': 'el',
    'Hebrew': 'he',
    'Thai': 'th',
    'Vietnamese': 'vi',
    'Indonesian': 'id',
    'Malay': 'ms',
    'Swahili': 'sw',
    'Tagalog': 'tl',

    // Native language names (with diacritics)
    'Español': 'es',
    'Espanol': 'es',
    'Français': 'fr',
    'Francais': 'fr',
    'Deutsch': 'de',
    'Italiano': 'it',
    'Português': 'pt',
    'Portugues': 'pt',
    'Русский': 'ru',
    '中文': 'zh',
    '日本語': 'ja',
    '한국어': 'ko',
    'العربية': 'ar',
    'हिन्दी': 'hi',
    'বাংলা': 'bn',
    'Nederlands': 'nl',
    'Svenska': 'sv',
    'Norsk': 'no',
    'Dansk': 'da',
    'Suomi': 'fi',
    'Polski': 'pl',
    'Türkçe': 'tr',
    'Turkce': 'tr',
    'Ελληνικά': 'el',
    'עברית': 'he',
    'ไทย': 'th',
    'Tiếng Việt': 'vi',
    'Bahasa Indonesia': 'id',
    'Bahasa Melayu': 'ms',
    'Kiswahili': 'sw'
  };

  const langs: string[] = [];

  // Start from column B (index 1) - column A is source text
  for (let i = TRANSLATION_COL.FIRST_LANGUAGE; i < headers.length; i++) {
    const header = String(headers[i] || '').trim();
    if (!header) continue;

    // Check for custom language format: "Name - ISO"
    // This allows users to specify exact ISO codes when needed
    const customMatch = header.match(/.*\s*-\s*(\w+)$/);
    if (customMatch) {
      langs.push(customMatch[1].toLowerCase());
      continue;
    }

    // Check for common language name (case-insensitive)
    // Try exact match first
    let langCode = languageNameToCode[header];
    if (langCode) {
      langs.push(langCode);
      continue;
    }

    // Try case-insensitive match for English language names
    const headerLower = header.toLowerCase();
    for (const [name, code] of Object.entries(languageNameToCode)) {
      if (name.toLowerCase() === headerLower) {
        langs.push(code);
        langCode = code;
        break;
      }
    }
    if (langCode) continue;

    // Recognize raw ISO 639-1 codes (2 letters) or ISO 639-2 codes (3 letters)
    if (/^[a-z]{2,3}$/.test(header.toLowerCase())) {
      langs.push(header.toLowerCase());
    }
  }

  return langs;
}

/**
 * Builds translations payload from translation sheets
 *
 * Translation sheet structure:
 * - Column A (index 0): Source text (linked to Categories/Details)
 * - Column B+ (index 1+): Language translations
 *
 * Processes category and detail translations independently so field translations
 * are still included even when the Category Translations sheet is absent.
 */
function buildTranslationsPayload(data: SheetData, categories: Category[], fields: Field[]): TranslationsByLocale {
  const translations: TranslationsByLocale = {};

  // Determine available languages from any translation sheet
  // Try Category Translations first, then fall back to Detail translation sheets
  let langs: string[] = [];

  const catTransSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Category Translations');
  if (catTransSheet) {
    const headerRow = catTransSheet.getRange(1, 1, 1, catTransSheet.getLastColumn()).getValues()[0];
    langs = extractLanguagesFromHeaders(headerRow);
  }

  // If no languages found in Category Translations, try Detail Label Translations
  if (langs.length === 0) {
    const labelTransSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Detail Label Translations');
    if (labelTransSheet) {
      const headerRow = labelTransSheet.getRange(1, 1, 1, labelTransSheet.getLastColumn()).getValues()[0];
      langs = extractLanguagesFromHeaders(headerRow);
    }
  }

  // If still no languages found, try Detail Helper Text Translations
  if (langs.length === 0) {
    const helperTransSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Detail Helper Text Translations');
    if (helperTransSheet) {
      const headerRow = helperTransSheet.getRange(1, 1, 1, helperTransSheet.getLastColumn()).getValues()[0];
      langs = extractLanguagesFromHeaders(headerRow);
    }
  }

  // If still no languages found, try Detail Option Translations
  if (langs.length === 0) {
    const optionTransSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Detail Option Translations');
    if (optionTransSheet) {
      const headerRow = optionTransSheet.getRange(1, 1, 1, optionTransSheet.getLastColumn()).getValues()[0];
      langs = extractLanguagesFromHeaders(headerRow);
    }
  }

  // If no translation sheets found with languages, return empty translations
  if (langs.length === 0) {
    console.log('No translation sheets found with language columns');
    return translations;
  }

  console.log(`Found ${langs.length} languages for translations:`, langs);

  // Initialize translations structure
  for (const lang of langs) {
    translations[lang] = { categories: {}, fields: {} };
  }

  // Process category translations - match by name to handle blank rows
  // Only process if Category Translations sheet exists
  if (catTransSheet) {
    const catTrans = data['Category Translations']?.slice(1) || [];
    const catNameToId = new Map(categories.map(c => [c.name, c.id]));
    for (const row of catTrans) {
      const sourceName = String(row[TRANSLATION_COL.SOURCE_TEXT] || '').trim();
      const catId = catNameToId.get(sourceName);
      if (!catId) continue;  // Skip rows that don't match a category

      for (let j = 0; j < langs.length; j++) {
        const colIndex = TRANSLATION_COL.FIRST_LANGUAGE + j;
        const value = String(row[colIndex] || '').trim();
        if (value && translations[langs[j]].categories) {
          translations[langs[j]].categories![catId] = { name: value };
        }
      }
    }
  }

  // Process field label translations - match by name to handle blank rows
  const labelTrans = data['Detail Label Translations']?.slice(1) || [];
  const fieldNameToId = new Map(fields.map(f => [f.name, f.id]));
  for (const row of labelTrans) {
    const sourceName = String(row[TRANSLATION_COL.SOURCE_TEXT] || '').trim();
    const fieldId = fieldNameToId.get(sourceName);
    if (!fieldId) continue;

    for (let j = 0; j < langs.length; j++) {
      const colIndex = TRANSLATION_COL.FIRST_LANGUAGE + j;
      const value = String(row[colIndex] || '').trim();
      if (value && translations[langs[j]].fields) {
        if (!translations[langs[j]].fields![fieldId]) {
          translations[langs[j]].fields![fieldId] = {};
        }
        translations[langs[j]].fields![fieldId].name = value;
      }
    }
  }

  // Process field helper text translations
  // Match by helper text value (not by index) to handle blank rows in Details sheet
  // Build array of fields with their corresponding helper text for matching
  const helperTrans = data['Detail Helper Text Translations']?.slice(1) || [];
  const fieldsWithHelperText: Array<{field: Field, helperText: string}> = [];
  for (const field of fields) {
    if (field.description) {
      fieldsWithHelperText.push({field, helperText: field.description});
    }
  }

  for (const row of helperTrans) {
    const sourceHelperText = String(row[TRANSLATION_COL.SOURCE_TEXT] || '').trim();

    // Find ALL fields that match this helper text (handles duplicate helper texts)
    const matchingFields = fieldsWithHelperText.filter(item => item.helperText === sourceHelperText);
    if (matchingFields.length === 0) continue;

    for (const {field} of matchingFields) {
      const fieldId = field.id;
      for (let j = 0; j < langs.length; j++) {
        const colIndex = TRANSLATION_COL.FIRST_LANGUAGE + j;
        const value = String(row[colIndex] || '').trim();
        if (value && translations[langs[j]].fields) {
          if (!translations[langs[j]].fields![fieldId]) {
            translations[langs[j]].fields![fieldId] = {};
          }
          translations[langs[j]].fields![fieldId].description = value;
        }
      }
    }
  }

  // Process field option translations
  // Match by options string (not by index) to handle blank rows in Details sheet
  // Build array of fields with their corresponding options string for matching
  const optionTrans = data['Detail Option Translations']?.slice(1) || [];
  const fieldsWithOptions: Array<{field: Field, optionsStr: string}> = [];
  for (const field of fields) {
    if (field.options && field.options.length > 0) {
      // Reconstruct the options string as it appears in Details sheet column D
      const optionsStr = field.options.map(o => {
        const value = o?.value || '';
        const label = o?.label || '';
        if (!label) return '';
        return value === slugify(label) ? label : `${value}:${label}`;
      }).filter(Boolean).join(', ');
      if (optionsStr) {
        fieldsWithOptions.push({field, optionsStr});
      }
    }
  }

  for (const row of optionTrans) {
    const sourceOptionsStr = String(row[TRANSLATION_COL.SOURCE_TEXT] || '').trim();

    // Find ALL fields that match this options string (handles duplicate option lists)
    const matchingFields = fieldsWithOptions.filter(item => item.optionsStr === sourceOptionsStr);
    if (matchingFields.length === 0) continue;

    for (const {field} of matchingFields) {
      if (!field.options || field.options.length === 0) continue;

      const fieldId = field.id;
      for (let j = 0; j < langs.length; j++) {
        const colIndex = TRANSLATION_COL.FIRST_LANGUAGE + j;
        const optStr = String(row[colIndex] || '').trim();
        if (!optStr) continue;

        const translatedOpts = optStr.split(',').map(s => s.trim());

        if (!translations[langs[j]].fields![fieldId]) {
          translations[langs[j]].fields![fieldId] = {};
        }
        if (!translations[langs[j]].fields![fieldId].options) {
          translations[langs[j]].fields![fieldId].options = {};
        }

        for (let k = 0; k < translatedOpts.length && k < field.options.length; k++) {
          translations[langs[j]].fields![fieldId].options![field.options[k].value] = translatedOpts[k];
        }
      }
    }
  }

  return translations;
}
