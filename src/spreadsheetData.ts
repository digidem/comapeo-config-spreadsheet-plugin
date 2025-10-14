/// <reference path="./loggingHelpers.ts" />

/**
 * Cache key for languages data
 */
const LANGUAGES_CACHE_KEY = "all_languages_data";
const LANGUAGES_CACHE_TTL = 21600; // 6 hours (max for CacheService)

/**
 * Gets the primary language name from cell A1 of the Categories sheet.
 *
 * @returns Primary language display name (e.g., "English", "Español").
 */
function getPrimaryLanguageName(): string {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheet = spreadsheet.getSheetByName("Categories");
  return categoriesSheet?.getRange("A1").getValue() as string;
}

/**
 * Filters languages based on whether they match the primary language.
 *
 * @param allLanguages - Map of ISO language codes to display names.
 * @param includePrimary - Whether to include the primary language in results.
 * @returns Filtered language map.
 */
function filterLanguagesByPrimary(
  allLanguages: LanguageMap,
  includePrimary: boolean,
): LanguageMap {
  const primaryLanguage = getPrimaryLanguageName();

  return Object.entries(allLanguages)
    .filter(([_, name]) =>
      includePrimary ? name === primaryLanguage : name !== primaryLanguage,
    )
    .reduce(
      (acc, [code, name]) => {
        acc[code as LanguageCode] = name;
        return acc;
      },
      {} as LanguageMap,
    );
}

/**
 * Fetches the language map, preferring cached data and falling back to
 * remote fetch or local fallback data when necessary.
 */
function getAllLanguages(): LanguageMap {
  const log = getScopedLogger("SpreadsheetData");
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
    const allLanguages: LanguageMap = {};
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

/**
 * Returns available languages filtered by whether to include the primary entry.
 *
 * @param includePrimary - When true, returns only the primary language.
 * @returns Map of language codes to display names.
 */
function languages(includePrimary = false): LanguageMap {
  const allLanguages = getAllLanguages();
  return filterLanguagesByPrimary(allLanguages, includePrimary);
}

/**
 * Resolves the primary language code and name configured in the spreadsheet.
 *
 * @returns Primary language code and display name pair.
 * @throws Error when cell A1 contains an unsupported language.
 */
function getPrimaryLanguage(): { code: LanguageCode; name: string } {
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

/**
 * Retrieves the set of languages that can be targeted for translation,
 * combining the canonical list with any custom sheet headers.
 */
function getAvailableTargetLanguages(): LanguageMap {
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

/**
 * Lists supported language names for validation in the Categories sheet.
 */
function getSupportedLanguagesForA1Cell(): string[] {
  const allLanguages = getAllLanguages();
  return Object.values(allLanguages).sort();
}

/**
 * Checks whether a language name is valid for the A1 configuration cell.
 */
function isValidLanguageForA1Cell(languageName: string): boolean {
  const supportedLanguages = getSupportedLanguagesForA1Cell();
  return supportedLanguages.includes(languageName);
}

/**
 * Returns the ordered list of spreadsheet sheet names used by the exporter.
 *
 * @param translationsOnly - When true, include only translation sheets.
 */
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
/**
 * Reads spreadsheet data for all relevant sheets into a structured object.
 *
 * @returns SheetData containing sheet names and their value matrices.
 */
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
  const log = getScopedLogger("SpreadsheetData");
  log.info("Languages cache cleared");
}
