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

      let sourceSheet, sourceColumn;
      if (sheetName.startsWith("Category")) {
        sourceSheet = "Categories";
        sourceColumn = "A";
      } else if (sheetName === "Detail Helper Text Translations") {
        sourceSheet = "Details";
        sourceColumn = "B";
      } else if (sheetName === "Detail Option Translations") {
        sourceSheet = "Details";
        sourceColumn = "D";
      } else {
        sourceSheet = "Details";
        sourceColumn = "A";
      }

      const lastRow = spreadsheet.getSheetByName(sourceSheet)!.getLastRow();
      const formula = `=${sourceSheet}!${sourceColumn}2:${sourceColumn}${lastRow}`;
      sheet.getRange(2, 1, lastRow - 1, 1).setFormula(formula);
    }
    Object.keys(languages()).forEach(lang => {
      translateSheet(sheetName, lang as TranslationLanguage);
    });
  }
}
