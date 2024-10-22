function removeTranslationAndMetadataSheets(): void {
  const sheetsToRemove = [
    "Detail Label Translations",
    "Detail Helper Text Translations",
    "Detail Option Translations",
    "Category Translations",
    "Metadata"
  ];

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  sheetsToRemove.forEach(sheetName => {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      spreadsheet.deleteSheet(sheet);
      console.log(`Removed sheet: ${sheetName}`);
    } else {
      console.log(`Sheet not found: ${sheetName}`);
    }
  });

  console.log("Finished removing translation sheets");
}

function deleteCategoriesSheetBColumn(): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheet = spreadsheet.getSheetByName("Categories");

  if (!categoriesSheet) {
    console.log("Categories sheet not found");
    return;
  }

  const lastRow = categoriesSheet.getLastRow();
  if (lastRow <= 1) {
    console.log("Categories sheet is empty or contains only header");
    return;
  }

  // Delete column B content, excluding the header
  categoriesSheet.getRange(2, 2, lastRow - 1, 1).clearContent();

  console.log("Deleted content from column B in Categories sheet, excluding the header");
}

function cleanup(): void {
  removeTranslationAndMetadataSheets();
  deleteCategoriesSheetBColumn();
}