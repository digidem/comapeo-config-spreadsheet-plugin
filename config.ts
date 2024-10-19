import { SheetData, CoMapeoConfig } from './types';

export function processSpreadsheetData(data: SheetData): CoMapeoConfig {
  const layers = data['Category Translations'].slice(1).map(row => ({
    id: row[0] as string,
    name: row[1] as string,
    type: 'category', // Assuming all entries in this sheet are categories
  }));

  return { layers };
}

export function generateCoMapeoConfig(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetNames = [
    "Category Translations",
    "Detail Label Translations",
    "Detail Helper Text Translations",
    "Detail Option Translations",
  ];

  const data: SheetData = {};
  sheetNames.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      data[name] = sheet.getDataRange().getValues();
    }
  });

  const config = processSpreadsheetData(data);
  const configString = JSON.stringify(config, null, 2);

  // Display the generated configuration
  const ui = SpreadsheetApp.getUi();
  ui.alert('Generated CoMapeo Config', configString, ui.ButtonSet.OK);

  // Optionally, save the config to a new sheet
  const configSheet = ss.getSheetByName('Generated Config') || ss.insertSheet('Generated Config');
  configSheet.clear();
  configSheet.getRange(1, 1).setValue(configString);
}
