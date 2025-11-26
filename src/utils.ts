/**
 * Comprehensive language map covering common locales
 * Maps ISO 639-1 language codes to their native language names
 */
const ALL_LANGUAGES: Record<string, string> = {
  // Western European
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  nl: 'Nederlands',
  sv: 'Svenska',
  no: 'Norsk',
  da: 'Dansk',
  fi: 'Suomi',
  // Eastern European
  pl: 'Polski',
  cs: 'Čeština',
  sk: 'Slovenčina',
  hu: 'Magyar',
  ro: 'Română',
  bg: 'Български',
  hr: 'Hrvatski',
  sr: 'Српски',
  uk: 'Українська',
  ru: 'Русский',
  // Asian
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  hi: 'हिन्दी',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  // Middle Eastern & African
  ar: 'العربية',
  he: 'עברית',
  tr: 'Türkçe',
  fa: 'فارسی',
  sw: 'Kiswahili',
  // Other
  el: 'Ελληνικά',
  ca: 'Català',
  eu: 'Euskara',
  gl: 'Galego'
};

/**
 * Converts a string to a slug format.
 * @param input The input string to be converted.
 * @returns The slugified string.
 */
function slugify(input: string | any): string {
  if (!input) return "";

  const str = typeof input === "string" ? input : String(input);

  // Normalize accents and special characters by removing diacritics
  // This converts "Café" to "Cafe", "naïve" to "naive", etc.
  const normalized = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return normalized
    .toLocaleLowerCase("en-US")  // Use en-US locale to avoid Turkish 'I' → 'ı' issue
    .trim()
    .replace(/[^\w\s-]/g, "")    // Remove non-word characters (keep letters, numbers, underscore, whitespace, hyphen)
    .replace(/[\s_-]+/g, "-")    // Replace whitespace/underscore/hyphen sequences with single hyphen
    .replace(/^-+|-+$/g, "");    // Remove leading/trailing hyphens
}

/**
 * Ensures a deterministic slug for spreadsheet-derived identifiers.
 * Falls back to a prefix + index pattern when the source cannot produce a slug.
 *
 * @param source - Raw value taken from the spreadsheet.
 * @param fallbackPrefix - Prefix to use when the slug is empty.
 * @param index - Zero-based index of the item in its collection, used for fallback uniqueness.
 */
function buildSlugWithFallback(source: string, fallbackPrefix: string, index: number = 0): string {
  const slug = slugify(source);
  if (slug !== "") {
    return slug;
  }

  const sanitizedPrefix = fallbackPrefix && fallbackPrefix.trim() !== ""
    ? slugify(fallbackPrefix)
    : "item";

  return `${sanitizedPrefix || "item"}-${index + 1}`;
}

/**
 * Generates the canonical tag key for CoMapeo fields.
 *
 * @param fieldName - Name column value from the Details sheet.
 * @param index - Zero-based index of the field to guarantee deterministic fallback keys.
 */
function createFieldTagKey(fieldName: string, index?: number): string {
  return buildSlugWithFallback(fieldName, "field", typeof index === "number" ? index : 0);
}

/**
 * Generates the canonical slug for presets/categories.
 *
 * @param presetName - Category name from the Categories sheet.
 * @param index - Zero-based index to ensure unique fallback slugs.
 */
function createPresetSlug(presetName: string, index?: number): string {
  return buildSlugWithFallback(presetName, "category", typeof index === "number" ? index : 0);
}

/**
 * Normalizes icon slugs by removing size suffix variants (e.g., "-100px", "-medium", "-large").
 * Used to match icon filenames with preset slugs during validation.
 *
 * @param slug - The slug to normalize
 * @returns Normalized slug without size suffixes
 */
function normalizeIconSlug(slug: string): string {
  if (!slug) return "";

  const parts = slug.split("-").filter((part) => part !== "");

  // Remove trailing size indicators like "100px", "2x", "small", "medium", "large"
  while (parts.length > 0) {
    const last = parts[parts.length - 1];
    if (/^(?:\d+px|\d+x|small|medium|large)$/.test(last)) {
      parts.pop();
      continue;
    }
    break;
  }

  return parts.join("-");
}

/**
 * Determines the field type based on the type string.
 * @param typeString The type string from the spreadsheet (e.g., "Text", "Number", "Multiple choice", "Select one").
 * @returns The CoMapeo field type.
 */
function getFieldType(typeString: string): "text" | "number" | "selectOne" | "selectMultiple" {
  const firstChar = typeString.charAt(0).toLowerCase();
  if (firstChar === "m") return "selectMultiple";
  if (firstChar === "n") return "number";
  if (firstChar === "t") return "text";
  return "selectOne";
}

/**
 * Parses field options from the options string.
 * @param typeString The type string to determine if options are needed.
 * @param optionsString The comma-separated options string.
 * @param fieldKey The canonical field key used to build deterministic fallback option values.
 * @returns Array of option objects with label and value, or undefined for non-select fields.
 */
function getFieldOptions(
  typeString: string,
  optionsString: string,
  fieldKey?: string,
): Array<{ label: string; value: string }> | undefined {
  const fieldType = getFieldType(typeString);
  if (fieldType === "number" || fieldType === "text") return undefined;
  return optionsString
    .split(",")
    .map((opt) => opt.trim())
    .filter((opt) => opt !== "")
    .map((opt, index) => ({
      label: opt,
      value: createOptionValue(opt, fieldKey, index),
    }));
}

/**
 * Produces the canonical value for select field options with deterministic fallbacks.
 *
 * @param label - Option label taken from the spreadsheet.
 * @param fieldKey - Canonical field key if already computed.
 * @param index - Zero-based option index for fallback uniqueness.
 */
function createOptionValue(label: string, fieldKey: string | undefined, index: number): string {
  const baseKey = fieldKey && fieldKey.trim() !== "" ? fieldKey : "option";
  return buildSlugWithFallback(label, baseKey, index);
}
