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
  return {
    fields,
    presets: processPresets(data),
    messages: processTranslations(data, fields)
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

function processTranslations(data: SheetData, fields: CoMapeoField[]): CoMapeoTranslations {
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
        const { messageKey, description } = getMessageKeyAndDescription(sheetName, key, translation, fields, index);
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

function getMessageKeyAndDescription(sheetName: string, key: string, translation: any[], fields: CoMapeoField[], index: number): { messageKey: string; description: string } {
  const field = fields[index];
  const baseMessageKey = sheetName.startsWith('Category') ? 'presets' : 'fields';
  
  switch (sheetName) {
    case 'Category Translations':
      return { messageKey: `${baseMessageKey}.${key}.name`, description: `Name for preset '${key}'` };
    case 'Detail Label Translations':
      return { messageKey: `${baseMessageKey}.${key}.label`, description: `Label for field '${key}'` };
    case 'Detail Helper Text Translations':
      if (field && field.label.trim()) {
        return { messageKey: `${baseMessageKey}.${field.tagKey}.placeholder`, description: `An example to guide the user for field '${field.label}'` };
      }
      return { messageKey: '', description: '' };
    case 'Detail Option Translations':
      const fieldType = getFieldType(field?.type || '');
      if (fieldType !== 'number' && fieldType !== 'text' && translation[1].trim()) {
        const optionValue = slugify(translation[1]);
        return { messageKey: `${baseMessageKey}.${field?.tagKey}.options.${optionValue}`, description: `Label for option '${translation[1]}' for field '${field?.label}'` };
      }
      return { messageKey: '', description: '' };
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
  return optionsString.split(',').map(opt => ({ label: opt.trim(), value: slugify(opt.trim()) }));
}
