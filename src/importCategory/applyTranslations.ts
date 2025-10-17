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
  const primaryLanguage =
    typeof getPrimaryLanguage === "function"
      ? getPrimaryLanguage()
      : { code: "en", name: "English" };

  let languageNameMap: Record<string, string> = {};
  if (typeof getAllLanguages === "function") {
    try {
      languageNameMap = getAllLanguages();
    } catch (error) {
      console.log("Unable to load language names", error);
    }
  }

  const uniqueStrings = (values: Array<string | undefined>): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];
    values.forEach((value) => {
      if (value && typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed && !seen.has(trimmed)) {
          seen.add(trimmed);
          result.push(trimmed);
        }
      }
    });
    return result;
  };

  const getPresetMessage = (
    langMessages: any,
    preset: any,
    properties: string[],
  ): string => {
    if (!langMessages || !langMessages.presets) {
      return "";
    }

    const presetMaps = [langMessages.presets.presets, langMessages.presets.categories];
    const identifiers = uniqueStrings([preset?.id, preset?.icon, preset?.name]);

    for (const map of presetMaps) {
      if (!map || typeof map !== "object") continue;
      for (const id of identifiers) {
        const entry = map[id];
        if (!entry || typeof entry !== "object") continue;
        for (const property of properties) {
          const value = entry[property];
          if (typeof value === "string" && value.trim() !== "") {
            return value;
          }
        }
      }
    }
    return "";
  };

  const getFieldEntry = (langMessages: any, field: any): any => {
    const fieldMap = langMessages?.presets?.fields;
    if (!fieldMap || typeof fieldMap !== "object") {
      return undefined;
    }
    const identifiers = uniqueStrings([
      field?.id,
      field?.tagKey,
      field?.key,
      typeof field?.label === "string" ? field.label : undefined,
    ]);
    for (const id of identifiers) {
      const entry = fieldMap[id];
      if (entry) {
        return entry;
      }
    }
    return undefined;
  };

  const getFieldMessage = (
    langMessages: any,
    field: any,
    properties: string[],
  ): string => {
    const entry = getFieldEntry(langMessages, field);
    if (!entry || typeof entry !== "object") {
      return "";
    }
    for (const property of properties) {
      const value = entry[property];
      if (typeof value === "string" && value.trim() !== "") {
        return value;
      }
    }
    return "";
  };

  const getFieldOptionLabel = (
    langMessages: any,
    field: any,
    optionValue: string,
  ): string => {
    const entry = getFieldEntry(langMessages, field);
    const optionEntry = entry?.options?.[optionValue];
    if (!optionEntry) {
      return "";
    }
    if (typeof optionEntry === "string") {
      return optionEntry;
    }
    if (typeof optionEntry.label === "string") {
      return optionEntry.label;
    }
    return "";
  };

  const languageHasTranslations = (langMessages: any): boolean => {
    if (!langMessages || typeof langMessages !== "object") {
      return false;
    }

    for (const preset of presets) {
      const message = getPresetMessage(langMessages, preset, ["name", "label"]);
      if (message) {
        return true;
      }
    }

    for (const field of fields) {
      const labelMessage = getFieldMessage(langMessages, field, ["label", "name"]);
      if (labelMessage) {
        return true;
      }
      const helperMessage = getFieldMessage(langMessages, field, ["placeholder", "helperText", "description"]);
      if (helperMessage) {
        return true;
      }
      if (Array.isArray(field?.options) && field.options.length > 0) {
        for (const opt of field.options) {
          const optionLabel = getFieldOptionLabel(langMessages, field, opt.value);
          if (optionLabel && optionLabel.trim() !== "") {
            return true;
          }
        }
      }
    }

    return false;
  };

  const langCodes = Object.entries(messages || {})
    .filter(([code, langMessages]) => code !== primaryLanguage.code && languageHasTranslations(langMessages))
    .map(([code]) => code);

  const formatLanguageHeader = (code: string): string => {
    const displayName = languageNameMap?.[code];
    if (displayName && displayName.trim() !== "") {
      return `${displayName} (${code})`;
    }
    return code;
  };

  const headers = [primaryLanguage.name, ...langCodes.map(formatLanguageHeader)];

  const translationSheets = [
    "Category Translations",
    "Detail Label Translations",
    "Detail Helper Text Translations",
    "Detail Option Translations",
  ];

  translationSheets.forEach((sheetName) => {
    createOrClearSheet(spreadsheet, sheetName);
  });

  function setupTranslationSheet(
    sheetName: string,
  ): GoogleAppsScript.Spreadsheet.Sheet | null {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) return null;

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");

    return sheet;
  }

  function applyTranslationsToSheet(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    items: any[],
    getNameFn: (item: any) => string,
    getTranslationFn: (item: any, langCode: string) => string,
  ) {
    const rows = items.map((item) => {
      const row = [getNameFn(item)];
      langCodes.forEach((langCode) => {
        row.push(getTranslationFn(item, langCode));
      });
      return row;
    });

    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
  }

  const categorySheet = setupTranslationSheet("Category Translations");
  if (categorySheet && presets.length > 0) {
    applyTranslationsToSheet(
      categorySheet,
      presets,
      (preset) => preset.name,
      (preset, langCode) => {
        const langMessages = messages[langCode];
        return getPresetMessage(langMessages, preset, ["name", "label"]);
      },
    );
  }

  const labelSheet = setupTranslationSheet("Detail Label Translations");
  if (labelSheet && fields.length > 0) {
    applyTranslationsToSheet(
      labelSheet,
      fields,
      (field) => field.label,
      (field, langCode) => {
        const langMessages = messages[langCode];
        return getFieldMessage(langMessages, field, ["label", "name"]);
      },
    );
  }

  const helperTextSheet = setupTranslationSheet("Detail Helper Text Translations");
  if (helperTextSheet && fields.length > 0) {
    applyTranslationsToSheet(
      helperTextSheet,
      fields,
      (field) => field.helperText || field.placeholder || "",
      (field, langCode) => {
        const langMessages = messages[langCode];
        return getFieldMessage(langMessages, field, ["placeholder", "helperText", "description"]);
      },
    );
  }

  const optionSheet = setupTranslationSheet("Detail Option Translations");
  if (optionSheet && fields.length > 0) {
    const fieldsWithOptions = fields.filter((field) => field.options && field.options.length > 0);

    if (fieldsWithOptions.length > 0) {
      const rows = fieldsWithOptions.map((field) => {
        const primaryOptions = field.options
          .map((opt: any) => opt.label || opt.value)
          .join(", ");
        const row = [primaryOptions];

        langCodes.forEach((langCode) => {
          const langMessages = messages[langCode];
          const options = field.options
            .map((opt: any) => {
              const translated = getFieldOptionLabel(langMessages, field, opt.value);
              return translated || opt.label || opt.value;
            })
            .join(", ");
          row.push(options);
        });

        return row;
      });

      if (rows.length > 0) {
        optionSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
    }
  }
}
