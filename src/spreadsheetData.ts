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

  return Object.entries(ALL_LANGUAGES)
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
