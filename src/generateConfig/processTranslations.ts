function processTranslations(data, fields, presets) {
  const messages = { es: {}, pt: {} };
  const translationSheets = [
    'Category Translations',
    'Detail Label Translations',
    'Detail Helper Text Translations',
    'Detail Option Translations'
  ];

  translationSheets.forEach(sheetName => {
    const translations = data[sheetName].slice(1);

    translations.forEach((translation, translationIndex) => {
      const languages: TranslationLanguage[] = ['es', 'pt'];

      languages.forEach((lang, langIndex) => {
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
          case 'Detail Option Translations':
            const fieldType = getFieldType((item as CoMapeoField).type || '');
            if (fieldType !== 'number' && fieldType !== 'text' && translation[1].trim()) {
              const options = translation[1].split(',').map(opt => opt.trim());
              options.forEach((option, optionIndex) => {
                if (item.options && item.options[optionIndex]) {
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
              });
            }
            break;
          default:
            console.log(`Unhandled sheet name: ${sheetName}`);
            break;
        }
      });
    });
  });
  return messages;
}
