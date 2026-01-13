/// <reference path="./types.ts" />
/// <reference path="./spreadsheetData.ts" />

function createTranslationHeaderResolver(
  allLanguages: LanguageMap,
): (header: string) => string | null {
  const codeByLower = new Map<string, string>();
  const nameToCode = new Map<string, string>();
  const isoPattern = /^[a-z]{2,8}(?:-[a-z0-9]{2,8})?$/i;

  for (const [code, name] of Object.entries(allLanguages)) {
    const lowerCode = code.toLowerCase();
    codeByLower.set(lowerCode, code);
    nameToCode.set(name.toLocaleLowerCase("en-US"), code);
  }

  if (typeof getAllLanguagesEnhanced === "function") {
    try {
      const enhanced = getAllLanguagesEnhanced();
      for (const [code, data] of Object.entries(enhanced)) {
        const canonical = codeByLower.get(code.toLowerCase()) ?? code;
        if (data?.englishName) {
          const normalized = data.englishName.toLocaleLowerCase("en-US");
          if (!nameToCode.has(normalized)) {
            nameToCode.set(normalized, canonical);
          }
        }
        if (data?.nativeName) {
          const normalized = data.nativeName.toLocaleLowerCase("en-US");
          if (!nameToCode.has(normalized)) {
            nameToCode.set(normalized, canonical);
          }
        }
      }
    } catch (error) {
      console.warn("Failed to extend language names from enhanced data:", error);
    }
  }

  const aliasMap =
    typeof getLanguageAliases === "function"
      ? getLanguageAliases()
      : typeof LANGUAGE_NAME_ALIASES !== "undefined"
        ? LANGUAGE_NAME_ALIASES
        : {};

  const aliasToCode = new Map<string, string>();
  for (const [name, code] of Object.entries(aliasMap)) {
    const canonical = codeByLower.get(code.toLowerCase()) ?? code;
    aliasToCode.set(name.toLocaleLowerCase("en-US"), canonical);
  }

  return (header: string): string | null => {
    const trimmed = String(header || "").trim();
    if (!trimmed) return null;

    const nameIsoMatch = trimmed.match(/^.+\s*-\s*([\w-]+)$/);
    if (nameIsoMatch) {
      const isoRaw = nameIsoMatch[1].trim();
      if (isoPattern.test(isoRaw)) {
        const iso = isoRaw.toLowerCase();
        const canonical = codeByLower.get(iso);
        return canonical ?? iso;
      }
    }

    const normalized = trimmed.toLocaleLowerCase("en-US");
    const canonicalCode = codeByLower.get(normalized);
    if (canonicalCode) return canonicalCode;

    const aliasCode = aliasToCode.get(normalized);
    if (aliasCode) return aliasCode;

    const nameCode = nameToCode.get(normalized);
    if (nameCode) return nameCode;

    if (isoPattern.test(trimmed)) {
      return normalized;
    }

    return null;
  };
}
