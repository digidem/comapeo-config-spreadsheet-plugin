// Sample: function to process spreadsheet and generate CoMapeo config
function autoTranslateSheet(): void {
  // Define the sheet names
  const sheetNames = [
    "Category Translations",
    "Detail Label Translations",
    "Detail Helper Text Translations",
    "Detail Option Translations",
  ];

  // Loop over each sheet to translate
  for (const sheetName of sheetNames) {
    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    const lastRow = sheet.getLastRow();

    // Translate each row in the Spanish and Portuguese columns
    for (let i = 2; i <= lastRow; i++) {
      // Start at row 2 to skip headers
      const englishText = sheet.getRange(i, 1).getValue();

      if (englishText) {
        // Translate to Spanish (column 2)
        const spanishCell = sheet.getRange(i, 2);
        if (!spanishCell.getValue()) {
          // Only translate if empty
          const spanishTranslation = LanguageApp.translate(
            englishText,
            "en",
            "es",
          );
          spanishCell.setValue(spanishTranslation);
        }

        // Translate to Portuguese (column 3)
        const portugueseCell = sheet.getRange(i, 3);
        if (!portugueseCell.getValue()) {
          // Only translate if empty
          const portugueseTranslation = LanguageApp.translate(
            englishText,
            "en",
            "pt",
          );
          portugueseCell.setValue(portugueseTranslation);
        }
      }
    }
  }
}

function generateCoMapeoConfig() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  // Assuming you already have the logic to transform data into a CoMapeo config
  const config = processSpreadsheetData(data);

  // Display the generated configuration as JSON or export to file
  const configString = JSON.stringify(config, null, 2);
  Logger.log(configString);

  // Optionally, save the config to a new sheet or a file
  saveConfigToFile(configString);
}

// Function to process the spreadsheet data and generate CoMapeo configuration
function processSpreadsheetData(data: any[][]): object {
  // Your existing logic for processing data
  // Example placeholder:
  const config = {
    // Populate with your logic
    layers: data.map((row) => ({
      id: row[0],
      name: row[1],
      type: row[2],
    })),
  };

  return config;
}

// Optional: Save the configuration to a new file (Google Drive or Sheet)
function saveConfigToFile(config: string) {
  const folder = DriveApp.getFolderById("YOUR_FOLDER_ID");
  const file = folder.createFile("CoMapeoConfig.json", config);
  Logger.log(`Config saved: ${file.getUrl()}`);
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("CoMapeo Tools")
    .addItem("Generate Configuration", "generateCoMapeoConfig")
    .addToUi();
}
