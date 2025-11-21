/**
 * Google Drive Service for CoMapeo Config v2.0.0
 * Simplified - no ZIP workflow
 */

/**
 * Gets or creates the config folder in Drive root
 */
function getConfigFolder(): GoogleAppsScript.Drive.Folder {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const configFolderName = slugify(spreadsheet.getName());

  let configFolder: GoogleAppsScript.Drive.Folder;
  const configFolders = DriveApp.getRootFolder().getFoldersByName(configFolderName);

  if (configFolders.hasNext()) {
    configFolder = configFolders.next();
  } else {
    configFolder = DriveApp.getRootFolder().createFolder(configFolderName);
  }
  return configFolder;
}

/**
 * Gets or creates a subfolder within the config folder
 */
function getOrCreateSubfolder(parentFolder: GoogleAppsScript.Drive.Folder, name: string): GoogleAppsScript.Drive.Folder {
  const folders = parentFolder.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(name);
}
