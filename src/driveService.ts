function saveDriveFolderToZip(folderId): GoogleAppsScript.Base.Blob {
  console.log("Attempting to access folder with ID:", folderId);

  if (!folderId) {
    throw new Error("Folder ID is null or undefined");
  }

  let folder: GoogleAppsScript.Drive.Folder;
  try {
    folder = DriveApp.getFolderById(folderId);
  } catch (error) {
    console.error("Failed to access folder by ID:", folderId, error);
    throw new Error(`Failed to access Drive folder with ID "${folderId}". This could be due to permissions or the folder not being properly created. Original error: ${error.message}`);
  }

  if (!folder) {
    throw new Error(`Folder with ID "${folderId}" was not found or is not accessible`);
  }

  console.log("Successfully accessed folder:", folder.getName());
  const blobs: GoogleAppsScript.Base.Blob[] = [];

  function addFolderContentsToBlobs(
    currentFolder: GoogleAppsScript.Drive.Folder,
    path = "",
  ) {
    const files = currentFolder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      blobs.push(file.getBlob().setName(`${path}${file.getName()}`));
    }

    const subFolders = currentFolder.getFolders();
    while (subFolders.hasNext()) {
      const subFolder = subFolders.next();
      const newPath = `${path}${subFolder.getName()}/`;
      addFolderContentsToBlobs(subFolder, newPath);
    }
  }

  addFolderContentsToBlobs(folder);
  const zipBlob = Utilities.zip(blobs, `${folder.getName()}.zip`);
  return zipBlob;
}

function getConfigFolder(): GoogleAppsScript.Drive.Folder {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const configFolderName = slugify(spreadsheet.getName());

  let configFolder: GoogleAppsScript.Drive.Folder;
  const configFolders =
    DriveApp.getRootFolder().getFoldersByName(configFolderName);

  if (configFolders.hasNext()) {
    configFolder = configFolders.next();
  } else {
    configFolder = DriveApp.getRootFolder().createFolder(configFolderName);
  }
  return configFolder;
}

function saveZipToDrive(zipBlob: GoogleAppsScript.Base.Blob, version): string {
  console.log("Saving ZIP file to Drive...");
  const configFolder = getConfigFolder();
  const buildsFolder = "builds";
  let buildsFolderObj: GoogleAppsScript.Drive.Folder;
  const buildsFolders = configFolder.getFoldersByName(buildsFolder);
  if (buildsFolders.hasNext()) {
    buildsFolderObj = buildsFolders.next();
  } else {
    buildsFolderObj = configFolder.createFolder(buildsFolder);
  }
  console.log("Saving ZIP file to Drive...");
  const fileName = `${version}.zip`;
  const doubleZippedBlob = Utilities.zip([zipBlob], fileName);
  const zipFile = buildsFolderObj
    .createFile(doubleZippedBlob)
    .setName(fileName);
  const fileUrl = zipFile.getUrl();
  Logger.log(`Download the ZIP file here: ${fileUrl}`);

  return fileUrl;
}

function saveConfigToDrive(config: CoMapeoConfig): { url: string; id: string } {
  const configFolder = getConfigFolder();
  const folderName = `${slugify(config.metadata.version)}`;
  console.log("Saving config to drive:", folderName);
  let rootFolder: GoogleAppsScript.Drive.Folder;
  try {
    const rawBuildsFolder = configFolder.getFoldersByName("rawBuilds").hasNext()
      ? configFolder.getFoldersByName("rawBuilds").next()
      : configFolder.createFolder("rawBuilds");
    rootFolder = rawBuildsFolder.createFolder(folderName);
  } catch (error) {
    console.error(`Error creating folder: ${error}`);
    throw new Error(
      `Failed to create folder "${folderName}" in "rawBuilds". Please check your Drive permissions and try again.`,
    );
  }
  if (!rootFolder) {
    throw new Error(
      `Failed to create folder "${folderName}" in "rawBuilds". Root folder is undefined.`,
    );
  }
  console.log("Created folder:", rootFolder.getName(), "in rawBuilds");

  // Verify folder ID is valid before proceeding
  const folderId = rootFolder.getId();
  console.log("Folder ID:", folderId);

  if (!folderId) {
    throw new Error("Failed to get valid folder ID from created folder");
  }

  try {
    const folders = createSubFolders(rootFolder);
    console.log("Created subfolders successfully");

    // Process each step individually with better error handling
    console.log("Saving presets and icons...");
    savePresetsAndIcons(config, folders, ["-100px", "-24px"]);

    console.log("Saving fields...");
    saveFields(config.fields, folders.fields);

    console.log("Saving messages...");
    saveMessages(config.messages, folders.messages);

    console.log("Saving metadata and package...");
    saveMetadataAndPackage(config, rootFolder);

    console.log("Successfully saved all config files to folder");

    // Add a small delay to ensure Drive operations are fully committed
    Utilities.sleep(1000);

    return {
      url: rootFolder.getUrl(),
      id: folderId,
    };
  } catch (error) {
    console.error("Error saving config files to Drive:", error);
    throw new Error(`Failed to save config files to Drive: ${error.message}`);
  }
}

function createSubFolders(rootFolder: GoogleAppsScript.Drive.Folder) {
  return {
    presets: rootFolder.createFolder("presets"),
    icons: rootFolder.createFolder("icons"),
    fields: rootFolder.createFolder("fields"),
    messages: rootFolder.createFolder("messages"),
  };
}

function savePresetsAndIcons(
  config: CoMapeoConfig,
  folders: {
    presets: GoogleAppsScript.Drive.Folder;
    icons: GoogleAppsScript.Drive.Folder;
  },
  suffixes: string[],
) {
  try {
    console.log("Saving presets...");
    savePresets(config.presets, folders.presets);
    console.log("Processing icons...");
    config.icons = processIcons(folders.icons, suffixes);
    console.log("Icons processed successfully");
  } catch (error) {
    console.error("Error in savePresetsAndIcons:", error);
    throw new Error(`Failed to save presets and icons: ${error.message}`);
  }
}

function savePresets(
  presets: CoMapeoPreset[],
  presetsFolder: GoogleAppsScript.Drive.Folder,
) {
  for (const preset of presets) {
    const presetJson = JSON.stringify(preset, null, 2);
    presetsFolder.createFile(
      `${preset.icon}.json`,
      presetJson,
      MimeType.PLAIN_TEXT,
    );
  }
}

function saveFields(
  fields: CoMapeoField[],
  fieldsFolder: GoogleAppsScript.Drive.Folder,
) {
  for (const field of fields) {
    const fieldJson = JSON.stringify(field, null, 2);
    fieldsFolder.createFile(
      `${field.tagKey}.json`,
      fieldJson,
      MimeType.PLAIN_TEXT,
    );
  }
}

function saveMessages(
  messages: CoMapeoTranslations,
  messagesFolder: GoogleAppsScript.Drive.Folder,
) {
  for (const [lang, langMessages] of Object.entries(messages)) {
    const messagesJson = JSON.stringify(langMessages, null, 2);
    messagesFolder.createFile(
      `${lang}.json`,
      messagesJson,
      MimeType.PLAIN_TEXT,
    );
  }
}

function saveMetadataAndPackage(
  config: CoMapeoConfig,
  rootFolder: GoogleAppsScript.Drive.Folder,
) {
  rootFolder.createFile(
    "metadata.json",
    JSON.stringify(config.metadata, null, 2),
    MimeType.PLAIN_TEXT,
  );
  rootFolder.createFile(
    "package.json",
    JSON.stringify(config.packageJson, null, 2),
    MimeType.PLAIN_TEXT,
  );
}
