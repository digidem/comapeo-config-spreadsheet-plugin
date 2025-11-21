/**
 * CoMapeo Config API Service v2.0.0
 * JSON-only build endpoint, no ZIP workflow
 */

const API_BASE_URL = "http://137.184.153.36:3000";

/**
 * Sends a JSON build request to the API and returns the .comapeocat file
 *
 * @param buildRequest - The build request payload
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns URL to the saved .comapeocat file
 */
function sendBuildRequest(buildRequest: BuildRequest, maxRetries: number = 3): string {
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
      Utilities.sleep(1000 * Math.pow(2, retryCount));
    } catch (error) {
      lastError = error;
      console.error(`Error in API request (attempt ${retryCount + 1}):`, error);
      retryCount++;
      Utilities.sleep(1000 * Math.pow(2, retryCount));
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

/**
 * Creates a BuildRequest payload from spreadsheet data
 *
 * @param data - Spreadsheet data
 * @returns BuildRequest payload ready for API
 */
function createBuildPayload(data: SheetData): BuildRequest {
  const fields = buildFields(data);
  const categories = buildCategories(data, fields);
  const icons = buildIcons();
  const metadata = buildMetadata(data);
  const translations = buildTranslationsPayload(data, categories, fields);

  // Set category selection in exact spreadsheet order
  const categoryIds = categories.map(c => c.id);
  setCategorySelection(categoryIds);

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
 */
function buildMetadata(data: SheetData): Metadata {
  const documentName = data.documentName?.[0]?.[0] || "Unnamed Config";
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
          const newVersion = Utilities.formatDate(new Date(), 'UTC', 'yy.MM.dd');
          metadataSheet.getRange(i + 1, 2).setValue(newVersion);
          return newVersion;
        }
        return String(sheetData[i][1]);
      }
    }
    metadataSheet.appendRow([key, defaultVal]);
    return defaultVal;
  };

  const name = getValue('name', `config-${slugify(String(documentName))}`);
  const version = getValue('version', Utilities.formatDate(new Date(), 'UTC', 'yy.MM.dd'));
  const description = getValue('description', '');

  return {
    name,
    version,
    description: description || undefined,
    builderName: "comapeo-config-spreadsheet-plugin",
    builderVersion: "2.0.0"
  };
}

/**
 * Builds fields array from Details sheet
 */
function buildFields(data: SheetData): Field[] {
  const details = data.Details?.slice(1) || [];
  return details.map(row => {
    const name = String(row[0] || '');
    const helperText = String(row[1] || '');
    const typeStr = String(row[2] || 't').charAt(0).toLowerCase();
    const optionsStr = String(row[3] || '');

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
      case 't':
        type = 'text';
        break;
      default:
        type = 'select';
        options = parseOptions(optionsStr);
    }

    const field: Field = {
      id: slugify(name),
      name,
      type,
      description: helperText || undefined,
      options
    };

    return field;
  });
}

/**
 * Parses comma-separated options string into SelectOption array
 */
function parseOptions(optionsStr: string): SelectOption[] | undefined {
  if (!optionsStr) return undefined;
  const opts = optionsStr.split(',').map(s => s.trim()).filter(Boolean);
  if (opts.length === 0) return undefined;
  return opts.map(opt => ({
    value: slugify(opt),
    label: opt
  }));
}

/**
 * Builds categories array from Categories sheet
 */
function buildCategories(data: SheetData, fields: Field[]): Category[] {
  const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  const categories = data.Categories?.slice(1) || [];

  if (!categoriesSheet || categories.length === 0) {
    return [];
  }

  const backgroundColors = categoriesSheet.getRange(2, 1, categories.length, 1).getBackgrounds();

  return categories.map((row, index) => {
    const name = String(row[0] || '');
    const fieldsStr = String(row[2] || '');
    const color = backgroundColors[index]?.[0] || '#0000FF';

    const defaultFieldIds = fieldsStr
      ? fieldsStr.split(',').map(f => slugify(f.trim())).filter(Boolean)
      : undefined;

    const category: Category = {
      id: slugify(name),
      name,
      color,
      defaultFieldIds: defaultFieldIds && defaultFieldIds.length > 0 ? defaultFieldIds : undefined
    };

    return category;
  });
}

/**
 * Builds icons array from processed icons
 */
function buildIcons(): Icon[] {
  const icons: Icon[] = [];
  const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');

  if (!categoriesSheet) return icons;

  const data = categoriesSheet.getDataRange().getValues().slice(1);

  for (const row of data) {
    const name = String(row[0] || '');
    const iconUrlOrData = String(row[1] || '');

    if (name && iconUrlOrData) {
      const iconId = slugify(name);

      if (iconUrlOrData.startsWith('<svg')) {
        icons.push({ id: iconId, svgData: iconUrlOrData });
      } else if (iconUrlOrData.startsWith('http')) {
        icons.push({ id: iconId, svgUrl: iconUrlOrData });
      }
    }
  }

  return icons;
}

/**
 * Builds translations payload from translation sheets
 */
function buildTranslationsPayload(data: SheetData, categories: Category[], fields: Field[]): TranslationsByLocale {
  const translations: TranslationsByLocale = {};

  // Get languages from Category Translations header
  const catTransSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Category Translations');
  if (!catTransSheet) return translations;

  const headerRow = catTransSheet.getRange(1, 1, 1, catTransSheet.getLastColumn()).getValues()[0];
  const langs: string[] = [];

  for (let i = 3; i < headerRow.length; i++) {
    const header = String(headerRow[i] || '');
    const match = header.match(/.*\s*-\s*(\w+)/);
    if (match) {
      langs.push(match[1].trim());
    }
  }

  if (langs.length === 0) return translations;

  // Initialize translations structure
  for (const lang of langs) {
    translations[lang] = { categories: {}, fields: {} };
  }

  // Process category translations
  const catTrans = data['Category Translations']?.slice(1) || [];
  for (let i = 0; i < catTrans.length && i < categories.length; i++) {
    const catId = categories[i].id;
    for (let j = 0; j < langs.length; j++) {
      const value = String(catTrans[i][j + 1] || '').trim();
      if (value && translations[langs[j]].categories) {
        translations[langs[j]].categories![catId] = { name: value };
      }
    }
  }

  // Process field label translations
  const labelTrans = data['Detail Label Translations']?.slice(1) || [];
  for (let i = 0; i < labelTrans.length && i < fields.length; i++) {
    const fieldId = fields[i].id;
    for (let j = 0; j < langs.length; j++) {
      const value = String(labelTrans[i][j + 1] || '').trim();
      if (value && translations[langs[j]].fields) {
        if (!translations[langs[j]].fields![fieldId]) {
          translations[langs[j]].fields![fieldId] = {};
        }
        translations[langs[j]].fields![fieldId].name = value;
      }
    }
  }

  // Process field helper text translations
  const helperTrans = data['Detail Helper Text Translations']?.slice(1) || [];
  for (let i = 0; i < helperTrans.length && i < fields.length; i++) {
    const fieldId = fields[i].id;
    for (let j = 0; j < langs.length; j++) {
      const value = String(helperTrans[i][j + 1] || '').trim();
      if (value && translations[langs[j]].fields) {
        if (!translations[langs[j]].fields![fieldId]) {
          translations[langs[j]].fields![fieldId] = {};
        }
        translations[langs[j]].fields![fieldId].description = value;
      }
    }
  }

  // Process field option translations
  const optionTrans = data['Detail Option Translations']?.slice(1) || [];
  for (let i = 0; i < optionTrans.length && i < fields.length; i++) {
    const field = fields[i];
    if (!field.options) continue;

    const fieldId = field.id;
    for (let j = 0; j < langs.length; j++) {
      const optStr = String(optionTrans[i][j + 1] || '').trim();
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
