/**
 * Functions for extracting and processing PNG icon files from the icons/ directory
 */

/**
 * Extracts PNG icons from the temp folder and copies them to permanent storage
 * @param tempFolder - The temporary folder containing extracted files
 * @param presets - Array of preset objects that reference icon names
 * @param onProgress - Optional progress callback function
 * @returns An array of icon objects with name, URL, and ID
 */
function extractPngIcons(
  tempFolder: GoogleAppsScript.Drive.Folder,
  presets: any[],
  onProgress?: (update: { percent: number; stage: string; detail?: string }) => void,
): { name: string; svg: string; id: string }[] {
  try {
    console.log("Extracting PNG icons from temp folder");

    // Get permanent config folder for icon storage
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const parentFolder = DriveApp.getFileById(spreadsheet.getId())
      .getParents()
      .next();
    const configFolderName = slugify(spreadsheet.getName());

    console.log(`Looking for config folder: ${configFolderName}`);

    // Find or create config folder
    let configFolder: GoogleAppsScript.Drive.Folder;
    const configFolders = parentFolder.getFoldersByName(configFolderName);
    if (configFolders.hasNext()) {
      configFolder = configFolders.next();
      console.log(`Using existing config folder: ${configFolder.getName()}`);
    } else {
      configFolder = parentFolder.createFolder(configFolderName);
      console.log(`Created new config folder: ${configFolder.getName()}`);
    }

    // Find or create permanent icons folder
    let permanentIconsFolder: GoogleAppsScript.Drive.Folder;
    const iconsFolders = configFolder.getFoldersByName("icons");
    if (iconsFolders.hasNext()) {
      permanentIconsFolder = iconsFolders.next();
      console.log(
        `Using existing icons folder: ${permanentIconsFolder.getName()}`,
      );
    } else {
      permanentIconsFolder = configFolder.createFolder("icons");
      console.log(`Created new icons folder: ${permanentIconsFolder.getName()}`);
    }

    // Look for icons/ subdirectory in temp folder
    const tempIconsFolders = tempFolder.getFoldersByName("icons");
    if (!tempIconsFolders.hasNext()) {
      console.log("No icons/ directory found in temp folder");
      return [];
    }

    const tempIconsFolder = tempIconsFolders.next();
    console.log(`Found icons folder in temp: ${tempIconsFolder.getName()}`);

    // Extract icon names from presets
    const iconNames = new Set<string>();
    presets.forEach((preset) => {
      if (preset.icon) {
        iconNames.add(preset.icon);
      }
    });

    console.log(`Looking for ${iconNames.size} icon(s): ${Array.from(iconNames).join(", ")}`);

    // Build a file index for O(1) lookup instead of O(n) getFilesByName() calls
    console.log("Indexing icon files for fast lookup...");
    if (onProgress) {
      onProgress({
        percent: 40,
        stage: "Extracting icons",
        detail: `Indexing ${tempIconsFolder.getName()} files for fast lookup...`,
      });
    }

    const availableFiles = new Map<string, GoogleAppsScript.Drive.File>();
    const fileIterator = tempIconsFolder.getFiles();
    let totalFiles = 0;

    while (fileIterator.hasNext()) {
      const file = fileIterator.next();
      availableFiles.set(file.getName(), file);
      totalFiles++;
    }

    console.log(`Indexed ${totalFiles} files. Starting icon extraction...`);
    if (onProgress) {
      onProgress({
        percent: 45,
        stage: "Extracting icons",
        detail: `Indexed ${totalFiles} files. Starting extraction...`,
      });
    }

    // Size and resolution priority order (preferred sizes first)
    const sizePriority = ["medium", "small", "large"];
    const resolutionPriority = ["1x", "2x", "3x"];

    const iconObjects: { name: string; svg: string; id: string }[] = [];

    // Process each icon with progress tracking
    let processed = 0;
    const total = iconNames.size;

    iconNames.forEach((iconName) => {
      processed++;

      // Calculate progress percentage (45% to 70% range for icon extraction)
      const iconPercent = Math.round(45 + ((processed / total) * 25));

      // Log progress every 5 icons to show we're making progress
      if (processed % 5 === 0 || processed === total) {
        console.log(
          `Extracting icons: ${processed}/${total} (${Math.round((processed / total) * 100)}%)`,
        );
        if (onProgress) {
          onProgress({
            percent: iconPercent,
            stage: "Extracting icons",
            detail: `${processed}/${total} icons extracted`,
          });
        }
      }

      let foundFile: GoogleAppsScript.Drive.File | null = null;
      let foundPattern = "";

      // Try each size/resolution using fast Map lookup
      for (const size of sizePriority) {
        for (const resolution of resolutionPriority) {
          const fileName = `${iconName}-${size}@${resolution}.png`;

          if (availableFiles.has(fileName)) {
            foundFile = availableFiles.get(fileName)!;
            foundPattern = fileName;
            break; // Found, stop searching
          }
        }

        if (foundFile) {
          break; // Found, stop searching sizes
        }
      }

      if (!foundFile) {
        console.warn(`No PNG file found for icon: ${iconName}`);
        return; // Skip this icon
      }

      // Copy to permanent folder
      try {
        const fileName = `${iconName}.png`;
        const existingFiles = permanentIconsFolder.getFilesByName(fileName);
        let permanentFile: GoogleAppsScript.Drive.File;

        if (existingFiles.hasNext()) {
          permanentFile = existingFiles.next();
          permanentFile.setContent(foundFile.getBlob());
        } else {
          const blob = foundFile.getBlob().setName(fileName);
          permanentFile = permanentIconsFolder.createFile(blob);
        }

        iconObjects.push({
          name: iconName,
          svg: permanentFile.getUrl(),
          id: iconName,
        });
      } catch (error) {
        console.error(`Error copying icon ${iconName}:`, error);
      }
    });

    console.log(
      `Successfully extracted ${iconObjects.length} PNG icon(s) to permanent folder`,
    );
    return iconObjects;
  } catch (error) {
    console.error("Error extracting PNG icons:", error);
    return [];
  }
}

/**
 * Helper function to check if icons/ directory exists in temp folder
 * @param tempFolder - The temporary folder to check
 * @returns True if icons/ directory exists, false otherwise
 */
function hasPngIconsDirectory(
  tempFolder: GoogleAppsScript.Drive.Folder,
): boolean {
  try {
    const iconsFolders = tempFolder.getFoldersByName("icons");
    return iconsFolders.hasNext();
  } catch (error) {
    console.error("Error checking for PNG icons directory:", error);
    return false;
  }
}
