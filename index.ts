function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("CoMapeo Tools")
    .addItem("Translate CoMapeo Category", "translateCoMapeoCategory")
    .addItem("Generate CoMapeo Category", "generateCoMapeoCategory")
    .addToUi();
}

function translateCoMapeoCategory() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    "Translate CoMapeo Category",
    "This will translate all empty cells in the other transltion language columns. Continue?",
    ui.ButtonSet.YES_NO,
  );

  if (result === ui.Button.YES) {
    try {
      autoTranslateSheets();
      ui.alert(
        "Translation Complete",
        "All sheets have been translated successfully.",
        ui.ButtonSet.OK,
      );
    } catch (error) {
      ui.alert(
        "Error",
        `An error occurred during translation: ${error.message}`,
        ui.ButtonSet.OK,
      );
    }
  }
}

function generateCoMapeoCategory() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    "Generate CoMapeo Category",
    "This will generate the CoMapeo configuration based on the current spreadsheet data. Continue?",
    ui.ButtonSet.YES_NO,
  );

  if (result === ui.Button.YES) {
    try {
      generateCoMapeoConfig();
    } catch (error) {
      ui.alert(
        "Error",
        `An error occurred while generating the configuration: ${error.message}`,
        ui.ButtonSet.OK,
      );
    }
  }
}
