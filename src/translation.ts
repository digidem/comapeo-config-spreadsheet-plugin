function translateSheet(
  sheetName: string,
  targetLanguage: TranslationLanguage,
): void {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  const lastRow = sheet.getLastRow();
  const languagesList = languages();
  const targetColumn = Object.keys(languagesList).indexOf(targetLanguage) + 2;

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
  const allSheets = sheets();
  const translationSheets = sheets(true);
  const categoriesAndDetailsSheets = allSheets.filter(sheet => !translationSheets.includes(sheet));

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheet = spreadsheet.getSheetByName(categoriesAndDetailsSheets[0]);
  const detailsSheet = spreadsheet.getSheetByName(categoriesAndDetailsSheets[1]);

  if (!categoriesSheet || !detailsSheet) {
    throw new Error("Categories or Details sheet not found");
  }

  for (const sheetName of translationSheets) {
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      const headers = ["English", ...Object.values(languages())];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");

      let sourceColumn;
      if (sheetName.startsWith("Category")) {
        sourceColumn = categoriesSheet.getRange("A2:A");
      } else if (sheetName === "Detail Helper Text Translations") {
        sourceColumn = detailsSheet.getRange("B2:B");
      } else if (sheetName === "Detail Option Translations") {
        sourceColumn = detailsSheet.getRange("D2:D");
      } else {
        sourceColumn = detailsSheet.getRange("A2:A");
      }
      const sourceValues = sourceColumn.getValues().filter(row => row[0] !== "");
      sheet.getRange(2, 1, sourceValues.length, 1).setValues(sourceValues);
    }
    Object.keys(languages()).forEach(lang => {
      translateSheet(sheetName, lang as TranslationLanguage);
    });
  }
}
