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

function saveZipToDrive(zipBlob) {
  var folder = DriveApp.getRootFolder();  // Save to root folder
  const fileName = "config.zip";
  const doubleZippedBlob = Utilities.zip([zipBlob], fileName);
  var zipFile = folder.createFile(doubleZippedBlob).setName(fileName);

  // Generate a download link
  var fileUrl = zipFile.getUrl();
  Logger.log("Download the ZIP file here: " + fileUrl);

  // Optionally send the link to the user via email or show in the UI
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
  savePresetsAndIcons(config, folders);
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
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');
        
        body {
          font-family: 'Roboto', sans-serif;
          line-height: 1.6;
          color: #e0e0e0;
          background: linear-gradient(135deg, #1a1a1a, #2c2c2c);
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          text-align: center;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
          border-radius: 10px;
        }
        h1 {
          color: #6d44d9;
          font-size: 2.5em;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          margin-bottom: 30px;
        }
        p {
          margin-bottom: 25px;
          font-size: 1.1em;
        }
        .logo {
          width: 200px;
          height: 200px;
          margin-bottom: 30px;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(109, 68, 217, 0.7);
          transition: transform 0.3s ease;
        }
        .logo:hover {
          transform: scale(1.05);
        }
        .folder-btn {
          display: inline-block;
          background: linear-gradient(45deg, #330B9E, #6d44d9);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 50px;
          font-weight: bold;
          font-size: 1.2em;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .folder-btn:hover {
          background: linear-gradient(45deg, #4A0ED6, #8a67e8);
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
        }
        .container {
          background-color: rgba(255, 255, 255, 0.05);
          padding: 30px;
          border-radius: 15px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <img src="https://github.com/digidem/comapeo-mobile/blob/develop/assets/splash.png?raw=true" alt="CoMapeo Logo" class="logo">
      <h1>CoMapeo Configuration Generated</h1>
      <div class="container">
        <p>Your CoMapeo configuration files have been successfully generated and compressed into a zip file.</p>
        <p>To download your configuration, click the button below.</p>
        <p>Once downloaded, extract the contents to locate the .comapeocat file, which can be imported into the CoMapeo app.</p>
        <a href="${folderUrl}" target="_blank" class="folder-btn">Download CoMapeo Configuration</a>
      </div>
    </body>
    </html>
  `;
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(650).setHeight(800), 'CoMapeo Configuration Generated');
}
