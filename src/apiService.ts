/**
 * CoMapeo Config API Service v2.0.0
 * JSON-only build endpoint, no ZIP workflow
 */

// =============================================================================
// Constants
// =============================================================================

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
  // v2 JSON endpoint (legacy ZIP endpoint was /v1, prior code used /build)
  const apiUrl = `${API_BASE_URL}/v2`;
  let attemptNumber = 0;
  let lastError: Error | null = null;
  const startTime = Date.now();

  while (attemptNumber < maxRetries) {
    // Check total timeout before attempting
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= RETRY_CONFIG.MAX_TOTAL_TIMEOUT_MS) {
      const ui = SpreadsheetApp.getUi();
      const errorMessage = `API request timed out after ${Math.round(elapsedTime / 1000)} seconds.\n\n` +
        `Last error: ${lastError?.message || "Maximum timeout exceeded"}\n\n` +
        `Please check your connection and try again.`;
      ui.alert("Request Timeout", errorMessage, ui.ButtonSet.OK);
      throw new Error(`API request exceeded maximum timeout of ${RETRY_CONFIG.MAX_TOTAL_TIMEOUT_MS}ms: ${lastError?.message || "timeout"}`);
    }

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

  // Also create a ZIP archive of the .comapeocat file for easier sharing
  const zipName = `${blob.getName()}.zip`;
  const zipBlob = Utilities.zip([blob], zipName);
  const zipFile = buildsFolderObj.createFile(zipBlob);
  const zipUrl = zipFile.getUrl();
  console.log(`Download the zipped .comapeocat file here: ${zipUrl}`);

  // Return ZIP URL by default
  return zipUrl;
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
 * Safety features:
 * - Validates format before any modifications
 * - Warns user about unexpected formats and requires manual verification
 * - Logs all operations for debugging
 * - Preserves all existing data during column insertion
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
  const ui = SpreadsheetApp.getUi();
  const migrationWarnings: string[] = [];

  // Get or create Metadata sheet first (needed for storing primary language)
  let metadataSheet = spreadsheet.getSheetByName('Metadata');
  if (!metadataSheet) {
    metadataSheet = spreadsheet.insertSheet('Metadata');
    metadataSheet.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]).setFontWeight('bold');
  }

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
      // Accept current flexible format used by this plugin (Name, Icons, Details, Tracks)
      else if (headers.length >= 3 &&
               String(headers[0]).toLowerCase() === 'name' &&
               String(headers[1]).toLowerCase() === 'icons') {
        console.log('Categories sheet in flexible format (Name/Icons/Details/Tracks); skipping migration');
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
      // Check if A1 contains a language name (old pre-v2 format) that needs to be preserved
      else if (headers[0] && headers[0] !== 'Name') {
        const a1Value = String(headers[0]);
        const recognizedLanguages = ['English', 'Español', 'Espanol', 'Português', 'Portugues'];

        if (recognizedLanguages.includes(a1Value)) {
          console.log(`Preserving primary language '${a1Value}' from Categories!A1 before migration`);

          // Store the primary language in Metadata sheet
          const metadataData = metadataSheet.getDataRange().getValues();
          let primaryLanguageExists = false;
          for (let i = 1; i < metadataData.length; i++) {
            if (metadataData[i][0] === 'primaryLanguage') {
              primaryLanguageExists = true;
              break;
            }
          }

          if (!primaryLanguageExists) {
            metadataSheet.appendRow(['primaryLanguage', a1Value]);
            console.log(`Stored primaryLanguage='${a1Value}' in Metadata sheet`);
          }

          // Now proceed with header migration
          // Determine number of columns and update headers accordingly
          if (lastCol === 4) {
            // Old 4-column format: Language Name, Icon, Fields, Color
            categoriesSheet.insertColumnAfter(3);  // Insert ID column
            categoriesSheet.insertColumnAfter(5);  // Insert Icon ID column
            categoriesSheet.getRange(1, 1, 1, 6).setValues([['Name', 'Icon', 'Fields', 'ID', 'Color', 'Icon ID']]).setFontWeight('bold');
            console.log('Migrated from old language-based 4-column format to new 6-column format');
          } else {
            // Just update the A1 header
            categoriesSheet.getRange('A1').setValue('Name');
            console.log('Updated Categories!A1 header from language name to "Name"');
          }
        } else {
          const warning = `Categories sheet has unexpected format (${headers.length} columns: ${headers.join(', ')}). Skipping migration to avoid data loss.`;
          console.warn(warning);
          migrationWarnings.push(warning);
        }
      }
      // Ambiguous format - log warning and skip to prevent data corruption
      else {
        const warning = `Categories sheet has unexpected format (${headers.length} columns: ${headers.join(', ')}). Skipping migration to avoid data loss.`;
        console.warn(warning);
        migrationWarnings.push(warning);
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
      // Accept flexible format (Label, Helper Text, Type, Options)
      else if (headers.length >= 4 &&
               String(headers[0]).toLowerCase() === 'label' &&
               String(headers[1]).toLowerCase() === 'helper text') {
        console.log('Details sheet in flexible format (Label/Helper Text/Type/Options); skipping migration');
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
        const warning = `Details sheet has unexpected format (${headers.length} columns: ${headers.join(', ')}). Skipping migration to avoid data loss.`;
        console.warn(warning);
        migrationWarnings.push(warning);
      }
    }
  }

  // Show warnings to user if any were encountered
  if (migrationWarnings.length > 0) {
    const warningMessage = 'Spreadsheet format warnings detected during migration:\n\n' +
      migrationWarnings.map((w, i) => `${i + 1}. ${w}`).join('\n\n') +
      '\n\nPlease verify your sheet formats match the expected structure:\n' +
      '• Categories: Name, Icon, Fields, ID, Color, Icon ID\n' +
      '• Details: Name, Helper Text, Type, Options, ID, Universal\n\n' +
      'You may need to manually adjust your sheets to match this format.';

    ui.alert(
      'Migration Warnings',
      warningMessage,
      ui.ButtonSet.OK
    );
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
  const locales = buildLocales();
  // Temporarily disable translations until schema matches API v2 expectations
  const translations: TranslationsByLocale = {};

  console.log('Build payload summary', {
    categories: categories.length,
    fields: fields.length,
    icons: icons.length,
    locales: locales.length,
    translations: Object.keys(translations || {}).length
  });

  // Set category selection in exact spreadsheet order
  const categoryIds = categories.map(c => c.id);
  setCategorySelection(categoryIds);

  console.log(`Built payload with ${categories.length} categories, ${fields.length} fields, ${icons.length} icons`);

  return {
    metadata,
    locales,
    categories,
    fields,
    icons: icons.length > 0 ? icons : undefined,
    translations: Object.keys(translations).length > 0 ? translations : undefined
  };
}

/**
 * Builds locales array required by API v2
 * Uses Metadata!primaryLanguage if present, otherwise defaults to 'en'
 */
function buildLocales(): string[] {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const metadataSheet = spreadsheet.getSheetByName('Metadata');

  if (!metadataSheet) {
    return ['en'];
  }

  const data = metadataSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === 'primaryLanguage') {
      const lang = String(data[i][1] || '').trim();
      if (lang) {
        return [lang.toLowerCase()];
      }
    }
  }

  return ['en'];
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

  // Flexible header mapping: supports both legacy and current sheet headers
  const detailsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Details');
  let headerMap: Record<string, number> = {};
  if (detailsSheet) {
    const headers = detailsSheet.getRange(1, 1, 1, detailsSheet.getLastColumn()).getValues()[0];
    headers.forEach((h, idx) => {
      const key = String(h || '').trim().toLowerCase();
      if (key) headerMap[key] = idx;
    });
  }

  const getCol = (...names: string[]): number | undefined => {
    for (const n of names) {
      const key = n.toLowerCase();
      if (headerMap[key] !== undefined) return headerMap[key];
    }
    return undefined;
  };

  const nameCol = getCol('name', 'label') ?? DETAILS_COL.NAME;
  const helperCol = getCol('helper text', 'helper', 'help') ?? DETAILS_COL.HELPER_TEXT;
  const typeCol = getCol('type') ?? DETAILS_COL.TYPE;
  const optionsCol = getCol('options') ?? DETAILS_COL.OPTIONS;
  const idCol = getCol('id') ?? DETAILS_COL.ID;

  return details
    .map((row, index) => {
      const name = String(row[nameCol] || '').trim();
      if (!name) {
        console.log(`Skipping Details row ${index + 2}: empty field name`);
        return null;  // Skip blank rows
      }

      const helperText = String(row[helperCol] || '');
      const typeRaw = String(row[typeCol] || 'text').trim().toLowerCase();
      const optionsStr = String(row[optionsCol] || '');
      const idStr = String(row[idCol] || '').trim();

      let type: FieldType;
      let options: SelectOption[] | undefined;

      switch (typeRaw) {
        case 'm':
        case 'multi':
        case 'multiselect':
          type = 'selectMultiple';
          options = parseOptions(optionsStr);
          break;
        case 'n':
        case 'number':
          type = 'number';
          break;
        case 't':
        case 'text':
          type = 'text';
          break;
        case 'single':
        case 'select':
        case 's':
        case '':
          type = 'selectOne';
          options = parseOptions(optionsStr);
          break;
        default:
          type = 'selectOne';
          options = parseOptions(optionsStr);
      }

      // selectOne/selectMultiple require at least one option; skip invalid rows
      if ((type === 'selectOne' || type === 'selectMultiple') && (!options || options.length === 0)) {
        console.warn(`Skipping Details row ${index + 2}: select field without options`);
        return null;
      }

      return {
        id: idStr || slugify(name),  // Use explicit ID if provided, otherwise slugify name
        tagKey: idStr || slugify(name), // API v2 requires tagKey
        name,
        type,
        description: helperText || undefined,
        options,
        appliesTo: ['observation', 'track']
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

  // Flexible header mapping
  const headerRow = categoriesSheet.getRange(1, 1, 1, categoriesSheet.getLastColumn()).getValues()[0];
  const headerMap: Record<string, number> = {};
  headerRow.forEach((h, idx) => {
    const key = String(h || '').trim().toLowerCase();
    if (key) headerMap[key] = idx;
  });

  const getCol = (...names: string[]): number | undefined => {
    for (const n of names) {
      const key = n.toLowerCase();
      if (headerMap[key] !== undefined) return headerMap[key];
    }
    return undefined;
  };

  const nameCol = getCol('name') ?? CATEGORY_COL.NAME;
  const iconCol = getCol('icon', 'icons') ?? CATEGORY_COL.ICON;
  const fieldsCol = getCol('fields', 'details') ?? CATEGORY_COL.FIELDS;
  const idCol = getCol('id') ?? CATEGORY_COL.ID;
  const colorCol = getCol('color') ?? CATEGORY_COL.COLOR;
  const iconIdCol = getCol('icon id', 'iconid') ?? CATEGORY_COL.ICON_ID;
  const tracksCol = getCol('tracks', 'applies to', 'appliesto');

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

      const iconDataRaw = String(row[iconCol] || '').trim();
      // Icons disabled for now to avoid API SVG validation failures
      const iconData = '';
      const fieldsStr = String(row[fieldsCol] || '');
      const idStr = String(row[idCol] || '').trim();
      const colorStr = String(row[colorCol] || '').trim();
      const iconIdStr = String(row[iconIdCol] || '').trim();

      const appliesRaw = tracksCol !== undefined ? row[tracksCol] : undefined;
      const isTrack = appliesRaw === true || String(appliesRaw).toLowerCase() === 'true';

      // Only use color if explicitly provided in column E or background color
      // Don't force a default - let downstream systems apply their own defaults
      let color: string | undefined;
      if (colorStr) {
        color = colorStr;
      } else if (backgroundColors[index]?.[CATEGORY_COL.COLOR_BACKGROUND] &&
                 backgroundColors[index][CATEGORY_COL.COLOR_BACKGROUND] !== '#ffffff') {
        // Only use background color if it's not white (default empty cell background)
        color = backgroundColors[index][CATEGORY_COL.COLOR_BACKGROUND];
      }
      // If no explicit color, leave undefined to preserve colorless state

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
        appliesTo: [isTrack ? 'track' : 'observation'],
        color,
        iconId: undefined,
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
  // Icons temporarily disabled to avoid server-side SVG parsing errors
  return [];
  // If/when icon handling is re-enabled, restore previous logic with SVG-only validation
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
