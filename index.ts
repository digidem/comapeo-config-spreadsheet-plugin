let locale = Session.getActiveUserLocale().split("_")[0];
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu(menuTexts[locale].menu)
    .addItem(menuTexts[locale].translateCoMapeoCategory, "translateCoMapeoCategory")
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
    translateTexts[locale].action,
    translateTexts[locale].actionText,
    ui.ButtonSet.YES_NO,
  );

  if (result === ui.Button.YES) {
    try {
      autoTranslateSheets();
      ui.alert(
        translateTexts[locale].completed,
        translateTexts[locale].completedText,
        ui.ButtonSet.OK,
      );
    } catch (error) {
      ui.alert(
         translateTexts[locale].error,
        translateTexts[locale].errorText + error.message,
        ui.ButtonSet.OK,
      );
    }
  }
}

function generateIcons() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    iconTexts[locale].action,
    iconTexts[locale].actionText,
    ui.ButtonSet.YES_NO,
  );

  if (result === ui.Button.YES) {
    try {
      generateIconsConfig();
    } catch (error) {
      ui.alert(
        iconTexts[locale].error,
        iconTexts[locale].errorText + error.message,
        ui.ButtonSet.OK,
      );
    }
  }
}

function generateProjectKey() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    projectKeyTexts[locale].action,
    projectKeyTexts[locale].actionText,
    ui.ButtonSet.YES_NO,
  );

  if (result === ui.Button.YES) {
    try {
      generateProjectKeyConfig();
    } catch (error) {
      ui.alert(
        projectKeyTexts[locale].error,
        projectKeyTexts[locale].errorText,
        ui.ButtonSet.OK,
      );
    }
  }
}

function generateCoMapeoCategory() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    categoryTexts[locale].action,
    categoryTexts[locale].actionText,
    ui.ButtonSet.YES_NO,
  );

  if (result === ui.Button.YES) {
    try {
      generateCoMapeoConfig();
    } catch (error) {
      ui.alert(
        categoryTexts[locale].error,
        categoryTexts[locale].errorText + error.message,
        ui.ButtonSet.OK,
      );
    }
  }
}

function lintCoMapeoCategory() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    lintTexts[locale].action,
    lintTexts[locale].actionText,
    ui.ButtonSet.YES_NO
  );

  if (result === ui.Button.YES) {
    try {
      lintAllSheets();
      ui.alert(
        lintTexts[locale].completed,
        lintTexts[locale].completedText,
        ui.ButtonSet.OK
      );
    } catch (error) {
      ui.alert(
        lintTexts[locale].error,
        lintTexts[locale].errorText + error.message,
        ui.ButtonSet.OK
      );
    }
  }
}

function cleanAllSheets() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    cleanAllTexts[locale].action,
    cleanAllTexts[locale].actionText,
    ui.ButtonSet.YES_NO
  );

  if (result === ui.Button.YES) {
    try {
      removeTranslationAndMetadataSheets();
      ui.alert(
        cleanAllTexts[locale].completed,
        cleanAllTexts[locale].completedText,
        ui.ButtonSet.OK
      );
    } catch (error) {
      ui.alert(
        cleanAllTexts[locale].error,
        cleanAllTexts[locale].errorText + error.message,
        ui.ButtonSet.OK
      );
    }
  }
}

function openHelpPage() {
  showHelpDialog()
}
