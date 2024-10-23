function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("CoMapeo Tools")
    .addItem("Translate CoMapeo Category", "translateCoMapeoCategory")
    .addItem("Generate Category Icons", "generateIcons")
    .addItem("Generate Project Key", "generateProjectKey")
    .addSeparator()
    .addItem("Generate CoMapeo Category", "generateCoMapeoCategory")
    .addSeparator()
    .addItem("Lint Sheets", "lintAllSheets")
    .addItem("Reset Spreadsheet", "cleanAllSheets")
    .addItem("Help", "openHelpPage")
    .addToUi();
}

function translateCoMapeoCategory() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    "Translate CoMapeo Category",
    "This will translate all empty cells in the other translation language columns. Continue?",
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

function generateIcons() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    "Generate Icons",
    "This will generate icons based on the current spreadsheet data. It may take a few minutes to process. Continue?",
    ui.ButtonSet.YES_NO,
  );

  if (result === ui.Button.YES) {
    try {
      generateIconsConfig();
    } catch (error) {
      ui.alert(
        "Error",
        `An error occurred while generating the configuration: ${error.message}`,
        ui.ButtonSet.OK,
      );
    }
  }
}

function generateProjectKey() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    "Generate Project Key",
    "This will generate a project key for your CoMapeo Category. Continue?",
    ui.ButtonSet.YES_NO,
  );

  if (result === ui.Button.YES) {
    try {
      generateProjectKeyConfig();
    } catch (error) {
      ui.alert(
        "Error",
        `An error occurred while generating the configuration: ${error.message}`,
        ui.ButtonSet.OK,
      );
    }
  }
}

function generateCoMapeoCategory() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    "Generate CoMapeo Category",
    "This will generate a CoMapeo category based on the current spreadsheet data. It may take a few minutes to process. Continue?",
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

function lintCoMapeoCategory() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    "Lint CoMapeo Category",
    "This will lint all sheets in the spreadsheet. Continue?",
    ui.ButtonSet.YES_NO
  );

  if (result === ui.Button.YES) {
    try {
      lintAllSheets();
      ui.alert(
        "Linting Complete",
        "All sheets have been linted successfully.",
        ui.ButtonSet.OK
      );
    } catch (error) {
      ui.alert(
        "Error",
        `An error occurred during linting: ${error.message}`,
        ui.ButtonSet.OK
      );
    }
  }
}

function cleanAllSheets() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    "Reset Spreadsheet",
    "Attention! This will remove all translations, metadata, and icons from the spreadsheet. This action cannot be undone. Continue?",
    ui.ButtonSet.YES_NO
  );

  if (result === ui.Button.YES) {
    try {
      removeTranslationAndMetadataSheets();
      ui.alert(
        "Reset Complete",
        "All sheets have been reset successfully.",
        ui.ButtonSet.OK
      );
    } catch (error) {
      ui.alert(
        "Error",
        `An error occurred during reset: ${error.message}`,
        ui.ButtonSet.OK
      );
    }
  }
}

function openHelpPage() {
  showHelpDialog()
}