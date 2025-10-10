/**
 * Translations application functions for the import category functionality.
 * This file contains functions related to applying translations to the spreadsheet.
 *
 * Uses the createOrClearSheet function from utils.ts
 */

/**
 * Applies translations to the translation sheets.
 * @param spreadsheet - The active spreadsheet
 * @param messages - Messages object with translations
 * @param presets - Array of preset objects
 * @param fields - Array of field objects
 */
function applyTranslations(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  messages: any,
  presets: any[],
  fields: any[],
) {
  // Get language codes (excluding primary language)
  const langCodes = Object.keys(messages);

  // Create translation sheets if they don't exist
  const translationSheets = [
    "Category Translations",
    "Detail Label Translations",
    "Detail Helper Text Translations",
    "Detail Option Translations",
  ];

  translationSheets.forEach((sheetName) => {
    createOrClearSheet(spreadsheet, sheetName);
  });

  // Helper function to set up a translation sheet with headers
  function setupTranslationSheet(
    sheetName: string,
  ): GoogleAppsScript.Spreadsheet.Sheet | null {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) return null;

    // Set headers (English for primary language + any additional languages)
    const headers = langCodes.length > 0 ? ["English", ...langCodes] : ["English"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");

    return sheet;
  }

  // Helper function to apply translations to a sheet
  function applyTranslationsToSheet(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    items: any[],
    getNameFn: (item: any) => string,
    getTranslationFn: (item: any, langCode: string) => string,
  ) {
    // Set up headers (English for primary language + any additional languages)
    const headers = langCodes.length > 0 ? ["English", ...langCodes] : ["English"];

    // Prepare translation rows
    const rows = items.map((item) => {
      const row = [getNameFn(item)];

      // Add translations for each language (if any)
      langCodes.forEach((langCode) => {
        row.push(getTranslationFn(item, langCode));
      });

      return row;
    });

    // Add translation rows
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  }

  // Apply category translations
  const categorySheet = setupTranslationSheet("Category Translations");
  if (categorySheet && presets.length > 0) {
    applyTranslationsToSheet(
      categorySheet,
      presets,
      (preset) => preset.name,
      (preset, langCode) => {
        const langMessages = messages[langCode];
        if (langMessages?.presets?.presets?.[preset.id]?.name) {
          return langMessages.presets.presets[preset.id].name;
        }
        return "";
      },
    );
  }

  // Apply field label translations
  const labelSheet = setupTranslationSheet("Detail Label Translations");
  if (labelSheet && fields.length > 0) {
    applyTranslationsToSheet(
      labelSheet,
      fields,
      (field) => field.label,
      (field, langCode) => {
        const langMessages = messages[langCode];
        if (langMessages?.presets?.fields?.[field.id]?.label) {
          return langMessages.presets.fields[field.id].label;
        }
        return "";
      },
    );
  }

  // Apply field helper text translations
  const helperTextSheet = setupTranslationSheet("Detail Helper Text Translations");
  if (helperTextSheet && fields.length > 0) {
    applyTranslationsToSheet(
      helperTextSheet,
      fields,
      (field) => field.placeholder || "",
      (field, langCode) => {
        const langMessages = messages[langCode];
        if (langMessages?.presets?.fields?.[field.id]?.placeholder) {
          return langMessages.presets.fields[field.id].placeholder;
        }
        return "";
      },
    );
  }

  // Apply field option translations
  const optionSheet = setupTranslationSheet("Detail Option Translations");
  if (optionSheet && fields.length > 0) {
    // For options, we need to handle fields that have options
    const fieldsWithOptions = fields.filter((field) => field.options && field.options.length > 0);

    if (fieldsWithOptions.length > 0) {
      const rows = fieldsWithOptions.map((field) => {
        // Start with field label in primary language
        const primaryOptions = field.options
          .map((opt: any) => opt.label || opt.value)
          .join(", ");
        const row = [primaryOptions];

        // Add options for each additional language (if any)
        langCodes.forEach((langCode) => {
          const langMessages = messages[langCode];
          if (langMessages?.presets?.fields?.[field.id]?.options) {
            const options = field.options
              .map((opt: any) => {
                const optionTranslation = langMessages.presets.fields[field.id].options?.[opt.value];
                return optionTranslation?.label || opt.label;
              })
              .join(", ");
            row.push(options);
          } else {
            row.push("");
          }
        });

        return row;
      });

      // Add rows if we have any
      if (rows.length > 0) {
        const headers = langCodes.length > 0 ? ["English", ...langCodes] : ["English"];
        optionSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
    }
  }
}
