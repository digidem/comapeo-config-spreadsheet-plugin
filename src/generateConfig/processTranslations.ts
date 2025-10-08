function processTranslations(data, fields, presets) {
  console.log("Starting processTranslations...");

  // Get languages that actually have translation columns (not all 223 possible languages!)
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    "Category Translations",
  );

  let targetLanguages: string[] = [];

  if (sheet) {
    const headerRow = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];

    // Extract language codes from header columns
    // Column A is primary language, columns B onwards are translations
    const allLanguages = getAllLanguages();
    const primaryLanguage = getPrimaryLanguage();

    for (let i = 0; i < headerRow.length; i++) {
      const header = headerRow[i]?.toString().trim();
      if (!header) continue;

      // Check if it's a standard language name
      const langCode = Object.entries(allLanguages).find(
        ([code, name]) => name === header
      )?.[0];

      if (langCode) {
        targetLanguages.push(langCode);
      } else {
        // Check for custom language format: "Language Name - ISO"
        const match = header.match(/.*\s*-\s*(\w+)/);
        if (match) {
          targetLanguages.push(match[1].trim());
        }
      }
    }

    console.log(`Found ${targetLanguages.length} languages in translation sheet headers:`, targetLanguages);
  } else {
    // No translation sheet exists - only include primary language
    const primaryLanguage = getPrimaryLanguage();
    targetLanguages = [primaryLanguage.code];
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
      for (let langIndex = 0; langIndex < targetLanguages.length; langIndex++) {
        const lang = targetLanguages[langIndex] as TranslationLanguage;
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
          `Processing ${messageType} for language: ${lang}, key: ${key}`,
        );

        switch (sheetName) {
          case "Category Translations":
            messages[lang][`${messageType}.${key}.name`] = {
              message: translation[langIndex + 1],
              description: `Name for preset '${key}'`,
            };
            console.log(`Added category translation for ${key}`);
            break;
          case "Detail Label Translations":
            messages[lang][`${messageType}.${key}.label`] = {
              message: translation[langIndex + 1],
              description: `Label for field '${key}'`,
            };
            console.log(`Added label translation for ${key}`);
            break;
          case "Detail Helper Text Translations":
            messages[lang][`${messageType}.${key}.helperText`] = {
              message: translation[langIndex + 1],
              description: `Helper text for field '${key}'`,
            };
            console.log(`Added helper text translation for ${key}`);
            break;
          case "Detail Option Translations": {
            const fieldType = getFieldType((item as CoMapeoField).type || "");
            console.log(`Processing options for field type: ${fieldType}`);

            if (
              fieldType !== "number" &&
              fieldType !== "text" &&
              translation[1].trim()
            ) {
              const options = translation[1]
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
