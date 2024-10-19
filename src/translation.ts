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

  for (const sheetName of sheetNames) {
    translateSheet(sheetName, "es");
    translateSheet(sheetName, "pt");
  }
}
