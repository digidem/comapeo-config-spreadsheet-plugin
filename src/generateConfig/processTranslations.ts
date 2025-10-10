function processTranslations(data, fields, presets) {
  console.log("Starting processTranslations...");

  // Get languages that actually have translation columns (not all 223 possible languages!)
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    "Category Translations",
  );

  let targetLanguages: string[] = [];
  let columnToLanguageMap: Record<number, string> = {}; // Maps column index to language code (shared across all sheets)

  if (sheet) {
    const lastColumn = sheet.getLastColumn();

    // Guard: Skip if sheet is empty or has no columns
    if (lastColumn === 0) {
      console.warn("⏭️  Category Translations sheet is empty - using only primary language");
      const primaryLanguage = getPrimaryLanguage();
      targetLanguages = [primaryLanguage.code];

      const messages: CoMapeoTranslations = Object.fromEntries(
        targetLanguages.map((lang) => [lang, {}]),
      );
      return messages;
    }

    const headerRow = sheet
      .getRange(1, 1, 1, lastColumn)
      .getValues()[0];

    // Extract language codes from header columns with explicit column index mapping
    // Column A is primary language, columns B onwards are translations
    const allLanguages = getAllLanguages();
    const primaryLanguage = getPrimaryLanguage();

    for (let i = 0; i < headerRow.length; i++) {
      const header = headerRow[i]?.toString().trim();
      if (!header) {
        console.warn(`⚠️  Empty header at column ${i + 1} - skipping`);
        continue;
      }

      // Check if it's a standard language name
      const langCode = Object.entries(allLanguages).find(
        ([code, name]) => name === header
      )?.[0];

      if (langCode) {
        targetLanguages.push(langCode);
        columnToLanguageMap[i] = langCode;
        console.log(`Column ${i} (${header}) → ${langCode}`);
      } else {
        // Check for custom language format: "Language Name - ISO"
        const match = header.match(/.*\s*-\s*(\w+)/);
        if (match) {
          const customLangCode = match[1].trim();
          targetLanguages.push(customLangCode);
          columnToLanguageMap[i] = customLangCode;
          console.log(`Column ${i} (${header}) → ${customLangCode} (custom format)`);
        } else {
          console.warn(`⚠️  Could not parse language from header "${header}" at column ${i + 1}`);
        }
      }
    }

    console.log(`Found ${targetLanguages.length} languages in translation sheet headers:`, targetLanguages);
    console.log(`Column to language mapping:`, columnToLanguageMap);
  } else {
    // No translation sheet exists - only include primary language
    const primaryLanguage = getPrimaryLanguage();
    targetLanguages = [primaryLanguage.code];
    columnToLanguageMap[0] = primaryLanguage.code; // Primary language is in column 0
    console.warn("⏭️  Category Translations sheet not found - using only primary language:", primaryLanguage.code);
  }

  const messages: CoMapeoTranslations = Object.fromEntries(
    targetLanguages.map((lang) => [lang, {}]),
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

    const translations = data[sheetName].slice(1);
    console.log(`Found ${translations.length} translations`);

    // Validation: Check that data columns match expected language count
    if (translations.length > 0) {
      const firstRowColumnCount = translations[0].length;
      if (firstRowColumnCount !== targetLanguages.length) {
        console.error(`❌ COLUMN MISMATCH in "${sheetName}":`, {
          expectedColumns: targetLanguages.length,
          actualColumns: firstRowColumnCount,
          targetLanguages: targetLanguages,
          firstRow: translations[0]
        });
        console.warn(`⚠️  Data has ${firstRowColumnCount} columns but ${targetLanguages.length} languages were detected from headers.`);
        console.warn(`⚠️  This may cause translation data to be assigned to wrong languages!`);
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
