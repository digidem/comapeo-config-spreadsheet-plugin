function generateIconsConfig() {
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
