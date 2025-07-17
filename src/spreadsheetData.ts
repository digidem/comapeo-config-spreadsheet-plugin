function languages(includePrimary = false): Record<string, string> {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheet = spreadsheet.getSheetByName("Categories");
  const primaryLanguage = categoriesSheet?.getRange("A1").getValue() as string;

  const allLanguages = {
    en: "English",
    es: "Español",
    pt: "Português",
  };

  return Object.entries(allLanguages)
    .filter(([_, name]) =>
      includePrimary ? name === primaryLanguage : name !== primaryLanguage,
    )
    .reduce(
      (acc, [code, name]) => {
        acc[code] = name;
        return acc;
      },
      {} as Record<string, string>,
    );
}

function getPrimaryLanguage(): { code: string; name: string } {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheet = spreadsheet.getSheetByName("Categories");
  const primaryLanguage = categoriesSheet?.getRange("A1").getValue() as string;

  const allLanguages = {
    en: "English",
    es: "Español",
    pt: "Português",
  };

  // Find the code for the primary language
  const primaryLanguageCode = Object.entries(allLanguages).find(
    ([_, name]) => name === primaryLanguage,
  )?.[0];

  return {
    code: primaryLanguageCode || "en",
    name: primaryLanguage || "English",
  };
}

function getAvailableTargetLanguages(): Record<string, string> {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheet = spreadsheet.getSheetByName("Categories");
  const primaryLanguage = categoriesSheet?.getRange("A1").getValue() as string;

  const allLanguages = {
    en: "English",
    es: "Español",
    pt: "Português",
  };

  // Get all languages except the primary one
  const targetLanguages = Object.entries(allLanguages)
    .filter(([_, name]) => name !== primaryLanguage)
    .reduce(
      (acc, [code, name]) => {
        acc[code] = name;
        return acc;
      },
      {} as Record<string, string>,
    );

  // Add custom languages from translation sheets
  const translationSheets = sheets(true);
  for (const sheetName of translationSheets) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      // Look for custom language headers (format: "Language Name - ISO")
      headers.forEach((header, index) => {
        if (index > 2 && header && typeof header === "string" && header.includes(" - ")) {
          const [name, iso] = header.split(" - ");
          if (name && iso && name !== primaryLanguage) {
            targetLanguages[iso.toLowerCase()] = name;
          }
        }
      });
    }
  }

  return targetLanguages;
}
function sheets(translationsOnly = false): string[] {
  const translationSheets = [
    "Category Translations",
    "Detail Label Translations",
    "Detail Helper Text Translations",
    "Detail Option Translations",
  ];

  if (translationsOnly) {
    return translationSheets;
  }

  return [...translationSheets, "Categories", "Details"];
}
function getSpreadsheetData(): SheetData {
  const sheetNames = sheets();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const data: Record<string, unknown> = {
    documentName: spreadsheet.getName(),
  };

  for (const sheetName of sheetNames) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      const values = sheet.getDataRange().getValues(); // Get all data in the sheet
      data[sheetName] = values;
    }
  }

  return data as SheetData;
}
