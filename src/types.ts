interface SheetData {
  [key: string]: any[][];
}

interface CoMapeoConfig {
  layers: {
    id: string;
    name: string;
    type: string;
  }[];
}

type TranslationLanguage = "es" | "pt";
