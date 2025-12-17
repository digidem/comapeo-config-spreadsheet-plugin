/// <reference path="./generateIcons/svgValidator.ts" />

/**
 * Validates icons before processing to catch obvious issues early
 * @returns Validation result with warnings and errors
 */
function validateIconsBeforeProcessing(): {
  canContinue: boolean;
  warnings: string[];
  errors: string[];
} {
  const result = {
    canContinue: true,
    warnings: [] as string[],
    errors: [] as string[],
  };

  try {
    const { categories, iconUrls } = getCategoryData();

    for (let i = 0; i < categories.length; i++) {
      const [name] = categories[i];
      const iconValue = iconUrls[i][0];

      // Quick validation using svgValidator
      if (typeof quickValidateIcon === "function") {
        if (!quickValidateIcon(iconValue)) {
          result.warnings.push(
            `Icon for "${name}" may have issues (empty or invalid format)`,
          );
        }
      }

      // Check Drive URLs for accessibility
      if (
        typeof iconValue === "string" &&
        iconValue.startsWith("https://drive.google.com")
      ) {
        const fileId = iconValue.split("/d/")[1]?.split("/")[0];
        if (fileId) {
          // Use validateDriveAccess from svgValidator
          if (typeof validateDriveAccess === "function") {
            const validation = validateDriveAccess(fileId);
            if (!validation.valid) {
              result.errors.push(
                `Cannot access Drive file for "${name}": ${validation.error}`,
              );
              result.canContinue = false;
            }
          }
        }
      }
    }

    return result;
  } catch (error) {
    result.errors.push(
      `Pre-flight validation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    result.canContinue = false;
    return result;
  }
}

/**
 * Generates icon configuration and saves icons to Google Drive
 *
 * Creates or uses existing icons folder in the config directory,
 * then processes and saves all category icons as SVG files.
 * Shows success dialog with link to the generated icons folder.
 *
 * @example
 * generateIconsConfig();
 * // Creates/updates icons folder with category icons and shows success dialog
 */
function generateIconsConfig() {
  // Run pre-flight validation
  const validation = validateIconsBeforeProcessing();

  if (!validation.canContinue) {
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      "Icon Validation Failed",
      "Critical issues detected:\n\n" +
        validation.errors.join("\n") +
        "\n\nPlease fix these issues before generating icons.",
      ui.ButtonSet.OK,
    );
    return;
  }

  if (validation.warnings.length > 0) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      "Icon Validation Warnings",
      "Some potential issues detected:\n\n" +
        validation.warnings.join("\n") +
        "\n\nDo you want to continue anyway?",
      ui.ButtonSet.YES_NO,
    );

    if (response !== ui.Button.YES) {
      return;
    }
  }
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const parentFolder = DriveApp.getFileById(spreadsheet.getId())
    .getParents()
    .next();
  const configFolderName = slugify(spreadsheet.getName());
  const iconsFolderName = "icons";
  let iconsFolder: GoogleAppsScript.Drive.Folder;

  let configFolder: GoogleAppsScript.Drive.Folder | null = null;
  const configFolders = parentFolder.getFoldersByName(configFolderName);
  if (configFolders.hasNext()) {
    configFolder = configFolders.next();
  } else {
    configFolder = parentFolder.createFolder(configFolderName);
    console.log(`Created new config folder: ${configFolderName}`);
  }

  if (!configFolder) {
    throw new Error("Failed to create or find config folder");
  }

  const existingFolders = configFolder.getFoldersByName(iconsFolderName);
  if (existingFolders.hasNext()) {
    iconsFolder = existingFolders.next();
    console.log(`Using existing icons folder: ${iconsFolderName}`);
  } else {
    iconsFolder = configFolder.createFolder(iconsFolderName);
    console.log(`Created new icons folder: ${iconsFolderName}`);
  }

  processIcons(iconsFolder);
  showIconsGeneratedDialog(iconsFolder.getUrl());
}
