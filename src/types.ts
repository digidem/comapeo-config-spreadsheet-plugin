interface SheetData {
  [key: string]: (string | number | boolean)[][];
}

type LanguageCode = string;
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
