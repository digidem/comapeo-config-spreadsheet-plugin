// ============================================
// Sheet Data Types
// ============================================

interface SheetData {
  [key: string]: (string | number | boolean)[][];
}

// ============================================
// CoMapeo API v2.0.0 Types (Build Request)
// ============================================

interface BuildRequest {
  metadata: Metadata;
  locales: string[];  // At least one locale is required by API v2
  categories: Category[];
  fields: Field[];
  icons?: Icon[];
  translations?: TranslationsByLocale;
}

interface Metadata {
  name: string;
  version: string;
  description?: string;
  builderName?: string;
  builderVersion?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  appliesTo?: string[];
  color?: string;
  iconId?: string;
  parentCategoryId?: string;
  defaultFieldIds?: string[];
  fields?: string[];
  tags?: string[];
  visible?: boolean;
}

interface Field {
  id: string;
  tagKey: string;
  name: string;
  type: FieldType;
  description?: string;
  options?: SelectOption[];
  iconId?: string;
  required?: boolean;
  defaultValue?: any;
  visible?: boolean;
  min?: number;
  max?: number;
  step?: number;
  appliesTo?: string[];
  tags?: string[];
}

type FieldType = "text" | "number" | "selectOne" | "selectMultiple";

interface SelectOption {
  value: string;
  label: string;
  iconId?: string;
  tags?: string[];
}

interface Icon {
  id: string;
  svgData?: string;
  svgUrl?: string;
  altText?: string;
  tags?: string[];
}

interface TranslationsByLocale {
  [locale: string]: {
    metadata?: {
      name?: string;
      description?: string;
    };
    categories?: {
      [categoryId: string]: {
        name?: string;
        description?: string;
      };
    };
    fields?: {
      [fieldId: string]: {
        name?: string;
        description?: string;
        options?: {
          [optionValue: string]: string;
        };
      };
    };
  };
}

interface ApiErrorResponse {
  error: string;
  message: string;
  details?: {
    errors?: string[];
  };
}

// ============================================
// Legacy Types (for internal use during migration)
// ============================================

type LanguageCode = string;

/**
 * Enhanced language data with both English and native names
 * @example { englishName: "Portuguese", nativeName: "Português" }
 */
interface LanguageData {
  englishName: string;
  nativeName: string;
}

/**
 * Enhanced language map with dual-name support
 * Maps language code to both English and native names
 * @example { "pt": { englishName: "Portuguese", nativeName: "Português" } }
 */
type LanguageMapEnhanced = Record<LanguageCode, LanguageData>;

/**
 * Legacy language map for backward compatibility
 * Maps language code to a single name (either English or native)
 * @deprecated Use LanguageMapEnhanced for new code
 */
type LanguageMap = Record<LanguageCode, string>;

interface CoMapeoField {
  tagKey: string;
  type: string;
  label: string;
  helperText?: string;
  options?: Array<{ label: string; value: string }>;
  universal: boolean;
}

interface CoMapeoPreset {
  icon: string;
  sort: number;
  color: string;
  fields: string[];
  geometry: string[];
  tags: { [key: string]: string };
  terms?: string[];
  name: string;
}

interface CoMapeoIcon {
  name: string;
  svg: string;
}

interface CoMapeoTranslationMessage {
  description: string;
  message: string | { label: string; value: string };
}

interface CoMapeoTranslations {
  [language: string]: {
    [key: string]: CoMapeoTranslationMessage;
  };
}

interface CoMapeoMetadata {
  dataset_id: string;
  name: string;
  version: string;
}

interface CoMapeoPackageJson {
  name: string;
  version: string;
  description: string;
  dependencies: {
    "mapeo-settings-builder": string;
  };
  scripts: {
    build: string;
    lint: string;
  };
}

interface CoMapeoConfig {
  metadata: CoMapeoMetadata;
  packageJson: CoMapeoPackageJson;
  fields: CoMapeoField[];
  presets: CoMapeoPreset[];
  icons: CoMapeoIcon[];
  messages: CoMapeoTranslations;
  translations?: CoMapeoTranslations;
}
type TranslationLanguage = string;

interface MainMenuText {
  menu: string;
  translateCoMapeoCategory: string;
  generateIcons: string;
  generateCoMapeoCategory: string;
  generateCoMapeoCategoryDebug: string;
  importCategoryFile: string;
  importCoMapeoCategory: string;
  lintAllSheets: string;
  cleanAllSheets: string;
  openHelpPage: string;
}

interface CustomLanguageInput {
  name: string;
  iso: string;
}

interface LanguageSelectionPayload {
  autoTranslateLanguages: TranslationLanguage[];
  customLanguages: CustomLanguageInput[];
}

interface MenuText {
  action: string;
  actionText: string;
  completed?: string;
  completedText?: string;
  error: string;
  errorText: string;
}

interface DialogText {
  title: string;
  message: string[];
  buttonText?: string;
}

interface SelectTranslationDialogText extends DialogText {
  skipButtonText: string;
  manualSectionTitle: string;
  manualSectionDescription: string[];
  manualDropdownPlaceholder: string;
  manualAddButton: string;
  manualNamePlaceholder: string;
  manualIsoPlaceholder: string;
  validationMessages: {
    noAutoSelection: string;
    missingCustomFields: string;
    duplicateCustomIso: string;
    invalidCustomIso: string;
  };
}

interface DialogInstructions {
  instructions: string[];
  footer: string;
}

interface IconErrorDialogText {
  title: string;
  downloadButtonText: string;
  continueButtonText: string;
  okButtonText: string;
}

/**
 * Field row data structure from Details sheet
 * Represents a single row (excluding header) from the spreadsheet
 *
 * Column mapping:
 * [0] = Field Name (A)
 * [1] = Helper Text (B)
 * [2] = Type (C) - e.g., "Text", "Number", "Select One", "Multiple Choice"
 * [3] = Options (D) - comma-separated for select fields
 * [4+] = Additional columns (translations, etc.)
 */
interface FieldRow extends Array<string | number | boolean> {
  0: string;  // Field Name (required)
  1?: string; // Helper Text (optional)
  2: string;  // Type (required)
  3?: string; // Options (required for select fields)
}

/**
 * Category row data structure from Categories sheet
 * Represents a single row (excluding header) from the spreadsheet
 *
 * Column mapping:
 * [0] = Category Name (A)
 * [1] = Icon (B)
 * [2] = Fields (C) - comma-separated field names
 * [3] = Color (D)
 * [4] = Geometry (E) - e.g., "point", "line", "area"
 * [5+] = Additional columns (translations, etc.)
 */
interface CategoryRow extends Array<string | number | boolean> {
  0: string;  // Category Name (required)
  1?: string; // Icon (optional)
  2?: string; // Fields (optional)
  3?: string; // Color (optional)
  4?: string; // Geometry (optional)
}
