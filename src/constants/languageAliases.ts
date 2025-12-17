/// <reference path="../types.ts" />

/**
 * Centralized language alias map used by translation header parsing.
 * Combines a curated alias list with the enhanced fallback data so
 * updates to language datasets automatically flow into header parsing.
 */
const LANGUAGE_NAME_ALIASES: Record<string, string> = (() => {
  const aliases: Record<string, string> = {
    // English names
    English: "en",
    Spanish: "es",
    French: "fr",
    German: "de",
    Italian: "it",
    Portuguese: "pt",
    Russian: "ru",
    Chinese: "zh",
    Japanese: "ja",
    Korean: "ko",
    Arabic: "ar",
    Hindi: "hi",
    Bengali: "bn",
    Dutch: "nl",
    Swedish: "sv",
    Norwegian: "no",
    Danish: "da",
    Finnish: "fi",
    Polish: "pl",
    Turkish: "tr",
    Greek: "el",
    Hebrew: "he",
    Thai: "th",
    Vietnamese: "vi",
    Indonesian: "id",
    Malay: "ms",
    Swahili: "sw",
    Tagalog: "tl",

    // Native names and accent-free fallbacks
    Español: "es",
    Espanol: "es",
    Français: "fr",
    Francais: "fr",
    Deutsch: "de",
    Italiano: "it",
    Português: "pt",
    Portugues: "pt",
    Русский: "ru",
    中文: "zh",
    日本語: "ja",
    한국어: "ko",
    العربية: "ar",
    हिन्दी: "hi",
    বাংলা: "bn",
    Nederlands: "nl",
    Svenska: "sv",
    Norsk: "no",
    Dansk: "da",
    Suomi: "fi",
    Polski: "pl",
    Türkçe: "tr",
    Turkce: "tr",
    Ελληνικά: "el",
    עברית: "he",
    ไทย: "th",
    "Tiếng Việt": "vi",
    "Bahasa Indonesia": "id",
    "Bahasa Melayu": "ms",
    Kiswahili: "sw",
  };

  // Extend alias list with any data available from the enhanced fallback map
  // so new languages automatically propagate here without manual edits.
  try {
    if (typeof LANGUAGES_FALLBACK_ENHANCED !== "undefined") {
      Object.entries(LANGUAGES_FALLBACK_ENHANCED).forEach(([code, names]) => {
        if (names?.englishName) {
          aliases[names.englishName] = code;
        }
        if (names?.nativeName) {
          aliases[names.nativeName] = code;
        }
      });
    }
  } catch (error) {
    console.warn("Failed to extend language alias map from fallback data:", error);
  }

  return aliases;
})();

function getLanguageAliases(): Record<string, string> {
  return LANGUAGE_NAME_ALIASES;
}
