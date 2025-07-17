function getAllLanguages(): Record<string, string> {
  try {
    const languagesUrl = "https://raw.githubusercontent.com/digidem/comapeo-mobile/refs/heads/develop/src/frontend/languages.json";
    const response = UrlFetchApp.fetch(languagesUrl);
    const languagesData = JSON.parse(response.getContentText());

    // Convert to the format we need: {code: englishName}
    const allLanguages: Record<string, string> = {};
    for (const [code, lang] of Object.entries(languagesData)) {
      allLanguages[code] = (lang as { englishName: string }).englishName;
    }

    return allLanguages;
  } catch (error) {
    console.warn("Failed to fetch languages from remote source, using fallback:", error);
    // Fallback to basic languages if remote fetch fails
    return {
      en: "English",
      es: "Español",
      pt: "Português",
      fr: "French",
      de: "German",
      it: "Italian",
      ja: "Japanese",
      ko: "Korean",
      "zh-CN": "Chinese Simplified",
      "zh-TW": "Chinese Traditional",
      ru: "Russian",
      ar: "Arabic",
      hi: "Hindi",
      th: "Thai",
      vi: "Vietnamese",
      tr: "Turkish",
      pl: "Polish",
      nl: "Dutch",
      sv: "Swedish",
      no: "Norwegian",
      da: "Danish",
      fi: "Finnish",
      hu: "Hungarian",
      cs: "Czech",
      sk: "Slovak",
      ro: "Romanian",
      bg: "Bulgarian",
      hr: "Croatian",
      sr: "Serbian",
      sl: "Slovenian",
      et: "Estonian",
      lv: "Latvian",
      lt: "Lithuanian",
      el: "Greek",
      he: "Hebrew",
      fa: "Persian",
      ur: "Urdu",
      bn: "Bengali",
      ta: "Tamil",
      te: "Telugu",
      kn: "Kannada",
      ml: "Malayalam",
      gu: "Gujarati",
      mr: "Marathi",
      pa: "Punjabi",
      ne: "Nepali",
      si: "Sinhala",
      my: "Myanmar",
      km: "Khmer",
      lo: "Lao",
      ka: "Georgian",
      am: "Amharic",
      sw: "Swahili",
      zu: "Zulu",
      af: "Afrikaans",
      is: "Icelandic",
      mt: "Maltese",
      cy: "Welsh",
      ga: "Irish",
      eu: "Basque",
      ca: "Catalan",
      gl: "Galician",
      ast: "Asturian",
      br: "Breton",
      co: "Corsican",
      eo: "Esperanto",
      la: "Latin",
      jv: "Javanese",
      su: "Sundanese",
      tl: "Filipino",
      ceb: "Cebuano",
      haw: "Hawaiian",
      mg: "Malagasy",
      sm: "Samoan",
      to: "Tongan",
      fj: "Fijian",
      mi: "Maori",
      sn: "Shona",
      st: "Sotho",
      xh: "Xhosa",
      yo: "Yoruba",
      ig: "Igbo",
      ha: "Hausa",
      rw: "Kinyarwanda",
      ny: "Chichewa",
      so: "Somali",
      ti: "Tigrinya",
      om: "Oromo",
      ak: "Akan",
      ee: "Ewe",
      tw: "Twi",
      lg: "Luganda",
      ln: "Lingala",
      kg: "Kongo",
      rn: "Rundi",
      wo: "Wolof",
      ff: "Fulah",
      bm: "Bambara",
      dyu: "Dyula",
      kri: "Krio",
      luo: "Luo",
      gom: "Goan Konkani",
      sa: "Sanskrit",
      pi: "Pali",
      bo: "Tibetan",
      dz: "Dzongkha",
      ug: "Uyghur",
      kk: "Kazakh",
      ky: "Kyrgyz",
      uz: "Uzbek",
      tk: "Turkmen",
      tg: "Tajik",
      mn: "Mongolian",
      ii: "Sichuan Yi",
      iu: "Inuktitut",
      ik: "Inupiaq",
      chr: "Cherokee",
      chy: "Cheyenne",
      dak: "Dakota",
      lkt: "Lakota",
      nv: "Navajo",
      qu: "Quechua",
      gn: "Guarani",
      ay: "Aymara",
    };
  }
}

function languages(includePrimary = false): Record<string, string> {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheet = spreadsheet.getSheetByName("Categories");
  const primaryLanguage = categoriesSheet?.getRange("A1").getValue() as string;

  const allLanguages = getAllLanguages();

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

  const allLanguages = getAllLanguages();

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

  const allLanguages = getAllLanguages();

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

function getSupportedLanguagesForA1Cell(): string[] {
  const allLanguages = getAllLanguages();
  return Object.values(allLanguages).sort();
}

function isValidLanguageForA1Cell(languageName: string): boolean {
  const supportedLanguages = getSupportedLanguagesForA1Cell();
  return supportedLanguages.includes(languageName);
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
