function getSpreadsheetData(): SheetData {
  const sheetNames: string[] = [
    "Category Translations", 
    "Detail Label Translations", 
    "Detail Helper Text Translations", 
    "Detail Option Translations",
    "Categories",
    "Details",
  ];

  let data: any = {};
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  data['documentName'] = spreadsheet.getName();

  sheetNames.forEach((sheetName: string) => {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      const values = sheet.getDataRange().getValues(); // Get all data in the sheet
      data[sheetName] = values;
    }
  });

  return data;
}
