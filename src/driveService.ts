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

function saveZipToDrive(zipBlob: GoogleAppsScript.Base.Blob): string {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const configFolderName = slugify(spreadsheet.getName());
  const buildsFolder = 'builds';
  
  let configFolder = DriveApp.getRootFolder().getFoldersByName(configFolderName).next();
  if (!configFolder) {
    configFolder = DriveApp.getRootFolder().createFolder(configFolderName);
  }
  
  let buildsFolderObj = configFolder.getFoldersByName(buildsFolder).next();
  if (!buildsFolderObj) {
    buildsFolderObj = configFolder.createFolder(buildsFolder);
  }
  
  const fileName = "config.zip";
  const doubleZippedBlob = Utilities.zip([zipBlob], fileName);
  const zipFile = buildsFolderObj.createFile(doubleZippedBlob).setName(fileName);

  const fileUrl = zipFile.getUrl();
  Logger.log("Download the ZIP file here: " + fileUrl);

  return fileUrl;
}

function saveConfigToDrive(config: CoMapeoConfig): { url: string; id: string } {
  const folderName = generateFolderName(config.metadata.name);
  console.log('Saving config to drive:', folderName);
  let rootFolder: GoogleAppsScript.Drive.Folder;
  try {
    rootFolder = DriveApp.createFolder(folderName);
  } catch (error) {
    console.error(`Error creating folder: ${error}`);
    throw new Error(`Failed to create folder "${folderName}". Please check your Drive permissions and try again.`);
  }
  if (!rootFolder) {
    throw new Error(`Failed to create folder "${folderName}". Root folder is undefined.`);
  }
  console.log('Created folder:', rootFolder.getName());
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

function generateFolderName(documentName: string): string {
  const version = Utilities.formatDate(new Date(), 'UTC', 'yy.MM.dd');
  return `${slugify(documentName)}-${version}`;
}

function createSubFolders(rootFolder: GoogleAppsScript.Drive.Folder) {
  return {
    presets: rootFolder.createFolder('presets'),
    icons: rootFolder.createFolder('icons'),
    fields: rootFolder.createFolder('fields'),
    messages: rootFolder.createFolder('messages')
  };
}

function savePresetsAndIcons(config: CoMapeoConfig, folders: { presets: GoogleAppsScript.Drive.Folder, icons: GoogleAppsScript.Drive.Folder }, suffixes?: string[]) {
  savePresets(config.presets, folders.presets);
  saveIcons(config.icons, folders.icons, suffixes);
}

function savePresets(presets: CoMapeoPreset[], presetsFolder: GoogleAppsScript.Drive.Folder) {
  presets.forEach(preset => {
    savePreset(preset, presetsFolder);
  });
}

function saveIcons(icons: CoMapeoIcon[], iconsFolder: GoogleAppsScript.Drive.Folder, suffixes?: string[]) {
  const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  icons.forEach((icon, index) => {
    if (icon) {
      saveIcon(icon, iconsFolder, categoriesSheet, index, suffixes);
    }
  });
}

function savePreset(preset: CoMapeoPreset, presetsFolder: GoogleAppsScript.Drive.Folder) {
  const presetJson = JSON.stringify(preset, null, 2);
  presetsFolder.createFile(`${preset.icon}.json`, presetJson, MimeType.PLAIN_TEXT);
}

function saveIcon(icon: CoMapeoIcon, iconsFolder: GoogleAppsScript.Drive.Folder, categoriesSheet: GoogleAppsScript.Spreadsheet.Sheet, index: number, suffixes?: string[]) {
  const { iconContent, mimeType } = getIconContent(icon);
  console.log(`Saving icon for category ${icon.name}:`, iconContent);
  if (!iconContent) {
    throw new Error('Icon content is missing or invalid');
  }

  const suffixesToUse = suffixes || [''];

  suffixesToUse.forEach((suffix, i) => {
    const file = createIconFile(iconsFolder, icon.name, suffix, iconContent, mimeType);
    console.log(`Generated icon with suffix ${suffix}:`, file.getUrl());
    
    if (i === 0) {
      updateIconUrlInSheet(categoriesSheet, index + 2, 2, file.getUrl());
    }
  });
}

function getIconContent(icon: CoMapeoIcon): { iconContent: string | null, mimeType: string } {
  console.log(`Getting icon content for ${icon.name}:`, icon.svg);
  if (icon.svg.startsWith('data:image/svg+xml,')) {
    console.log('Saving data:image/svg+xml icon as SVG');
    return {
      iconContent: decodeURIComponent(icon.svg.replace(/data:image\/svg\+xml,/, '')),
      mimeType: MimeType.SVG
    };
  } else if (icon.svg.startsWith('https://drive.google.com/file/d/')) {
    const fileId = icon.svg.split('/d/')[1].split('/')[0];
    const file = DriveApp.getFileById(fileId);
    return {
      iconContent: file.getBlob().getDataAsString(),
      mimeType: file.getMimeType()
    };
  } else {
    console.error('Unsupported icon format');
    return { iconContent: null, mimeType: '' };
  }
}

function createIconFile(folder: GoogleAppsScript.Drive.Folder, name: string, suffix: string | undefined, content: string, mimeType: string) {
  console.log(`Creating icon file for ${name}${suffix ? ' of size ' + suffix : ''}:`, content);
  const extension = mimeType === MimeType.SVG ? 'svg' : 'png';
  const fileName = suffix ? `${name}${suffix}.${extension}` : `${name}.${extension}`;
  return folder.createFile(fileName, content, mimeType);
}

function createSmallerIcon(iconContent: string, mimeType: string): string {
  if (mimeType === MimeType.SVG) {
    return iconContent.replace(/width="(\d+)" height="(\d+)"/, 'width="24" height="24"');
  }
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
