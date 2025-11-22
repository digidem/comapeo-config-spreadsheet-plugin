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
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns URL to the saved .comapeocat file
 */
function sendBuildRequest(buildRequest: BuildRequest, maxRetries: number = RETRY_CONFIG.MAX_RETRIES): string {
  const apiUrl = `${API_BASE_URL}/build`;
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= maxRetries) {
    try {
      if (retryCount > 0) {
        const ui = SpreadsheetApp.getUi();
        ui.alert(
          "Retrying API Request",
          `Attempt ${retryCount} of ${maxRetries}. Previous attempt failed: ${lastError?.message || "Unknown error"}`,
          ui.ButtonSet.OK
        );
      }

      console.log(`Sending JSON build request to API (attempt ${retryCount + 1}):`, apiUrl);

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
          return saveComapeocatToDrive(blob, buildRequest.metadata.version);
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
      retryCount++;
      Utilities.sleep(RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, retryCount));
    } catch (error) {
      lastError = error;
      console.error(`Error in API request (attempt ${retryCount + 1}):`, error);
      retryCount++;
      Utilities.sleep(RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, retryCount));
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
 * @param blob - The .comapeocat file blob
 * @param version - Version string for the filename
 * @returns URL to the saved file
 */
function saveComapeocatToDrive(blob: GoogleAppsScript.Base.Blob, version: string): string {
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

  const fileName = `${version}.comapeocat`;
  const file = buildsFolderObj.createFile(blob).setName(fileName);
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
 */
function migrateSpreadsheetFormat(): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Migrate Categories sheet
  const categoriesSheet = spreadsheet.getSheetByName('Categories');
  if (categoriesSheet) {
    const headers = categoriesSheet.getRange(1, 1, 1, categoriesSheet.getLastColumn()).getValues()[0];

    // Check if we need to migrate (old format has "Color" in column D, new format has "ID")
    if (headers[3] === 'Color' || (headers.length === 4 && headers[3] !== 'ID')) {
      console.log('Migrating Categories sheet from 4-column to 6-column format...');

      // Insert column D for ID (this shifts Color from D to E)
      categoriesSheet.insertColumnAfter(3);

      // Insert column F for Icon ID (after the new column E which has Color)
      categoriesSheet.insertColumnAfter(5);

      // Update headers
      categoriesSheet.getRange(1, 1, 1, 6).setValues([['Name', 'Icon', 'Fields', 'ID', 'Color', 'Icon ID']]).setFontWeight('bold');

      console.log('Categories sheet migrated successfully');
    }
  }

  // Migrate Details sheet
  const detailsSheet = spreadsheet.getSheetByName('Details');
  if (detailsSheet) {
    const headers = detailsSheet.getRange(1, 1, 1, detailsSheet.getLastColumn()).getValues()[0];

    // Check if we need to migrate (old format doesn't have "ID" in column E)
    if (headers.length < 5 || headers[4] !== 'ID') {
      console.log('Migrating Details sheet to include ID column...');

      // Insert column E for ID (after OPTIONS in column D)
      detailsSheet.insertColumnAfter(4);

      // Update headers - assume old format was: Name, Helper Text, Type, Options
      // New format: Name, Helper Text, Type, Options, ID, Universal
      const newHeaders = ['Name', 'Helper Text', 'Type', 'Options', 'ID'];
      if (headers.length >= 5) {
        newHeaders.push(headers[5] || 'Universal');  // Preserve Universal if it exists
      } else {
        newHeaders.push('Universal');
      }
      detailsSheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]).setFontWeight('bold');

      console.log('Details sheet migrated successfully');
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

  return details.map(row => {
    const name = String(row[DETAILS_COL.NAME] || '');
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
  });
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
      if (!name) return null;  // Skip blank rows

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
 * Handles both standard languages (en, es, pt) and custom languages ("Name - ISO" format)
 */
function extractLanguagesFromHeaders(headers: any[]): string[] {
  const standardLanguages: Record<string, string> = {
    'English': 'en',
    'Espanol': 'es',
    'Español': 'es',
    'Portugues': 'pt',
    'Português': 'pt'
  };

  const langs: string[] = [];

  // Start from column B (index 1) - column A is source text
  for (let i = TRANSLATION_COL.FIRST_LANGUAGE; i < headers.length; i++) {
    const header = String(headers[i] || '').trim();
    if (!header) continue;

    // Check for custom language format: "Name - ISO"
    const customMatch = header.match(/.*\s*-\s*(\w+)$/);
    if (customMatch) {
      langs.push(customMatch[1].toLowerCase());
      continue;
    }

    // Check for standard language name
    const langCode = standardLanguages[header];
    if (langCode) {
      langs.push(langCode);
      continue;
    }

    // Recognize raw ISO 639-1 codes (2-3 lowercase letters)
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
 */
function buildTranslationsPayload(data: SheetData, categories: Category[], fields: Field[]): TranslationsByLocale {
  const translations: TranslationsByLocale = {};

  const catTransSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Category Translations');
  if (!catTransSheet) return translations;

  const headerRow = catTransSheet.getRange(1, 1, 1, catTransSheet.getLastColumn()).getValues()[0];
  const langs = extractLanguagesFromHeaders(headerRow);

  if (langs.length === 0) return translations;

  console.log(`Found ${langs.length} languages for translations:`, langs);

  // Initialize translations structure
  for (const lang of langs) {
    translations[lang] = { categories: {}, fields: {} };
  }

  // Process category translations - match by name to handle blank rows
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

  // Process field label translations - match by name to handle blank rows
  const labelTrans = data['Detail Label Translations']?.slice(1) || [];
  const detailsData = data.Details?.slice(1) || [];  // Used by helper text and option translations
  const fieldNameToId = new Map(fields.map(f => [f.name, f.id]));
  const fieldNameToField = new Map(fields.map(f => [f.name, f]));
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

  // Process field helper text translations - match by helper text value (column A contains helper text from Details!B)
  const helperTrans = data['Detail Helper Text Translations']?.slice(1) || [];
  // Build map from helper text to field (helper text is what's in Details column B)
  const helperTextToField = new Map<string, Field>();
  for (let i = 0; i < detailsData.length && i < fields.length; i++) {
    const helperText = String(detailsData[i][DETAILS_COL.HELPER_TEXT] || '').trim();
    if (helperText) {
      helperTextToField.set(helperText, fields[i]);
    }
  }

  for (const row of helperTrans) {
    const sourceHelperText = String(row[TRANSLATION_COL.SOURCE_TEXT] || '').trim();
    const field = helperTextToField.get(sourceHelperText);
    if (!field) continue;

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

  // Process field option translations - match by row index (one row per field)
  const optionTrans = data['Detail Option Translations']?.slice(1) || [];
  for (let i = 0; i < optionTrans.length && i < fields.length; i++) {
    const row = optionTrans[i];
    const field = fields[i];
    if (!field || !field.options || field.options.length === 0) continue;

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

  return translations;
}
