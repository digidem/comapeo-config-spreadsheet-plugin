export interface SheetData {
  [key: string]: any[][];
}

export interface CoMapeoConfig {
  layers: {
    id: string;
    name: string;
    type: string;
  }[];
}

export type TranslationLanguage = 'es' | 'pt';
