const ENGLISH_COLUMN = "A";
const ENGLISH_HEADER = "English";
const CATEGORIES_SHEET = "Categories";
const DETAILS_SHEET = "Details";
const CATEGORY_TRANSLATIONS_SHEET = "Category Translations";
const DETAIL_HELPER_TEXT_TRANSLATIONS_SHEET = "Detail Helper Text Translations";
const DETAIL_OPTION_TRANSLATIONS_SHEET = "Detail Option Translations";
const DETAILS_HELPER_TEXT_COLUMN = "B";
const DETAILS_OPTIONS_COLUMN = "D";

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

function createCategoryTranslationsSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CATEGORY_TRANSLATIONS_SHEET);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CATEGORY_TRANSLATIONS_SHEET);
    const headers = [spreadsheet.getSheetByName(CATEGORIES_SHEET)?.getRange("A1").getValue() || ENGLISH_HEADER, ...Object.values(languages())];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");

    const categoriesSheet = spreadsheet.getSheetByName(CATEGORIES_SHEET);
    if (categoriesSheet) {
      const lastRow = categoriesSheet.getLastRow();
      const formula = `=${CATEGORIES_SHEET}!${ENGLISH_COLUMN}2:${ENGLISH_COLUMN}${lastRow}`;
      sheet.getRange(2, 1, lastRow - 1, 1).setFormula(formula);
    }
  }
  return sheet;
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
      if (sheetName === CATEGORY_TRANSLATIONS_SHEET) {
        sheet = createCategoryTranslationsSheet();
      } else {
        sheet = spreadsheet.insertSheet(sheetName);
        const headers = [spreadsheet.getSheetByName(CATEGORIES_SHEET)?.getRange("A1").getValue() || ENGLISH_HEADER, ...Object.values(languages())];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");

        let sourceSheet: string;
        let sourceColumn: string;
        if (sheetName === DETAIL_HELPER_TEXT_TRANSLATIONS_SHEET) {
          sourceSheet = DETAILS_SHEET;
          sourceColumn = DETAILS_HELPER_TEXT_COLUMN;
        } else if (sheetName === DETAIL_OPTION_TRANSLATIONS_SHEET) {
          sourceSheet = DETAILS_SHEET;
          sourceColumn = DETAILS_OPTIONS_COLUMN;
        } else {
          sourceSheet = DETAILS_SHEET;
          sourceColumn = ENGLISH_COLUMN;
        }

        const sourceSheetObj = spreadsheet.getSheetByName(sourceSheet);
        if (!sourceSheetObj) {
          throw new Error(`Source sheet ${sourceSheet} not found`);
        }
        const lastRow = sourceSheetObj.getLastRow();
        const formula = `=${sourceSheet}!${sourceColumn}2:${sourceColumn}${lastRow}`;
        sheet.getRange(2, 1, lastRow - 1, 1).setFormula(formula);
      }
    }
    for (const lang of Object.keys(languages())) {
      translateSheet(sheetName, lang as TranslationLanguage);
    }
  }
}

function addNewLanguages(newLanguages: { name: string }[]): void {
  console.log("Adding new languages...", newLanguages);
  const sheet = createCategoryTranslationsSheet();

  // Get current headers
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let startCol = Object.keys(languages()).length + 2;

  // Add new language columns
  for (const lang of newLanguages) {
    // Skip if language already exists
    if (headers.includes(lang.name)) continue;

    // Add new header
    sheet.getRange(1, startCol).setValue(lang.name).setFontWeight("bold");
    startCol++;
  }
}
