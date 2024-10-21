function saveZipToDrive(zipBlob) {
  var folder = DriveApp.getRootFolder();  // Save to root folder
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const fileName = `${spreadsheet.getName()}.comapeocat`;
  var zipFile = folder.createFile(zipBlob).setName(fileName);

  // Generate a download link
  var fileUrl = zipFile.getUrl();
  Logger.log("Download the ZIP file here: " + fileUrl);

  // Optionally send the link to the user via email or show in the UI
  return fileUrl;
}

function saveConfigToDrive(config: CoMapeoConfig): string {
  const folderName = generateFolderName(config.metadata.name);
  console.log('Saving config to drive:', folderName);
  const rootFolder = DriveApp.createFolder(folderName);
  const folders = createSubFolders(rootFolder);

  savePresetsAndIcons(config, folders);
  saveFields(config.fields, folders.fields);
  saveMessages(config.messages, folders.messages);
  saveMetadataAndPackage(config, rootFolder);

  return rootFolder.getUrl();
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

function savePresetsAndIcons(config: CoMapeoConfig, folders: { presets: GoogleAppsScript.Drive.Folder, icons: GoogleAppsScript.Drive.Folder }) {
  const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  config.presets.forEach((preset, index) => {
    savePreset(preset, folders.presets);
    if (config.icons[index]) {
      saveIcon(config.icons[index], folders.icons, categoriesSheet, index);
    }
  });
}

function savePreset(preset: CoMapeoPreset, presetsFolder: GoogleAppsScript.Drive.Folder) {
  const presetJson = JSON.stringify(preset, null, 2);
  presetsFolder.createFile(`${preset.icon}.json`, presetJson, MimeType.PLAIN_TEXT);
}

function saveIcon(icon: CoMapeoIcon, iconsFolder: GoogleAppsScript.Drive.Folder, categoriesSheet: GoogleAppsScript.Spreadsheet.Sheet, index: number) {
  const { iconContent, mimeType } = getIconContent(icon);
  if (!iconContent) return;

  const file100px = createIconFile(iconsFolder, icon.name, '100px', iconContent, mimeType);
  const smallerContent = createSmallerIcon(iconContent, mimeType);
  createIconFile(iconsFolder, icon.name, '24px', smallerContent, mimeType);

  updateIconUrlInSheet(categoriesSheet, index + 2, 2, file100px.getUrl());
}

function getIconContent(icon: CoMapeoIcon): { iconContent: string | null, mimeType: string } {
  if (icon.svg.startsWith('data:image/svg+xml,')) {
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

function createIconFile(folder: GoogleAppsScript.Drive.Folder, name: string, size: string, content: string, mimeType: string) {
  const extension = mimeType === MimeType.SVG ? 'svg' : 'png';
  return folder.createFile(`${name}-${size}.${extension}`, content, mimeType);
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

function showDownloadLink(folderUrl: string) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CoMapeo Configuration Generated</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #e0e0e0;
          background-color: #1a1a1a;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        h1 {
          color: #330B9E;
        }
        p {
          margin-bottom: 20px;
        }
        .folder-btn {
          display: inline-block;
          background-color: #330B9E;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          transition: background-color 0.3s ease;
        }
        .folder-btn:hover {
          background-color: #4A0ED6;
        }
      </style>
    </head>
    <body>
      <img src="https://github.com/digidem/comapeo-mobile/blob/develop/assets/splash.png?raw=true" alt="CoMapeo Logo" style="width: 175px; height: 175px;">
      <h1>CoMapeo Configuration Generated</h1>
      <p>Your CoMapeo configuration files have been generated and saved to Google Drive.</p>
      <p>Click the button below to access the folder containing your configuration files.</p>
      <a href="${folderUrl}" target="_blank" class="folder-btn">Open Google Drive Folder</a>
    </body>
    </html>
  `;
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(650).setHeight(500), 'CoMapeo Configuration Generated');
}
