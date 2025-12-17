/// <reference path="./loggingHelpers.ts" />
/// <reference path="./types.ts" />
/// <reference path="./languageLookup.ts" />

/**
 * Cache key for languages data
 */
const LANGUAGES_CACHE_KEY = "all_languages_data";
const LANGUAGES_CACHE_KEY_ENHANCED = "all_languages_data_enhanced";
const LANGUAGES_CACHE_TTL = 21600; // 6 hours (maximum allowed by Google Apps Script CacheService)

/**
 * Module-level cache for language lookup to avoid rebuilding indexes
 * Cleared when clearLanguagesCache() is called
 */
let _cachedLookup: LanguageLookup | null = null;

/**
 * Gets or creates the cached language lookup object
 * This avoids rebuilding Map-based indexes on every call
 *
 * @returns Cached LanguageLookup instance
 */
function getLanguageLookup(): LanguageLookup {
  if (!_cachedLookup) {
    const enhanced = getAllLanguagesEnhanced();
    _cachedLookup = createLanguageLookup(enhanced);
  }
  return _cachedLookup;
}

/**
 * Gets the primary language name from cell A1 of the Categories sheet.
 *
 * Prefers the Metadata sheet key `primaryLanguage` (set during migrations) and
 * falls back to Categories!A1 for legacy sheets or when metadata is missing.
 *
 * @returns Primary language display name (e.g., "English", "Español").
 */
function getPrimaryLanguageName(): string {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // 1) Prefer Metadata sheet entry if present
  const metadataSheet = spreadsheet.getSheetByName("Metadata");
  if (metadataSheet) {
    const values = metadataSheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() === "primaryLanguage") {
        const lang = String(values[i][1] || "").trim();
        if (lang) {
          return lang;
        }
      }
    }
  }

  // 2) Fallback to Categories!A1 (legacy behavior)
  const categoriesSheet = spreadsheet.getSheetByName("Categories");
  return categoriesSheet?.getRange("A1").getValue() as string;
}

/**
 * Filters languages based on whether they match the primary language.
 *
 * Now correctly handles both English and native language names by comparing
 * language codes instead of name strings. Uses cached lookup for performance.
 *
 * @param allLanguages - Map of ISO language codes to display names.
 * @param includePrimary - Whether to include the primary language in results.
 * @returns Filtered language map.
 *
 * @example
 * // Cell A1 contains "Portuguese" or "Português"
 * const filtered = filterLanguagesByPrimary(allLanguages, false);
 * // Returns all languages except Portuguese (pt)
 */
function filterLanguagesByPrimary(
  allLanguages: LanguageMap,
  includePrimary: boolean,
): LanguageMap {
  const log = getScopedLogger("SpreadsheetData");
  const primaryLanguageName = getPrimaryLanguageName();

  // Convert primary language name to code (supports both English and native names)
  // Uses cached lookup to avoid rebuilding indexes on every call
  const lookup = getLanguageLookup();
  const primaryCode = lookup.getCodeByName(primaryLanguageName);

  // If primary language is invalid or not found, log warning and return all languages
  if (!primaryCode) {
    log.warn(
      `Primary language "${primaryLanguageName}" not recognized in language lookup. ` +
      `Including all languages. Set "primaryLanguage" in Metadata sheet or put a valid language name in Categories!A1.`
    );
    return allLanguages;
  }

  // Filter by comparing language codes, not names
  return Object.entries(allLanguages)
    .filter(([code, _]) =>
      includePrimary ? code === primaryCode : code !== primaryCode,
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
 * Fetches the enhanced language map with both English and native names.
 * Prefers cached data and falls back to remote fetch or local fallback.
 *
 * @returns Enhanced language map with dual-name support
 */
function getAllLanguagesEnhanced(): LanguageMapEnhanced {
  const log = getScopedLogger("SpreadsheetData");
  // Try to get from cache first
  const cache = CacheService.getScriptCache();
  const cachedData = cache.get(LANGUAGES_CACHE_KEY_ENHANCED);

  if (cachedData) {
    log.debug("Using cached enhanced languages data");
    try {
      return JSON.parse(cachedData);
    } catch (parseError) {
      log.warn("Failed to parse cached enhanced languages, fetching fresh data");
      // Continue to fetch fresh data
    }
  }

  log.info("Fetching enhanced languages from remote source");

  try {
    const languagesUrl = "https://raw.githubusercontent.com/digidem/comapeo-mobile/refs/heads/develop/src/frontend/languages.json";
    const response = UrlFetchApp.fetch(languagesUrl);
    const languagesData = JSON.parse(response.getContentText());

    // Convert to enhanced format: {code: {englishName, nativeName}}
    const allLanguages: LanguageMapEnhanced = {};
    for (const [code, lang] of Object.entries(languagesData)) {
      const langData = lang as { englishName?: string; nativeName?: string };
      const englishName = langData.englishName || code; // Fallback to code if missing
      const nativeName = langData.nativeName || englishName; // Fallback to English if native missing

      allLanguages[code] = {
        englishName,
        nativeName,
      };
    }

    // Cache the result
    try {
      cache.put(LANGUAGES_CACHE_KEY_ENHANCED, JSON.stringify(allLanguages), LANGUAGES_CACHE_TTL);
      log.info("Enhanced languages data cached for 6 hours");
    } catch (cacheError) {
      log.warn("Failed to cache enhanced languages data", cacheError);
      // Continue even if caching fails
    }

    // Clear the module-level lookup cache to force rebuild with fresh data
    _cachedLookup = null;
    log.debug("Cleared lookup cache after fetching fresh enhanced language data");

    return allLanguages;
  } catch (error) {
    log.warn("Failed to fetch languages from remote source, using enhanced fallback", error);
    // Fallback to enhanced language data (defined in data/languagesFallback.ts)
    return LANGUAGES_FALLBACK_ENHANCED;
  }
}

/**
 * Fetches the language map, preferring cached data and falling back to
 * remote fetch or local fallback data when necessary.
 *
 * @deprecated Use getAllLanguagesEnhanced() for new code to support dual-name recognition
 * @returns Legacy language map with English names only
 *
 * ## Migration Guide
 *
 * This function is maintained for backward compatibility but should be replaced
 * with `getAllLanguagesEnhanced()` in new code to support dual-name recognition.
 *
 * ### Before (Legacy API):
 * ```typescript
 * const languages = getAllLanguages();
 * // Returns: { "pt": "Portuguese", "es": "Spanish" }
 * const name = languages["pt"]; // "Portuguese"
 * ```
 *
 * ### After (Enhanced API):
 * ```typescript
 * const languages = getAllLanguagesEnhanced();
 * // Returns: { "pt": { englishName: "Portuguese", nativeName: "Português" } }
 * const english = languages["pt"].englishName; // "Portuguese"
 * const native = languages["pt"].nativeName;   // "Português"
 * ```
 *
 * ### Migration Strategy:
 * 1. Identify all `getAllLanguages()` calls in your codebase
 * 2. Update to `getAllLanguagesEnhanced()` and access `.englishName` or `.nativeName`
 * 3. Update related code to support both name forms
 * 4. Test thoroughly with both English and native language names
 *
 * ### Timeline:
 * - **Current**: Both APIs supported, legacy API maintained indefinitely
 * - **Future**: No removal planned - backward compatibility is a priority
 * - **Recommendation**: Use enhanced API for new features, migrate when convenient
 */
function getAllLanguages(): LanguageMap {
  // Get enhanced data and convert to legacy format for backward compatibility
  const enhanced = getAllLanguagesEnhanced();
  return toLegacyLanguageMap(enhanced, false); // Use English names
}

/**
 * Gets the display name for a language code
 *
 * @param code - ISO language code (e.g., "pt", "es")
 * @param preferNative - If true, return native name; otherwise return English name
 * @returns Display name in the requested format, or the code itself if not found
 *
 * @example
 * getLanguageDisplayName("pt", false) // => "Portuguese"
 * getLanguageDisplayName("pt", true)  // => "Português"
 * getLanguageDisplayName("es", false) // => "Spanish"
 * getLanguageDisplayName("es", true)  // => "Español"
 */
function getLanguageDisplayName(code: LanguageCode, preferNative = false): string {
  const enhanced = getAllLanguagesEnhanced();
  const languageData = enhanced[code];

  if (!languageData) {
    // Fallback to code if not found
    return code;
  }

  return preferNative ? languageData.nativeName : languageData.englishName;
}

/**
 * Gets both English and native names for a language code
 *
 * @param code - ISO language code (e.g., "pt", "es")
 * @returns Object with both names, or undefined if code not found
 *
 * @example
 * getLanguageNames("pt") // => { english: "Portuguese", native: "Português" }
 * getLanguageNames("es") // => { english: "Spanish", native: "Español" }
 */
function getLanguageNames(code: LanguageCode): { english: string; native: string } | undefined {
  const enhanced = getAllLanguagesEnhanced();
  const languageData = enhanced[code];

  if (!languageData) {
    return undefined;
  }

  return {
    english: languageData.englishName,
    native: languageData.nativeName,
  };
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
 * Now supports BOTH English and native language names in cell A1.
 * For example, both "Portuguese" and "Português" will be recognized as "pt".
 *
 * Optimized to avoid redundant data fetches by using the code from validation result.
 *
 * @returns Primary language code and display name pair.
 * @throws {Error} When cell A1 contains an unsupported language name.
 *
 * @example
 * // Cell A1 contains "Portuguese"
 * getPrimaryLanguage() // => { code: "pt", name: "Portuguese" }
 *
 * @example
 * // Cell A1 contains "Português"
 * getPrimaryLanguage() // => { code: "pt", name: "Português" }
 */
function getPrimaryLanguage(): { code: LanguageCode; name: string } {
  const primaryLanguage = getPrimaryLanguageName();

  // Validate and get the language code in a single operation
  const validation = validateLanguageName(primaryLanguage);

  if (!validation.valid || !validation.code) {
    throw new Error(
      `Invalid primary language in cell A1: ${validation.error || "Unknown error"}\n\nPlease set cell A1 in the Categories sheet to a valid language name in either English or native form (e.g., "English", "Spanish"/"Español", "Portuguese"/"Português").`,
    );
  }

  return {
    code: validation.code,
    name: primaryLanguage, // Keep the name as entered by user (could be English or native)
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
 *
 * Returns BOTH English and native language names to support dual-name recognition.
 *
 * @returns Array of all supported language names (English and native forms)
 *
 * @example
 * getSupportedLanguagesForA1Cell()
 * // => ["English", "Spanish", "Español", "Portuguese", "Português", ...]
 */
function getSupportedLanguagesForA1Cell(): string[] {
  const enhanced = getAllLanguagesEnhanced();
  const allNames: string[] = [];

  // Collect both English and native names
  for (const data of Object.values(enhanced)) {
    allNames.push(data.englishName);
    // Only add native name if it's different from English
    if (data.englishName !== data.nativeName) {
      allNames.push(data.nativeName);
    }
  }

  return allNames.sort();
}

/**
 * Checks whether a language name is valid for the A1 configuration cell.
 *
 * Supports both English and native language names with case-insensitive matching.
 * Uses cached lookup for performance.
 *
 * @param languageName - Language name in either English or native form
 * @returns True if the name is recognized
 *
 * @example
 * isValidLanguageForA1Cell("Portuguese") // => true
 * isValidLanguageForA1Cell("Português")  // => true
 * isValidLanguageForA1Cell("PORTUGUESE") // => true
 * isValidLanguageForA1Cell("Invalid")    // => false
 */
function isValidLanguageForA1Cell(languageName: string): boolean {
  const lookup = getLanguageLookup();
  return lookup.hasName(languageName);
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

  return [...translationSheets, "Categories", "Details", "Icons"];
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
 * Clears ALL languages cache (both legacy and enhanced) and the lookup cache.
 * Also clears dependent caches in validation.ts.
 * Useful for debugging or forcing fresh data.
 */
function clearLanguagesCache(): void {
  const cache = CacheService.getScriptCache();
  cache.remove(LANGUAGES_CACHE_KEY);
  cache.remove(LANGUAGES_CACHE_KEY_ENHANCED);
  _cachedLookup = null; // Clear module-level lookup cache

  // Clear validation.ts language names cache if function exists
  if (typeof clearLanguageNamesCache !== "undefined") {
    clearLanguageNamesCache();
  }

  const log = getScopedLogger("SpreadsheetData");
  log.info("Languages cache cleared (legacy, enhanced, lookup index, and validation cache)");
}
