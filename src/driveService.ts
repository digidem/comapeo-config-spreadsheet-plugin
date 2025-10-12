/**
 * Creates a ZIP archive from a Google Drive folder
 *
 * Recursively collects all files from the folder and its subfolders,
 * then creates a ZIP blob. Includes retry logic for Drive API reliability
 * and progress reporting for long operations.
 *
 * @param folderId - Google Drive folder ID to archive
 * @param onProgress - Optional callback for progress updates
 * @returns ZIP file as a Blob
 * @throws Error if folder cannot be accessed or depth limit exceeded
 *
 * @example
 * const zip = saveDriveFolderToZip(folderId, (msg, detail) => {
 *   console.log(`${msg}: ${detail}`);
 * });
 * // Returns: Blob containing ZIP archive of folder contents
 */
function saveDriveFolderToZip(folderId, onProgress?: (message: string, detail?: string) => void): GoogleAppsScript.Base.Blob {
  console.log("[ZIP] Attempting to access folder with ID:", folderId);

  if (!folderId) {
    throw new Error("Folder ID is null or undefined");
  }

  // Progress callback helper
  const reportProgress = (message: string, detail?: string) => {
    console.log(`[ZIP] ${message}${detail ? ': ' + detail : ''}`);
    if (onProgress) {
      onProgress(message, detail);
    }
  };

  let folder: GoogleAppsScript.Drive.Folder;
  let retryCount = 0;
  const maxRetries = 3;

  // Retry logic for accessing folder (handles transient Drive API issues)
  while (retryCount <= maxRetries) {
    try {
      folder = DriveApp.getFolderById(folderId);
      break; // Success, exit retry loop
    } catch (error) {
      retryCount++;
      console.error(`[ZIP] Failed to access folder (attempt ${retryCount}/${maxRetries + 1}):`, error.message);

      if (retryCount > maxRetries) {
        throw new Error(`Failed to access Drive folder with ID "${folderId}" after ${maxRetries + 1} attempts. This could be due to permissions or the folder not being properly created. Original error: ${error.message}`);
      }

      // Wait before retrying (exponential backoff)
      const waitTime = 1000 * Math.pow(2, retryCount);
      console.log(`[ZIP] Waiting ${waitTime}ms before retry...`);
      Utilities.sleep(waitTime);
    }
  }

  if (!folder) {
    throw new Error(`Folder with ID "${folderId}" was not found or is not accessible`);
  }

  console.log("[ZIP] Successfully accessed folder:", folder.getName());
  reportProgress("Creating package... (5/8)", "Collecting files...");

  const blobs: GoogleAppsScript.Base.Blob[] = [];
  let fileCount = 0;
  const startTime = new Date().getTime();
  const MAX_FOLDER_DEPTH = 50;

  function addFolderContentsToBlobs(
    currentFolder: GoogleAppsScript.Drive.Folder,
    path = "",
    depth = 0,
  ) {
    // Prevent infinite recursion with depth limit
    if (depth > MAX_FOLDER_DEPTH) {
      console.error(`[ZIP] Maximum folder depth (${MAX_FOLDER_DEPTH}) exceeded at path: ${path}`);
      throw new Error(`Maximum folder depth of ${MAX_FOLDER_DEPTH} exceeded. Please check for circular folder references or deeply nested structures.`);
    }

    const files = currentFolder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      fileCount++;
      console.log(`[ZIP] Adding file ${fileCount}: ${path}${file.getName()}`);

      // Heartbeat logging and progress reporting every 10 files
      if (fileCount % 10 === 0) {
        const elapsed = ((new Date().getTime() - startTime) / 1000).toFixed(1);
        console.log(`[ZIP] Progress: ${fileCount} files processed in ${elapsed}s`);
        reportProgress("Creating package... (5/8)", `Collecting files (${fileCount})...`);
      }

      blobs.push(file.getBlob().setName(`${path}${file.getName()}`));
    }

    const subFolders = currentFolder.getFolders();
    while (subFolders.hasNext()) {
      const subFolder = subFolders.next();
      const newPath = `${path}${subFolder.getName()}/`;
      addFolderContentsToBlobs(subFolder, newPath, depth + 1);
    }
  }

  addFolderContentsToBlobs(folder);

  const totalTime = ((new Date().getTime() - startTime) / 1000).toFixed(1);
  console.log(`[ZIP] Collected ${fileCount} files in ${totalTime}s`);
  reportProgress("Creating package... (5/8)", `Compressing ${fileCount} files into archive...`);

  const zipStartTime = new Date().getTime();
  const zipBlob = Utilities.zip(blobs, `${folder.getName()}.zip`);
  const zipTime = ((new Date().getTime() - zipStartTime) / 1000).toFixed(1);

  console.log(`[ZIP] ZIP archive created in ${zipTime}s (size: ${zipBlob.getBytes().length} bytes)`);
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

/**
 * Saves CoMapeo configuration to Google Drive
 *
 * Creates a structured folder hierarchy in Drive and saves all configuration
 * files including fields.json, presets.json, icons, and translations.
 * Includes retry logic and progress reporting.
 *
 * @param config - Complete CoMapeo configuration object
 * @param onProgress - Optional callback for progress updates
 * @returns Object with folder URL and ID
 * @throws Error if folder creation fails or save operation fails
 *
 * @example
 * const result = saveConfigToDrive(config, (msg, detail) => {
 *   console.log(`${msg}: ${detail}`);
 * });
 * // Returns: { url: "https://drive.google.com/...", id: "abc123" }
 */
function saveConfigToDrive(config: CoMapeoConfig, onProgress?: (message: string, detail?: string) => void): { url: string; id: string } {
  const configFolder = getConfigFolder();
  const folderName = `${slugify(config.metadata.version)}`;
  console.log("[DRIVE] Saving config to drive:", folderName);
  const startTime = new Date().getTime();

  // Progress callback helper
  const reportProgress = (message: string, detail?: string) => {
    console.log(`[DRIVE] ${message}${detail ? ': ' + detail : ''}`);
    if (onProgress) {
      onProgress(message, detail);
    }
  };

  let rootFolder: GoogleAppsScript.Drive.Folder;
  let retryCount = 0;
  const maxRetries = 3;

  // Retry logic for folder creation (handles Drive API rate limits)
  while (retryCount <= maxRetries) {
    try {
      const rawBuildsFolder = configFolder.getFoldersByName("rawBuilds").hasNext()
        ? configFolder.getFoldersByName("rawBuilds").next()
        : configFolder.createFolder("rawBuilds");
      rootFolder = rawBuildsFolder.createFolder(folderName);
      break; // Success, exit retry loop
    } catch (error) {
      retryCount++;
      console.error(`[DRIVE] Error creating folder (attempt ${retryCount}/${maxRetries + 1}):`, error.message);

      if (retryCount > maxRetries) {
        throw new Error(
          `Failed to create folder "${folderName}" in "rawBuilds" after ${maxRetries + 1} attempts. Please check your Drive permissions and quota, then try again. Original error: ${error.message}`,
        );
      }

      // Wait before retrying (exponential backoff)
      const waitTime = 1000 * Math.pow(2, retryCount);
      console.log(`[DRIVE] Waiting ${waitTime}ms before retry...`);
      Utilities.sleep(waitTime);
    }
  }

  if (!rootFolder) {
    throw new Error(
      `Failed to create folder "${folderName}" in "rawBuilds". Root folder is undefined.`,
    );
  }
  console.log("[DRIVE] Created folder:", rootFolder.getName(), "in rawBuilds");

  // Verify folder ID is valid before proceeding
  const folderId = rootFolder.getId();
  console.log("[DRIVE] Folder ID:", folderId);

  if (!folderId) {
    throw new Error("Failed to get valid folder ID from created folder");
  }

  try {
    reportProgress("Saving to Drive... (4/8)", "Creating folders...");
    const folders = createSubFolders(rootFolder);
    console.log("[DRIVE] ✅ Created subfolders successfully");

    // Process each step individually with better error handling and progress logging
    reportProgress("Saving to Drive... (4/8)", `Saving ${config.presets.length} presets and icons...`);
    const presetsStart = new Date().getTime();
    savePresetsAndIcons(config, folders, ["-100px", "-24px"]);
    const presetsTime = ((new Date().getTime() - presetsStart) / 1000).toFixed(1);
    console.log(`[DRIVE] ✅ Saved presets and icons (${presetsTime}s)`);

    reportProgress("Saving to Drive... (4/8)", `Saving ${config.fields.length} fields...`);
    const fieldsStart = new Date().getTime();
    saveFields(config.fields, folders.fields);
    const fieldsTime = ((new Date().getTime() - fieldsStart) / 1000).toFixed(1);
    console.log(`[DRIVE] ✅ Saved ${config.fields.length} fields (${fieldsTime}s)`);

    const languageCount = Object.keys(config.messages).length;
    reportProgress("Saving to Drive... (4/8)", `Saving translations for ${languageCount} languages...`);
    const messagesStart = new Date().getTime();
    saveMessages(config.messages, folders.messages);
    const messagesTime = ((new Date().getTime() - messagesStart) / 1000).toFixed(1);
    console.log(`[DRIVE] ✅ Saved messages for ${languageCount} languages (${messagesTime}s)`);

    reportProgress("Saving to Drive... (4/8)", "Saving metadata and package...");
    const metadataStart = new Date().getTime();
    saveMetadataAndPackage(config, rootFolder);
    const metadataTime = ((new Date().getTime() - metadataStart) / 1000).toFixed(1);
    console.log(`[DRIVE] ✅ Saved metadata and package (${metadataTime}s)`);

    const totalTime = ((new Date().getTime() - startTime) / 1000).toFixed(1);
    console.log(`[DRIVE] ✅ Successfully saved all config files to folder (total: ${totalTime}s)`);

    // Add a small delay to ensure Drive operations are fully committed
    console.log("[DRIVE] Waiting for Drive sync...");
    Utilities.sleep(2000);

    return {
      url: rootFolder.getUrl(),
      id: folderId,
    };
  } catch (error) {
    console.error("[DRIVE] Error saving config files to Drive:", error);
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

/**
 * Cleans up (deletes) a Drive folder and all its contents.
 * Used for error recovery when config generation fails.
 *
 * @param folderId - The ID of the folder to delete
 */
function cleanupDriveFolder(folderId: string | null): void {
  if (!folderId) {
    console.log("[CLEANUP] No folder ID provided, skipping cleanup");
    return;
  }

  try {
    console.log("[CLEANUP] Attempting to delete folder with ID:", folderId);
    const folder = DriveApp.getFolderById(folderId);
    const folderName = folder.getName();

    // Move to trash instead of permanent delete
    folder.setTrashed(true);

    console.log(`[CLEANUP] ✅ Successfully trashed folder: ${folderName} (ID: ${folderId})`);
  } catch (error) {
    // Log error but don't throw - cleanup failure shouldn't block error handling
    console.error("[CLEANUP] ⚠️  Failed to cleanup folder:", error.message);
  }
}
