function getSpreadsheetData() {
  var sheetNames = [
    "Category Translations", 
    "Detail Label Translations", 
    "Detail Helper Text Translations", 
    "Detail Option Translations",
    "Categories",
    "Details",
  ];

  var data = {};
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  sheetNames.forEach(function(sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName);
    var values = sheet.getDataRange().getValues(); // Get all data in the sheet
    data[sheetName] = values;
  });

  return data;
}
