function processTranslations(data, fields, presets) {
  const messages: CoMapeoTranslations = Object.fromEntries(
    Object.keys(languages()).map(lang => [lang, {}])
  );
  const translationSheets = sheets(true);
  for (const sheetName of translationSheets) {
    const translations = data[sheetName].slice(1);

    for (const [translationIndex, translation] of translations.entries()) {
      const targetLanguages = Object.keys(languages());

      for (let langIndex = 0; langIndex < targetLanguages.length; langIndex++) {
        const lang = targetLanguages[langIndex] as TranslationLanguage;
        const messageType = sheetName.startsWith('Category') ? 'presets' : 'fields';
        const item = messageType === 'fields' ? fields[translationIndex] : presets[translationIndex];
        const key = messageType === 'presets' ? (item as CoMapeoPreset).icon : (item as CoMapeoField).tagKey;

        switch (sheetName) {
          case 'Category Translations':
            messages[lang][`${messageType}.${key}.name`] = {
              message: translation[langIndex + 1],
              description: `Name for preset '${key}'`
            };
            break;
          case 'Detail Label Translations':
            messages[lang][`${messageType}.${key}.label`] = {
              message: translation[langIndex + 1],
              description: `Label for field '${key}'`
            };
            break;
          case 'Detail Helper Text Translations':
            messages[lang][`${messageType}.${key}.helperText`] = {
              message: translation[langIndex + 1],
              description: `Helper text for field '${key}'`
            };
            break;
          case 'Detail Option Translations': {
            const fieldType = getFieldType((item as CoMapeoField).type || '');
            if (fieldType !== 'number' && fieldType !== 'text' && translation[1].trim()) {
              const options = translation[1].split(',').map(opt => opt.trim());
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
  return messages;
}
