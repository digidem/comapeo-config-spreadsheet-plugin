function languages(): Record<string, string> {
  return {
    es: 'Spanish',
    pt: 'Portuguese'
  };
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
