function languages(includePrimary = false): Record<string, string> {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Try to get primary language from Metadata sheet (new approach)
  let primaryLanguage: string | null = null;
  const metadataSheet = spreadsheet.getSheetByName("Metadata");
  if (metadataSheet) {
    const metadataData = metadataSheet.getDataRange().getValues();
    for (let i = 1; i < metadataData.length; i++) {
      if (metadataData[i][0] === 'primaryLanguage') {
        primaryLanguage = String(metadataData[i][1]);
        break;
      }
    }
  }

  // Fallback: Try to get from Categories!A1 if it's a recognized language name
  // (for backward compatibility with unmigrated sheets)
  if (!primaryLanguage) {
    const categoriesSheet = spreadsheet.getSheetByName("Categories");
    const a1Value = categoriesSheet?.getRange("A1").getValue() as string;

    // Check if A1 contains a valid language name
    if (a1Value && Object.values(ALL_LANGUAGES).includes(a1Value)) {
      primaryLanguage = a1Value;
    } else {
      // Default to English if no primary language is set
      primaryLanguage = 'English';

      // Store the default in Metadata sheet for future use
      if (metadataSheet) {
        metadataSheet.appendRow(['primaryLanguage', primaryLanguage]);
      }
    }
  }

  // Detect which languages are actually configured in the spreadsheet
  // by reading headers from an existing translation sheet
  const translationSheet = spreadsheet.getSheetByName("Category Translations");
  let configuredLanguages: Record<string, string> = {};

  if (translationSheet && translationSheet.getLastColumn() > 0) {
    // Read headers from existing translation sheet
    const headers = translationSheet.getRange(1, 1, 1, translationSheet.getLastColumn()).getValues()[0];

    // Map headers back to language codes
    // Headers can be either "Language Name" or "Language Name - code" format
    for (const header of headers) {
      if (typeof header === 'string' && header.trim() !== '') {
        // Try to find matching language in ALL_LANGUAGES
        const headerStr = String(header).trim();

        // Check if header matches "Language Name - code" format
        const dashMatch = headerStr.match(/^(.+?)\s*-\s*([a-z]{2,3})$/);
        if (dashMatch) {
          const [, langName, code] = dashMatch;
          if (ALL_LANGUAGES[code] && ALL_LANGUAGES[code] === langName.trim()) {
            configuredLanguages[code] = ALL_LANGUAGES[code];
          }
        } else {
          // Check if header matches a language name directly
          for (const [code, name] of Object.entries(ALL_LANGUAGES)) {
            if (name === headerStr) {
              configuredLanguages[code] = name;
              break;
            }
          }
        }
      }
    }
  }

  // If no configured languages found (first run), default to en, es, pt
  if (Object.keys(configuredLanguages).length === 0) {
    configuredLanguages = {
      en: 'English',
      es: 'Español',
      pt: 'Português'
    };
  }

  // Filter based on includePrimary parameter
  return Object.entries(configuredLanguages)
    .filter(([_, name]) => includePrimary ? name === primaryLanguage : name !== primaryLanguage)
    .reduce((acc, [code, name]) => {
      acc[code] = name;
      return acc;
    }, {} as Record<string, string>);
}
function sheets(translationsOnly = false): string[] {
  const translationSheets = [
    "Category Translations",
    "Detail Label Translations",
    "Detail Helper Text Translations",
    "Detail Option Translations",
  ];

  if (translationsOnly) {
    return translationSheets;
  }

  return [
    ...translationSheets,
    "Categories",
    "Details"
  ];
}
function getSpreadsheetData(): SheetData {
  const sheetNames = sheets();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const data: Record<string, unknown> = {
    documentName: spreadsheet.getName()
  };

  for (const sheetName of sheetNames) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      const values = sheet.getDataRange().getValues(); // Get all data in the sheet
      data[sheetName] = values;
    }
  }

  return data as SheetData;
}
