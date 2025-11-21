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
  color?: string;
  iconId?: string;
  parentCategoryId?: string;
  defaultFieldIds?: string[];
  tags?: string[];
  visible?: boolean;
}

interface Field {
  id: string;
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
  tags?: string[];
}

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "integer"
  | "boolean"
  | "select"
  | "multiselect"
  | "date"
  | "datetime"
  | "photo"
  | "location";

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

// API Error Response
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
}

type TranslationLanguage = string;

// ============================================
// UI/Menu Types
// ============================================

interface MainMenuText {
  menu: string;
  translateCoMapeoCategory: string;
  addCustomLanguages: string;
  generateIcons: string;
  generateCoMapeoCategory: string;
  importCoMapeoCategory: string;
  lintAllSheets: string;
  cleanAllSheets: string;
  openHelpPage: string;
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

interface DialogInstructions {
  instructions: string[];
  footer: string;
}

// ============================================
// Category Selection State
// ============================================

let _categorySelection: string[] = [];

function setCategorySelection(categories: string[]): void {
  _categorySelection = [...categories];
}

function getCategorySelection(): string[] {
  return [..._categorySelection];
}
