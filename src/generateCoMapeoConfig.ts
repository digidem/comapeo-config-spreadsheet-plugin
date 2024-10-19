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
  // Get the spreadsheet data
  const data = getSpreadsheetData();

  // Process the data to create the CoMapeo configuration
  const config = processDataForCoMapeo(data);

  // Convert the config to JSON
  const configJson = JSON.stringify(config, null, 2);

  // Create a blob from the JSON
  const configBlob = Utilities.newBlob(configJson, 'application/json', 'comapeo_config.json');

  // Save the blob to Drive and get the download URL
  const downloadUrl = saveZipToDrive(configBlob);

  // Show the download link
  showDownloadLink(downloadUrl);
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
  const categories = data['Categories'].slice(1);
  categories.forEach(category => {
    const preset: CoMapeoPreset = {
      icon: slugify(category[0]),
      color: '#0000FF',
      fields: category[3].split(',').map(f => slugify(f.trim())),
      geometry: ['point', 'line', 'area'],
      tags: { [slugify(category[0])]: 'yes' },
      name: category[0]
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
          const optionKey = slugify(translation[1]);
          messageKey = `fields.${key}.options.${optionKey}`;
          description = `Label for option '${optionKey}' for field '${key}'`;
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
