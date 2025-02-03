const MAIN_LANGUAGE_COLUMN = "A";
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
  const mainLanguage = Object.keys(languages(true))[0];
  console.log('Main language', mainLanguage);
  for (const [code, name] of Object.entries(languagesList)) {
    console.log(`Language code: ${code}, name: ${name}`);
  }
  const targetColumn = Object.keys(languagesList).indexOf(targetLanguage) + 2;

  for (let i = 2; i <= lastRow; i++) {
    const originalText = sheet.getRange(i, 1).getValue() as string;
    if (originalText) {
      const targetCell = sheet.getRange(i, targetColumn);
      if (!targetCell.getValue()) {
        const translation = LanguageApp.translate(
          originalText,
          mainLanguage,
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
    const mainLanguage = Object.entries(languages(true))[0];
    const otherLanguages = Object.entries(languages());
    const headers = [mainLanguage[1], ...otherLanguages.map(([_, name]) => name)];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");

    const categoriesSheet = spreadsheet.getSheetByName(CATEGORIES_SHEET);
    if (categoriesSheet) {
      const lastRow = categoriesSheet.getLastRow();
      const formula = `=${CATEGORIES_SHEET}!${MAIN_LANGUAGE_COLUMN}2:${MAIN_LANGUAGE_COLUMN}${lastRow}`;
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
        const mainLanguage = Object.entries(languages(true))[0];
        const otherLanguages = Object.entries(languages());
        const headers = [mainLanguage[1], ...otherLanguages.map(([_, name]) => name)];
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
          sourceColumn = MAIN_LANGUAGE_COLUMN;
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

function addNewLanguages(newLanguages: { name: string; iso: string }[]): void {
  console.log("Adding new languages...", newLanguages);
  const sheet = createCategoryTranslationsSheet();

  // Get current headers
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Find first empty column after D
  let startCol = 4; // Start from column D
  while (startCol <= headers.length && headers[startCol - 1] !== "") {
    startCol++;
  }

  // Add new language columns
  for (const lang of newLanguages) {
    const headerText = `${lang.name} - ${lang.iso}`;
    // Skip if language already exists
    if (headers.includes(headerText)) continue;

    // Add new header
    sheet.getRange(1, startCol).setValue(headerText).setFontWeight("bold");
    startCol++;
  }
}
