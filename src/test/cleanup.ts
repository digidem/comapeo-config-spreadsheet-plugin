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
