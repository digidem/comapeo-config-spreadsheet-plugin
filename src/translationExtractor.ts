/**
 * Translation extractor module
 * Handles extraction and processing of translations from different file formats
 */

/**
 * Translation entry structure
 */
interface TranslationEntry {
  key: string;          // Original translation key
  normalizedKey: string; // Normalized key for consistent processing
  type: 'preset' | 'field' | 'option' | 'helperText' | 'other'; // Type of translation
  parentKey?: string;   // Parent key (for options)
  message: string;      // Translated text
  description?: string; // Description of the translation
}

/**
 * Normalized translations structure
 */
interface NormalizedTranslations {
  [language: string]: TranslationEntry[];
}

/**
 * Extracts and normalizes translations from different formats
 * @param translationsData - The translations data from the file
 * @returns Normalized translations object
 */
function extractTranslations(translationsData: any): NormalizedTranslations {
  console.log('Extracting translations...');

  // If translationsData is null or undefined, return empty object
  if (!translationsData) {
    console.warn('No translations data provided');
    return {};
  }

  const normalizedTranslations: NormalizedTranslations = {};

  // Process each language
  for (const language in translationsData) {
    console.log(`Processing translations for language: ${language}`);

    // Skip if not an object
    if (typeof translationsData[language] !== 'object') {
      console.warn(`Skipping invalid language data for ${language}`);
      continue;
    }

    normalizedTranslations[language] = [];
    const languageData = translationsData[language];

    // Process each translation key
    for (const key in languageData) {
      try {
        const translationData = languageData[key];

        // Skip if not a valid translation entry
        if (!translationData || typeof translationData !== 'object') {
          console.warn(`Skipping invalid translation data for key: ${key}`);
          continue;
        }

        // Extract message and description
        let message = '';
        if (typeof translationData.message === 'string') {
          message = translationData.message;
        } else if (translationData.message && typeof translationData.message === 'object') {
          // Handle complex message objects (like for options)
          if (translationData.message.label) {
            message = translationData.message.label;
          } else {
            message = JSON.stringify(translationData.message);
          }
        }

        // Clean and validate the message
        message = cleanTranslationText(message);

        // Skip empty messages
        if (!message) {
          console.warn(`Skipping empty translation for key: ${key}`);
          continue;
        }

        // Determine translation type and normalize key
        const { type, normalizedKey, parentKey } = parseTranslationKey(key);

        // Add to normalized translations
        normalizedTranslations[language].push({
          key,
          normalizedKey,
          type,
          parentKey,
          message,
          description: translationData.description || ''
        });
      } catch (error) {
        console.warn(`Error processing translation key ${key}:`, error);
      }
    }

    console.log(`Extracted ${normalizedTranslations[language].length} translations for ${language}`);
  }

  return normalizedTranslations;
}

/**
 * Parses a translation key to determine its type and normalize it
 * @param key - The translation key to parse
 * @returns Object with type, normalized key, and parent key
 */
function parseTranslationKey(key: string): { type: 'preset' | 'field' | 'option' | 'helperText' | 'other'; normalizedKey: string; parentKey?: string } {
  // Default result
  const result = {
    type: 'other' as 'preset' | 'field' | 'option' | 'helperText' | 'other',
    normalizedKey: key,
    parentKey: undefined as string | undefined
  };

  // Handle CoMapeo format keys
  if (key.startsWith('presets.')) {
    // Extract preset key and property
    const parts = key.split('.');
    if (parts.length >= 3) {
      const presetId = parts[1];
      const property = parts[2];

      if (property === 'name') {
        result.type = 'preset';
        result.normalizedKey = presetId;
      }
    }
  } else if (key.startsWith('fields.')) {
    // Extract field key and property
    const parts = key.split('.');
    if (parts.length >= 3) {
      const fieldId = parts[1];
      const property = parts[2];

      if (property === 'label') {
        result.type = 'field';
        result.normalizedKey = fieldId;
      } else if (property === 'helperText') {
        result.type = 'helperText';
        result.normalizedKey = fieldId;
      } else if (property === 'options' && parts.length >= 4) {
        result.type = 'option';
        result.normalizedKey = parts[3]; // Option value
        result.parentKey = fieldId;      // Field ID
      }
    }
  }
  // Handle Mapeo format keys (if different)
  else if (key.includes('/name')) {
    // Mapeo preset name
    const presetId = key.split('/')[0];
    result.type = 'preset';
    result.normalizedKey = presetId;
  } else if (key.includes('/label')) {
    // Mapeo field label
    const fieldId = key.split('/')[0];
    result.type = 'field';
    result.normalizedKey = fieldId;
  } else if (key.includes('/placeholder')) {
    // Mapeo field placeholder (equivalent to helperText)
    const fieldId = key.split('/')[0];
    result.type = 'helperText';
    result.normalizedKey = fieldId;
  } else if (key.includes('/options/')) {
    // Mapeo field option
    const parts = key.split('/');
    if (parts.length >= 3) {
      const fieldId = parts[0];
      const optionId = parts[2];
      result.type = 'option';
      result.normalizedKey = optionId;
      result.parentKey = fieldId;
    }
  }

  return result;
}

/**
 * Cleans and validates translation text
 * @param text - The text to clean
 * @returns Cleaned text
 */
function cleanTranslationText(text: string): string {
  if (!text) return '';

  // Trim whitespace
  let cleaned = text.trim();

  // Replace problematic characters for spreadsheets
  cleaned = cleaned
    .replace(/\\n/g, ' ') // Replace escaped newlines with spaces
    .replace(/\n/g, ' ')  // Replace actual newlines with spaces
    .replace(/\t/g, ' ')  // Replace tabs with spaces
    .replace(/\r/g, '')   // Remove carriage returns
    .replace(/"/g, '""')  // Escape quotes for CSV compatibility
    .replace(/=/g, "'=")  // Prevent formula injection
    .replace(/\+/g, "'+") // Prevent formula injection
    .replace(/^[-@]/g, "'$1"); // Prevent formula injection for cells starting with - or @

  // Remove control characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');

  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned;
}

/**
 * Applies extracted translations to the spreadsheet
 * @param spreadsheet - The active spreadsheet
 * @param normalizedTranslations - The normalized translations object
 * @param presets - Array of preset objects
 * @param fields - Array of field objects
 */
function applyExtractedTranslations(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  normalizedTranslations: NormalizedTranslations,
  presets: any[],
  fields: any[]
) {
  console.log('Applying extracted translations to spreadsheet...');

  // Get language codes
  const langCodes = Object.keys(normalizedTranslations);
  if (langCodes.length === 0) {
    console.log('No translations to apply');
    return;
  }

  console.log(`Found translations for languages: ${langCodes.join(', ')}`);

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
  applyPresetTranslations(spreadsheet, normalizedTranslations, presets, langCodes);

  // Apply field label translations
  applyFieldLabelTranslations(spreadsheet, normalizedTranslations, fields, langCodes);

  // Apply helper text translations
  applyHelperTextTranslations(spreadsheet, normalizedTranslations, fields, langCodes);

  // Apply option translations
  applyOptionTranslations(spreadsheet, normalizedTranslations, fields, langCodes);

  console.log('Translations applied successfully');
}

/**
 * Applies preset (category) translations to the spreadsheet
 * @param spreadsheet - The active spreadsheet
 * @param normalizedTranslations - The normalized translations object
 * @param presets - Array of preset objects
 * @param langCodes - Array of language codes
 */
function applyPresetTranslations(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  normalizedTranslations: NormalizedTranslations,
  presets: any[],
  langCodes: string[]
) {
  const sheetName = 'Category Translations';
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    console.warn(`Sheet ${sheetName} not found`);
    return;
  }

  console.log(`Applying translations to ${sheetName}...`);

  // Set headers
  const headers = ['English', ...langCodes];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  // Prepare category translation rows
  const categoryRows = presets.map(preset => {
    const row = [preset.name];

    // Add translations for each language
    langCodes.forEach(langCode => {
      const translations = normalizedTranslations[langCode];
      const presetTranslations = translations.filter(t =>
        t.type === 'preset' && t.normalizedKey === preset.icon
      );

      // Use the first matching translation or empty string
      const translation = presetTranslations.length > 0 ? presetTranslations[0].message : '';
      row.push(translation);
    });

    return row;
  });

  // Add category translation rows
  if (categoryRows.length > 0) {
    sheet.getRange(2, 1, categoryRows.length, headers.length).setValues(categoryRows);
  }

  console.log(`Applied ${categoryRows.length} category translations`);
}

/**
 * Applies field label translations to the spreadsheet
 * @param spreadsheet - The active spreadsheet
 * @param normalizedTranslations - The normalized translations object
 * @param fields - Array of field objects
 * @param langCodes - Array of language codes
 */
function applyFieldLabelTranslations(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  normalizedTranslations: NormalizedTranslations,
  fields: any[],
  langCodes: string[]
) {
  const sheetName = 'Detail Label Translations';
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    console.warn(`Sheet ${sheetName} not found`);
    return;
  }

  console.log(`Applying translations to ${sheetName}...`);

  // Set headers
  const headers = ['English', ...langCodes];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  // Prepare field label translation rows
  const labelRows = fields.map(field => {
    const row = [field.label];

    // Add translations for each language
    langCodes.forEach(langCode => {
      const translations = normalizedTranslations[langCode];
      const fieldTranslations = translations.filter(t =>
        t.type === 'field' && t.normalizedKey === field.tagKey
      );

      // Use the first matching translation or empty string
      const translation = fieldTranslations.length > 0 ? fieldTranslations[0].message : '';
      row.push(translation);
    });

    return row;
  });

  // Add field label translation rows
  if (labelRows.length > 0) {
    sheet.getRange(2, 1, labelRows.length, headers.length).setValues(labelRows);
  }

  console.log(`Applied ${labelRows.length} field label translations`);
}

/**
 * Applies helper text translations to the spreadsheet
 * @param spreadsheet - The active spreadsheet
 * @param normalizedTranslations - The normalized translations object
 * @param fields - Array of field objects
 * @param langCodes - Array of language codes
 */
function applyHelperTextTranslations(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  normalizedTranslations: NormalizedTranslations,
  fields: any[],
  langCodes: string[]
) {
  const sheetName = 'Detail Helper Text Translations';
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    console.warn(`Sheet ${sheetName} not found`);
    return;
  }

  console.log(`Applying translations to ${sheetName}...`);

  // Set headers
  const headers = ['English', ...langCodes];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  // Prepare helper text translation rows
  const helperRows = fields.filter(field => field.helperText).map(field => {
    const row = [field.helperText];

    // Add translations for each language
    langCodes.forEach(langCode => {
      const translations = normalizedTranslations[langCode];
      const helperTranslations = translations.filter(t =>
        t.type === 'helperText' && t.normalizedKey === field.tagKey
      );

      // Use the first matching translation or empty string
      const translation = helperTranslations.length > 0 ? helperTranslations[0].message : '';
      row.push(translation);
    });

    return row;
  });

  // Add helper text translation rows
  if (helperRows.length > 0) {
    sheet.getRange(2, 1, helperRows.length, headers.length).setValues(helperRows);
  }

  console.log(`Applied ${helperRows.length} helper text translations`);
}

/**
 * Applies option translations to the spreadsheet
 * @param spreadsheet - The active spreadsheet
 * @param normalizedTranslations - The normalized translations object
 * @param fields - Array of field objects
 * @param langCodes - Array of language codes
 */
function applyOptionTranslations(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  normalizedTranslations: NormalizedTranslations,
  fields: any[],
  langCodes: string[]
) {
  const sheetName = 'Detail Option Translations';
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    console.warn(`Sheet ${sheetName} not found`);
    return;
  }

  console.log(`Applying translations to ${sheetName}...`);

  // Set headers
  const headers = ['English', ...langCodes];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

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
      const translations = normalizedTranslations[langCode];
      const optionTranslations = translations.filter(t =>
        t.type === 'option' &&
        t.normalizedKey === option.value &&
        t.parentKey === option.fieldTagKey
      );

      // Use the first matching translation or empty string
      let translation = '';
      if (optionTranslations.length > 0) {
        translation = optionTranslations[0].message;
      }

      row.push(translation);
    });

    return row;
  });

  // Add option translation rows
  if (optionRows.length > 0) {
    sheet.getRange(2, 1, optionRows.length, headers.length).setValues(optionRows);
  }

  console.log(`Applied ${optionRows.length} option translations`);
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
