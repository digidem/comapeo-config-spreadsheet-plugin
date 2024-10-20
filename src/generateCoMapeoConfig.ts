/**
 * Converts a string to a slug format.
 * @param str The input string to be converted.
 * @returns The slugified string.
 */
function slugify(input: any): string {
  const str = typeof input === 'string' ? input : String(input);
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}


function generateCoMapeoConfig() {
  const data = getSpreadsheetData();
  const config = processDataForCoMapeo(data);
  const folderUrl = saveConfigToDrive(config);
  showDownloadLink(folderUrl);
}

function processDataForCoMapeo(data: SheetData): CoMapeoConfig {
  const fields = processFields(data);
  const presets = processPresets(data);
  return {
    fields,
    presets,
    messages: processTranslations(data, fields, presets)
  };
}

function processPresets(data: SheetData): CoMapeoPreset[] {
  const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  const categories = data['Categories'].slice(1);
  const backgroundColors = categoriesSheet.getRange(2, 1, categories.length, 1).getBackgrounds();

  return categories.map((category, index) => ({
    icon: slugify(category[0]),
    color: backgroundColors[index][0] || '#0000FF',
    fields: category[3] ? category[3].split(',').map(f => slugify(f.trim())) : [],
    geometry: ['point', 'line', 'area'],
    tags: { [slugify(category[0])]: 'yes' },
    name: category[0],
    sort: index + 1
  }));
}

function processFields(data: SheetData): CoMapeoField[] {
  const details = data['Details'].slice(1);
  return details.map(detail => ({
    tagKey: slugify(detail[0]),
    type: getFieldType(detail[2]),
    label: detail[0],
    helperText: detail[1],
    options: getFieldOptions(detail[2], detail[3]),
    universal: detail[5] === 'TRUE'
  }));
}

function processTranslations(data: SheetData, fields: CoMapeoField[], presets: CoMapeoPreset[]): CoMapeoTranslations {
  const messages: CoMapeoTranslations = { es: {}, pt: {} };
  const translationSheets = [
    'Category Translations',
    'Detail Label Translations',
    'Detail Helper Text Translations',
    'Detail Option Translations'
  ];

  // Iterate through each translation sheet
  translationSheets.forEach(sheetName => {
    // Get translations from the current sheet, excluding the header row
    const translations = data[sheetName].slice(1);

    // Process each translation row
    translations.forEach((translation, translationIndex) => {
      const languages: TranslationLanguage[] = ['es', 'pt'];

      // Process translations for each language
      languages.forEach((lang, langIndex) => {
        // Determine message type based on sheet name
        const messageType = sheetName.startsWith('Category') ? 'presets' : 'fields';

        // Get the corresponding item (field or preset)
        const item = messageType === 'fields' ? fields[translationIndex] : presets[translationIndex];

        // Determine the key based on message type
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
                  messages[lang][optionKey] = optionValue
                }
              });
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


function getFieldType(typeString: string): string {
  const firstChar = typeString.charAt(0).toLowerCase();
  if (firstChar === 'm') return 'select_multiple';
  if (firstChar === 'n') return 'number';
  if (firstChar === 't') return 'text';
  return 'select_one';
}

function getFieldOptions(typeString: string, optionsString: string): Array<{ label: string; value: string }> | undefined {
  const fieldType = getFieldType(typeString);
  if (fieldType === 'number' || fieldType === 'text') return undefined;
  return optionsString.split(',').map(opt => ({ label: opt.trim(), value: slugify(opt.trim()) }));
}
