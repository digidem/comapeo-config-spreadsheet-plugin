function languages(includePrimary = false): Record<string, string> {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheet = spreadsheet.getSheetByName("Categories");
  const primaryLanguage = categoriesSheet?.getRange("A1").getValue() as string;

  const allLanguages = {
    en: 'English',
    es: 'Español',
    pt: 'Português'
  };

  return Object.entries(allLanguages)
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
