let activeUserLocale = Session.getActiveUserLocale().split("_")[0];
const supportedLocales = ["en", "es"]
const defaultLocale = "en"
let locale = supportedLocales.includes(activeUserLocale) ? activeUserLocale : defaultLocale

function onOpen() {
  const ui = SpreadsheetApp.getUi();
<<<<<<< HEAD
  ui.createMenu(menuTexts[locale].menu)
    .addItem(menuTexts[locale].translateCoMapeoCategory, "translateCoMapeoCategory")
    .addItem("Add Custom Languages", "addCustomLanguages")
    .addItem(menuTexts[locale].generateIcons, "generateIcons")
    .addItem(menuTexts[locale].generateProjectKey, "generateProjectKey")
    .addSeparator()
    .addItem(menuTexts[locale].generateCoMapeoCategory, "generateCoMapeoCategory")
    .addSeparator()
    .addItem(menuTexts[locale].lintAllSheets, "lintAllSheets")
    .addItem(menuTexts[locale].cleanAllSheets, "cleanAllSheets")
    .addItem(menuTexts[locale].openHelpPage, "openHelpPage")
    .addToUi();
}

function translateCoMapeoCategory() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    translateMenuTexts[locale].action,
    translateMenuTexts[locale].actionText,
    ui.ButtonSet.YES_NO,
  );

  if (result === ui.Button.YES) {
    try {
      autoTranslateSheets();
      ui.alert(
        translateMenuTexts[locale].completed,
        translateMenuTexts[locale].completedText,
        ui.ButtonSet.OK,
      );
    } catch (error) {
      ui.alert(
         translateMenuTexts[locale].error,
        translateMenuTexts[locale].errorText + error.message,
        ui.ButtonSet.OK,
      );
    }
  }
}

function addCustomLanguages() {
  try {
    showAddLanguagesDialog();
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      "Error",
      `An error occurred while adding languages: ${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}


function generateIcons() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    iconMenuTexts[locale].action,
    iconMenuTexts[locale].actionText,
    ui.ButtonSet.YES_NO,
  );

  if (result === ui.Button.YES) {
    try {
      generateIconsConfig();
    } catch (error) {
      ui.alert(
        iconMenuTexts[locale].error,
        iconMenuTexts[locale].errorText + error.message,
        ui.ButtonSet.OK,
      );
    }
  }
}

function generateCoMapeoCategory() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    categoryMenuTexts[locale].action,
    categoryMenuTexts[locale].actionText,
    ui.ButtonSet.YES_NO,
  );

  if (result === ui.Button.YES) {
    try {
      generateCoMapeoConfig();
    } catch (error) {
      ui.alert(
        categoryMenuTexts[locale].error,
        categoryMenuTexts[locale].errorText + error.message,
        ui.ButtonSet.OK,
      );
    }
  }
}

function lintCoMapeoCategory() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    lintMenuTexts[locale].action,
    lintMenuTexts[locale].actionText,
    ui.ButtonSet.YES_NO
  );

  if (result === ui.Button.YES) {
    try {
      lintAllSheets();
      ui.alert(
        lintMenuTexts[locale].completed,
        lintMenuTexts[locale].completedText,
        ui.ButtonSet.OK
      );
    } catch (error) {
      ui.alert(
        lintMenuTexts[locale].error,
        lintMenuTexts[locale].errorText + error.message,
        ui.ButtonSet.OK
      );
    }
  }
}

function cleanAllSheets() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    cleanAllMenuTexts[locale].action,
    cleanAllMenuTexts[locale].actionText,
    ui.ButtonSet.YES_NO
  );

  if (result === ui.Button.YES) {
    try {
      removeTranslationAndMetadataSheets();
      ui.alert(
        cleanAllMenuTexts[locale].completed,
        cleanAllMenuTexts[locale].completedText,
        ui.ButtonSet.OK
      );
    } catch (error) {
      ui.alert(
        cleanAllMenuTexts[locale].error,
        cleanAllMenuTexts[locale].errorText + error.message,
        ui.ButtonSet.OK
      );
    }
  }
}

function openHelpPage() {
  showHelpDialog()
}
