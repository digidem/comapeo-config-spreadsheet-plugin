/**
 * Build column-to-language mapping for a specific translation sheet.
 * This function reads the header row of a sheet and maps column indexes to language codes.
 *
 * @param sheetName - Name of the translation sheet to process
 * @returns Object with targetLanguages array and columnToLanguageMap record
 */
function buildColumnMapForSheet(sheetName: string): {
  targetLanguages: string[];
  columnToLanguageMap: Record<number, string>;
} {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {
    console.warn(`⏭️  Sheet "${sheetName}" not found - using only primary language`);
    const primaryLanguage = getPrimaryLanguage();
    return {
      targetLanguages: [primaryLanguage.code],
      columnToLanguageMap: { 0: primaryLanguage.code },
    };
  }

  const lastColumn = sheet.getLastColumn();

  // Guard: Skip if sheet is empty or has no columns
  if (lastColumn === 0) {
    console.warn(`⏭️  Sheet "${sheetName}" is empty - using only primary language`);
    const primaryLanguage = getPrimaryLanguage();
    return {
      targetLanguages: [primaryLanguage.code],
      columnToLanguageMap: { 0: primaryLanguage.code },
    };
  }

  const headerRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const targetLanguages: string[] = [];
  const columnToLanguageMap: Record<number, string> = {};

  // Extract language codes from header columns with explicit column index mapping
  const allLanguages = getAllLanguages();

  for (let i = 0; i < headerRow.length; i++) {
    const header = headerRow[i]?.toString().trim();
    if (!header) {
      console.warn(`⚠️  Empty header at column ${i + 1} in "${sheetName}" - skipping`);
      continue;
    }

    // Check if it's a standard language name
    const langCode = Object.entries(allLanguages).find(
      ([code, name]) => name === header
    )?.[0];

    if (langCode) {
      targetLanguages.push(langCode);
      columnToLanguageMap[i] = langCode;
      console.log(`[${sheetName}] Column ${i} (${header}) → ${langCode}`);
    } else {
      // Check for custom language format: "Language Name - ISO"
      const match = header.match(/.*\s*-\s*(\w+)/);
      if (match) {
        const customLangCode = match[1].trim();
        targetLanguages.push(customLangCode);
        columnToLanguageMap[i] = customLangCode;
        console.log(`[${sheetName}] Column ${i} (${header}) → ${customLangCode} (custom format)`);
      } else {
        console.warn(`⚠️  Could not parse language from header "${header}" at column ${i + 1} in "${sheetName}"`);
      }
    }
  }

  console.log(`[${sheetName}] Found ${targetLanguages.length} languages:`, targetLanguages);
  console.log(`[${sheetName}] Column mapping:`, columnToLanguageMap);

  return { targetLanguages, columnToLanguageMap };
}

/**
 * Processes all translation sheets and generates CoMapeo translations object
 *
 * Reads translation data from Category Translations, Detail Label Translations,
 * Detail Helper Text Translations, and Detail Option Translations sheets.
 * Maps each language to its corresponding translations for categories, fields,
 * and options.
 *
 * @param data - Spreadsheet data object
 * @param fields - Array of processed CoMapeo fields
 * @param presets - Array of processed CoMapeo presets
 * @returns CoMapeoTranslations object with language codes as keys
 *
 * @example
 * const translations = processTranslations(data, fields, presets);
 * // Returns: { "en": {...}, "es": {...}, "fr": {...} }
 */
function processTranslations(data, fields, presets) {
  console.log("Starting processTranslations...");

  // Build initial column map from Category Translations to determine available languages
  const initialMapping = buildColumnMapForSheet("Category Translations");

  // Early return if Category Translations is empty
  if (initialMapping.targetLanguages.length === 1 &&
      initialMapping.targetLanguages[0] === getPrimaryLanguage().code) {
    const categorySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Category Translations");
    if (!categorySheet || categorySheet.getLastColumn() === 0) {
      console.warn("⏭️  Category Translations sheet is empty - using only primary language");
      const messages: CoMapeoTranslations = Object.fromEntries(
        initialMapping.targetLanguages.map((lang) => [lang, {}]),
      );
      return messages;
    }
  }

  // Initialize messages object for all detected languages
  const messages: CoMapeoTranslations = Object.fromEntries(
    initialMapping.targetLanguages.map((lang) => [lang, {}]),
  );

  const translationSheets = sheets(true);
  console.log("Processing translation sheets:", translationSheets);

  for (const sheetName of translationSheets) {
    console.log(`\nProcessing sheet: ${sheetName}`);

    // Guard check: Skip if translation sheet data doesn't exist
    if (!data[sheetName]) {
      console.warn(`⏭️  Skipping sheet "${sheetName}" - sheet data not found (translation may have been skipped)`);
      continue;
    }

    // Build column map for THIS specific sheet (defense against manual edits)
    const { targetLanguages, columnToLanguageMap } = buildColumnMapForSheet(sheetName);

    const translations = data[sheetName].slice(1);
    console.log(`Found ${translations.length} translations`);

    // Validation: Check that data columns match expected language count
    if (translations.length > 0) {
      const firstRowColumnCount = translations[0].length;

      // Missing columns is an ERROR - translations will be incomplete
      if (firstRowColumnCount < targetLanguages.length) {
        console.error(`❌ MISSING COLUMNS in "${sheetName}":`, {
          expectedLanguages: targetLanguages.length,
          actualColumns: firstRowColumnCount,
          missingColumns: targetLanguages.length - firstRowColumnCount,
          targetLanguages: targetLanguages,
          firstRow: translations[0]
        });
        console.error(`⚠️  Translation data incomplete - ${targetLanguages.length - firstRowColumnCount} language(s) missing!`);
        console.error(`⚠️  Missing languages will have no translations for this sheet.`);
      }
      // Extra columns is just INFO - likely metadata columns, will be ignored
      else if (firstRowColumnCount > targetLanguages.length) {
        console.log(`ℹ️  Extra columns detected in "${sheetName}":`, {
          expectedLanguages: targetLanguages.length,
          actualColumns: firstRowColumnCount,
          extraColumns: firstRowColumnCount - targetLanguages.length,
        });
        console.log(`ℹ️  Extra columns will be ignored (likely metadata). Translation processing continues normally.`);
      }
    }

    for (
      let translationIndex = 0;
      translationIndex < translations.length;
      translationIndex++
    ) {
      const translationRow = translations[translationIndex];
      const translation = translationRow.map((t) => t.toString().trim());
      console.log(
        `\nProcessing translation ${translationIndex + 1}/${translations.length}:`,
        translation,
      );
      // Use explicit column mapping to handle gaps and ensure correct language assignment
      for (const [columnIndex, lang] of Object.entries(columnToLanguageMap)) {
        const colIdx = parseInt(columnIndex);
        const translationValue = translation[colIdx];

        // Defensive check: skip if translation value is missing
        if (translationValue === undefined || translationValue === null) {
          console.warn(`⚠️  Missing translation value at column ${colIdx} for language ${lang}`);
          continue;
        }

        const messageType = sheetName.startsWith("Category")
          ? "presets"
          : "fields";
        const item =
          messageType === "fields"
            ? fields[translationIndex]
            : presets[translationIndex];
        const key =
          messageType === "presets"
            ? (item as CoMapeoPreset).icon
            : (item as CoMapeoField).tagKey;

        console.log(
          `Processing ${messageType} for language: ${lang} (column ${colIdx}), key: ${key}`,
        );

        switch (sheetName) {
          case "Category Translations":
            messages[lang][`${messageType}.${key}.name`] = {
              message: translationValue,
              description: `Name for preset '${key}'`,
            };
            console.log(`Added category translation for ${key}: "${translationValue}"`);
            break;
          case "Detail Label Translations":
            messages[lang][`${messageType}.${key}.label`] = {
              message: translationValue,
              description: `Label for field '${key}'`,
            };
            console.log(`Added label translation for ${key}: "${translationValue}"`);
            break;
          case "Detail Helper Text Translations":
            messages[lang][`${messageType}.${key}.helperText`] = {
              message: translationValue,
              description: `Helper text for field '${key}'`,
            };
            console.log(`Added helper text translation for ${key}: "${translationValue}"`);
            break;
          case "Detail Option Translations": {
            const fieldType = getFieldType((item as CoMapeoField).type || "");
            console.log(`Processing options for field type: ${fieldType}`);

            if (
              fieldType !== "number" &&
              fieldType !== "text" &&
              translationValue &&
              translationValue.trim()
            ) {
              const options = translationValue
                .split(",")
                .map((opt) => opt.trim());
              console.log(`Found ${options.length} options to process`);

              for (const [optionIndex, option] of options.entries()) {
                if (item.options?.[optionIndex]) {
                  const optionKey = `${messageType}.${key}.options.${item.options[optionIndex].value}`;
                  const optionValue = {
                    message: {
                      label: option,
                      value: item.options[optionIndex].value,
                    },
                    description: `Option '${option}' for field '${(item as CoMapeoField).label}'`,
                  };
                  messages[lang][optionKey] = optionValue;
                  console.log(`Added option translation: ${option} for ${key}`);
                }
              }
            }
            break;
          }
          default:
            console.log(`Unhandled sheet name: ${sheetName}`);
            break;
        }
      }
    }
  }

  console.log("\nTranslation processing complete");
  console.log(
    "Messages per language:",
    Object.keys(messages).map(
      (lang) => `${lang}: ${Object.keys(messages[lang]).length} messages`,
    ),
  );

  return messages;
}
