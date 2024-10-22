function translateSheet(
  sheetName: string,
  targetLanguage: TranslationLanguage,
): void {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  const lastRow = sheet.getLastRow();
  const targetColumn = targetLanguage === "es" ? 2 : 3;

  for (let i = 2; i <= lastRow; i++) {
    const englishText = sheet.getRange(i, 1).getValue() as string;
    if (englishText) {
      const targetCell = sheet.getRange(i, targetColumn);
      if (!targetCell.getValue()) {
        const translation = LanguageApp.translate(
          englishText,
          "en",
          targetLanguage,
        );
        targetCell.setValue(translation);
      }
    }
  }
}

function autoTranslateSheets(): void {
  const sheetNames = [
    "Category Translations",
    "Detail Label Translations",
    "Detail Helper Text Translations",
    "Detail Option Translations",
  ];

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheet = spreadsheet.getSheetByName("Categories");
  const detailsSheet = spreadsheet.getSheetByName("Details");

  if (!categoriesSheet || !detailsSheet) {
    throw new Error("Categories or Details sheet not found");
  }

  for (const sheetName of sheetNames) {
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      const headers = ["English", "Spanish", "Portuguese"];
      sheet.getRange(1, 1, 1, 3).setValues([headers]).setFontWeight("bold");

      const sourceColumn = sheetName.startsWith("Category") ? categoriesSheet.getRange("A2:A") : detailsSheet.getRange("A2:A");
      const sourceValues = sourceColumn.getValues().filter(row => row[0] !== "");
      sheet.getRange(2, 1, sourceValues.length, 1).setValues(sourceValues);
    }

    translateSheet(sheetName, "es");
    translateSheet(sheetName, "pt");
  }
}
