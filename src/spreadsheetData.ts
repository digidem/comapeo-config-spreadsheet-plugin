// Lazy logger initialization to avoid compilation order issues
function getLog() {
  return typeof AppLogger !== 'undefined' ? AppLogger.scope("SpreadsheetData") : console;
}

/**
 * Cache key for languages data
 */
const LANGUAGES_CACHE_KEY = "all_languages_data";
const LANGUAGES_CACHE_TTL = 21600; // 6 hours (max for CacheService)

/**
 * Gets the primary language name from cell A1 of Categories sheet
 *
 * @returns The primary language name (e.g., "English", "Español")
 */
function getPrimaryLanguageName(): string {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheet = spreadsheet.getSheetByName("Categories");
  return categoriesSheet?.getRange("A1").getValue() as string;
}

/**
 * Filters languages based on primary language match
 *
 * @param allLanguages - All available languages
 * @param includePrimary - Whether to include or exclude the primary language
 * @returns Filtered language map
 */
function filterLanguagesByPrimary(
  allLanguages: Record<string, string>,
  includePrimary: boolean,
): Record<string, string> {
  const primaryLanguage = getPrimaryLanguageName();

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

/**
 * Fetches languages from cache or remote source
 */
function getAllLanguages(): Record<string, string> {
  const log = getLog();
  // Try to get from cache first
  const cache = CacheService.getScriptCache();
  const cachedData = cache.get(LANGUAGES_CACHE_KEY);

  if (cachedData) {
    log.debug("Using cached languages data");
    try {
      return JSON.parse(cachedData);
    } catch (parseError) {
      log.warn("Failed to parse cached languages, fetching fresh data");
      // Continue to fetch fresh data
    }
  }

  log.info("Fetching languages from remote source");

  try {
    const languagesUrl = "https://raw.githubusercontent.com/digidem/comapeo-mobile/refs/heads/develop/src/frontend/languages.json";
    const response = UrlFetchApp.fetch(languagesUrl);
    const languagesData = JSON.parse(response.getContentText());

    // Convert to the format we need: {code: englishName}
    const allLanguages: Record<string, string> = {};
    for (const [code, lang] of Object.entries(languagesData)) {
      allLanguages[code] = (lang as { englishName: string }).englishName;
    }

    // Cache the result
    try {
      cache.put(LANGUAGES_CACHE_KEY, JSON.stringify(allLanguages), LANGUAGES_CACHE_TTL);
      log.info("Languages data cached for 6 hours");
    } catch (cacheError) {
      log.warn("Failed to cache languages data", cacheError);
      // Continue even if caching fails
    }

    return allLanguages;
  } catch (error) {
    log.warn("Failed to fetch languages from remote source, using fallback", error);
    // Fallback to external language data (defined in data/languagesFallback.ts)
    return LANGUAGES_FALLBACK;
  }
}

function languages(includePrimary = false): Record<string, string> {
  const allLanguages = getAllLanguages();
  return filterLanguagesByPrimary(allLanguages, includePrimary);
}

function getPrimaryLanguage(): { code: string; name: string } {
  const primaryLanguage = getPrimaryLanguageName();
  const allLanguages = getAllLanguages();

  // Validate the primary language
  const validation = validatePrimaryLanguage(primaryLanguage, allLanguages);
  if (!validation.valid) {
    throw new Error(
      `${validation.error}\n\nPlease set cell A1 in the Categories sheet to a valid language name (e.g., "English", "Spanish", "French").`,
    );
  }

  // Find the code for the primary language
  const primaryLanguageCode = Object.entries(allLanguages).find(
    ([_, name]) => name === primaryLanguage,
  )?.[0];

  if (!primaryLanguageCode) {
    throw new Error(
      `Failed to find language code for primary language: "${primaryLanguage}"`,
    );
  }

  return {
    code: primaryLanguageCode,
    name: primaryLanguage,
  };
}

function getAvailableTargetLanguages(): Record<string, string> {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const primaryLanguage = getPrimaryLanguageName();
  const allLanguages = getAllLanguages();

  // Get all languages except the primary one
  const targetLanguages = filterLanguagesByPrimary(allLanguages, false);

  // Add custom languages from translation sheets
  const translationSheets = sheets(true);
  for (const sheetName of translationSheets) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      const lastColumn = sheet.getLastColumn();

      // Skip empty sheets (no columns)
      if (lastColumn === 0) {
        continue;
      }

      const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
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

/**
 * Clears the languages cache. Useful for debugging or forcing fresh data.
 */
function clearLanguagesCache(): void {
  const cache = CacheService.getScriptCache();
  cache.remove(LANGUAGES_CACHE_KEY);
  console.log("Languages cache cleared");
}
