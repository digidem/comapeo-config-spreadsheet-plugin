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
function slugify(input) {
  const str = typeof input === 'string' ? input : String(input);
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getFieldType(typeString) {
  const firstChar = typeString.charAt(0).toLowerCase();
  if (firstChar === 'm') return 'selectMultiple';
  if (firstChar === 'n') return 'number';
  if (firstChar === 't') return 'text';
  return 'selectOne';
}

function getFieldOptions(typeString, optionsString) {
  const fieldType = getFieldType(typeString);
  if (fieldType === 'number' || fieldType === 'text') return undefined;
  return optionsString.split(',')
    .map(opt => opt.trim())
    .filter(opt => opt !== '')
    .map(opt => ({ label: opt, value: slugify(opt) }));
}
