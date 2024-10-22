function removeTranslationAndMetadataSheets(): void {
  const sheetsToRemove = [...sheets(true), "Metadata"];

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

function deleteIcons(): void {
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
  const range = categoriesSheet.getRange(2, 2, lastRow - 1, 1);
  range.clearContent();

  console.log("Deleted content from column B in Categories sheet, excluding the header and non-empty cells");
}

function cleanup(): void {
  removeTranslationAndMetadataSheets();
  deleteIcons();
}