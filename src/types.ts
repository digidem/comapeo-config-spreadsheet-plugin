interface SheetData {
  [key: string]: (string | number | boolean)[][];
}

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

interface MainMenuText {
  menu: string;
  translateCoMapeoCategory: string;
  addCustomLanguages: string;
  generateIcons: string;
  generateCoMapeoCategory: string;
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

