function saveDriveFolderToZip(folderId): GoogleAppsScript.Base.Blob {
  const folder: GoogleAppsScript.Drive.Folder = DriveApp.getFolderById(folderId);
  const blobs: GoogleAppsScript.Base.Blob[] = [];

  function addFolderContentsToBlobs(currentFolder: GoogleAppsScript.Drive.Folder, path: string = '') {
    const files = currentFolder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      blobs.push(file.getBlob().setName(path + file.getName()));
    }

    const subFolders = currentFolder.getFolders();
    while (subFolders.hasNext()) {
      const subFolder = subFolders.next();
      const newPath = path + subFolder.getName() + '/';
      addFolderContentsToBlobs(subFolder, newPath);
    }
  }

  addFolderContentsToBlobs(folder);
  const zipBlob = Utilities.zip(blobs, folder.getName() + ".zip");
  return zipBlob;
}

function getConfigFolder (): GoogleAppsScript.Drive.Folder {
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

function saveZipToDrive(zipBlob: GoogleAppsScript.Base.Blob, version): string {
  console.log('Saving ZIP file to Drive...');
  const configFolder = getConfigFolder()
  const buildsFolder = 'builds';
  let buildsFolderObj;
  const buildsFolders = configFolder.getFoldersByName(buildsFolder);
  if (buildsFolders.hasNext()) {
    buildsFolderObj = buildsFolders.next();
  } else {
    buildsFolderObj = configFolder.createFolder(buildsFolder);
  }
  console.log('Saving ZIP file to Drive...');
  const fileName = `${version}.zip`;
  const doubleZippedBlob = Utilities.zip([zipBlob], fileName);
  const zipFile = buildsFolderObj.createFile(doubleZippedBlob).setName(fileName);

  const fileUrl = zipFile.getUrl();
  Logger.log("Download the ZIP file here: " + fileUrl);

  return fileUrl;
}


function saveConfigToDrive(config: CoMapeoConfig): { url: string; id: string } {
  const configFolder = getConfigFolder();
  const folderName = `${slugify(config.metadata.version)}`;
  console.log('Saving config to drive:', folderName);
  let rootFolder: GoogleAppsScript.Drive.Folder;
  try {
    const rawBuildsFolder = configFolder.getFoldersByName('rawBuilds').hasNext()
      ? configFolder.getFoldersByName('rawBuilds').next()
      : configFolder.createFolder('rawBuilds');
    rootFolder = rawBuildsFolder.createFolder(folderName);
  } catch (error) {
    console.error(`Error creating folder: ${error}`);
    throw new Error(`Failed to create folder "${folderName}" in "rawBuilds". Please check your Drive permissions and try again.`);
  }
  if (!rootFolder) {
    throw new Error(`Failed to create folder "${folderName}" in "rawBuilds". Root folder is undefined.`);
  }
  console.log('Created folder:', rootFolder.getName(), 'in rawBuilds');
  const folders = createSubFolders(rootFolder);
  savePresetsAndIcons(config, folders, ['-100px', '-24px']);
  saveFields(config.fields, folders.fields);
  saveMessages(config.messages, folders.messages);
  saveMetadataAndPackage(config, rootFolder);
  return {
    url: rootFolder.getUrl(),
    id: rootFolder.getId()
  };
}

function createSubFolders(rootFolder: GoogleAppsScript.Drive.Folder) {
  return {
    presets: rootFolder.createFolder('presets'),
    icons: rootFolder.createFolder('icons'),
    fields: rootFolder.createFolder('fields'),
    messages: rootFolder.createFolder('messages')
  };
}

function savePresetsAndIcons(config: CoMapeoConfig, folders: { presets: GoogleAppsScript.Drive.Folder, icons: GoogleAppsScript.Drive.Folder }, suffixes: string[]) {
  savePresets(config.presets, folders.presets);
  config.icons = processIcons(folders.icons, suffixes);
}

function savePresets(presets: CoMapeoPreset[], presetsFolder: GoogleAppsScript.Drive.Folder) {
  presets.forEach(preset => {
    const presetJson = JSON.stringify(preset, null, 2);
    presetsFolder.createFile(`${preset.icon}.json`, presetJson, MimeType.PLAIN_TEXT);
  });
}

function saveFields(fields: CoMapeoField[], fieldsFolder: GoogleAppsScript.Drive.Folder) {
  fields.forEach(field => {
    const fieldJson = JSON.stringify(field, null, 2);
    fieldsFolder.createFile(`${field.tagKey}.json`, fieldJson, MimeType.PLAIN_TEXT);
  });
}

function saveMessages(messages: CoMapeoTranslations, messagesFolder: GoogleAppsScript.Drive.Folder) {
  Object.entries(messages).forEach(([lang, langMessages]) => {
    const messagesJson = JSON.stringify(langMessages, null, 2);
    messagesFolder.createFile(`${lang}.json`, messagesJson, MimeType.PLAIN_TEXT);
  });
}

function saveMetadataAndPackage(config: CoMapeoConfig, rootFolder: GoogleAppsScript.Drive.Folder) {
  rootFolder.createFile('metadata.json', JSON.stringify(config.metadata, null, 2), MimeType.PLAIN_TEXT);
  rootFolder.createFile('package.json', JSON.stringify(config.packageJson, null, 2), MimeType.PLAIN_TEXT);
}
