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
  return {
    fields: processFields(data),
    presets: processPresets(data),
    messages: processTranslations(data)
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

function processTranslations(data: SheetData): CoMapeoTranslations {
  const messages: CoMapeoTranslations = { es: {}, pt: {} };
  const translationSheets = [
    'Category Translations',
    'Detail Label Translations',
    'Detail Helper Text Translations',
    'Detail Option Translations'
  ];

  translationSheets.forEach(sheetName => {
    const translations = data[sheetName].slice(1);
    translations.forEach(translation => {
      const key = slugify(translation[0]);
      const languages: TranslationLanguage[] = ['es', 'pt'];
      
      languages.forEach((lang, index) => {
        const { messageKey, description } = getMessageKeyAndDescription(sheetName, key, translation);
        if (messageKey) {
          messages[lang][messageKey] = {
            description,
            message: getTranslationMessage(sheetName, translation, index)
          };
        }
      });
    });
  });

  return messages;
}

function getMessageKeyAndDescription(sheetName: string, key: string, translation: any[]): { messageKey: string; description: string } {
  switch (sheetName) {
    case 'Category Translations':
      return { messageKey: `presets.${key}.name`, description: `Name for preset '${key}'` };
    case 'Detail Label Translations':
      return { messageKey: `fields.${key}.label`, description: `Label for field '${key}'` };
    case 'Detail Helper Text Translations':
      return { messageKey: `fields.${key}.placeholder`, description: `An example to guide the user for field '${key}'` };
    case 'Detail Option Translations':
      const fieldType = getFieldType(translation[2]);
      if (fieldType !== 'number' && fieldType !== 'text') {
        const optionValue = slugify(translation[1]);
        return { messageKey: `fields.${key}.options.${optionValue}`, description: `Label for option '${optionValue}' for field '${key}'` };
      }
    default:
      return { messageKey: '', description: '' };
  }
}

function getTranslationMessage(sheetName: string, translation: any[], index: number): string | { label: string; value: string } {
  if (sheetName === 'Detail Option Translations') {
    return { label: translation[index + 1], value: translation[index + 1] };
  }
  return translation[index + 1];
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
  return optionsString.split(',').map(opt => ({ label: opt.trim(), value: opt.trim() }));
}

function processDataForCoMapeo(data: SheetData): CoMapeoConfig {
  const config: CoMapeoConfig = {
    fields: [],
    presets: [],
    messages: {
      es: {},
      pt: {}
    }
  };

  // Process Categories
  const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  const categories = data['Categories'].slice(1);
  const backgroundColors = categoriesSheet.getRange(2, 1, categories.length, 1).getBackgrounds();

  categories.forEach((category, index) => {
    const fields = category[3] ? category[3].split(',').map(f => slugify(f.trim())) : [];
    const preset: CoMapeoPreset = {
      icon: slugify(category[0]),
      color: backgroundColors[index][0] || '#0000FF', // Use the background color or default to blue
      fields,
      geometry: ['point', 'line', 'area'],
      tags: { [slugify(category[0])]: 'yes' },
      name: category[0],
      sort: index + 1 // Add sort according to index + 1
    };
    config.presets.push(preset);
  });
  // Process Details
  const details = data['Details'].slice(1);

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
    return optionsString.split(',').map(opt => ({ label: opt.trim(), value: opt.trim() }));
  }

  details.forEach(detail => {
    const fieldType = getFieldType(detail[2]);
    const field: CoMapeoField = {
      tagKey: slugify(detail[0]),
      type: fieldType,
      label: detail[0],
      helperText: detail[1],
      options: getFieldOptions(detail[2], detail[3]),
      universal: detail[5] === 'TRUE'
    };
    config.fields.push(field);
  });

  // Process Translations
  const translationSheets = [
    'Category Translations',
    'Detail Label Translations',
    'Detail Helper Text Translations',
    'Detail Option Translations'
  ];

  translationSheets.forEach(sheetName => {
    const translations = data[sheetName].slice(1);
    translations.forEach(translation => {
      const key = slugify(translation[0]);
      const languages: TranslationLanguage[] = ['es', 'pt'];
      
      languages.forEach((lang, index) => {
        let messageKey: string;
        let description: string;
        
        if (sheetName === 'Category Translations') {
          messageKey = `presets.${key}.name`;
          description = `Name for preset '${key}'`;
        } else if (sheetName === 'Detail Label Translations') {
          messageKey = `fields.${key}.label`;
          description = `Label for field '${key}'`;
        } else if (sheetName === 'Detail Helper Text Translations') {
          messageKey = `fields.${key}.placeholder`;
          description = `An example to guide the user for field '${key}'`;
        } else if (sheetName === 'Detail Option Translations') {
          const fieldType = getFieldType(translation[2]); // Assuming column 3 contains the field type
          if (fieldType !== 'number' && fieldType !== 'text') {
            const optionValue = slugify(translation[1]);
            messageKey = `fields.${key}.options.${optionValue}`;
            description = `Label for option '${optionValue}' for field '${key}'`;
          }
        }

        if (!config.messages[lang][messageKey]) {
          config.messages[lang][messageKey] = { description, message: '' };
        }
        
        if (sheetName === 'Detail Option Translations') {
          config.messages[lang][messageKey].message = { label: translation[index + 1], value: translation[index + 1] };
        } else {
          config.messages[lang][messageKey].message = translation[index + 1];
        }
      });
    });
  });

  return config;
}
