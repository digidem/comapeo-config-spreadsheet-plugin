function removeTranslationAndMetadataSheets(): void {
  const sheetsToRemove = [...sheets(true), "Metadata"];

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  sheetsToRemove.forEach((sheetName) => {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      spreadsheet.deleteSheet(sheet);
      console.log(`Removed sheet: ${sheetName}`);
    } else {
      console.log(`Sheet not found: ${sheetName}`);
    }
  });

  console.log("Finished removing translation sheets");
}

function deleteIcons(): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheet = spreadsheet.getSheetByName("Categories");

  if (!categoriesSheet) {
    console.log("Categories sheet not found");
    return;
  }

  const lastRow = categoriesSheet.getLastRow();
  if (lastRow <= 1) {
    console.log("Categories sheet is empty or contains only header");
    return;
  }

  // Delete column B content, excluding the header
  const range = categoriesSheet.getRange(2, 2, lastRow - 1, 1);
  range.clearContent();

  console.log(
    "Deleted content from column B in Categories sheet, excluding the header and non-empty cells",
  );
}

function cleanup(): void {
  removeTranslationAndMetadataSheets();
  deleteIcons();
}

/**
 * Cleans up temporary resources with robust error handling and retry logic
 * @param tempFolder - Temporary folder to clean up
 * @param options - Cleanup options
 * @returns Success status and any error messages
 */
function cleanupTempResources(
  tempFolder: GoogleAppsScript.Drive.Folder,
  options?: {
    maxRetries?: number;
    retryDelayMs?: number;
    forceDelete?: boolean;
    deleteChildrenFirst?: boolean;
  },
): { success: boolean; errors?: string[] } {
  // Default options
  const maxRetries = options?.maxRetries || 3;
  const retryDelayMs = options?.retryDelayMs || 1000;
  const forceDelete = options?.forceDelete || false;
  const deleteChildrenFirst = options?.deleteChildrenFirst || true;

  const errors: string[] = [];

  try {
    console.log(`Cleaning up temporary folder: ${tempFolder.getName()}`);

    // Check if folder exists and is accessible
    try {
      tempFolder.getName(); // This will throw if folder doesn't exist or is inaccessible
    } catch (error) {
      console.warn("Folder already deleted or inaccessible:", error);
      return { success: true }; // Consider this a success since the folder is gone
    }

    // Delete children first if requested
    if (deleteChildrenFirst) {
      try {
        console.log("Deleting child files first...");
        const files = tempFolder.getFiles();
        while (files.hasNext()) {
          const file = files.next();
          try {
            file.setTrashed(true);
            console.log(`Deleted file: ${file.getName()}`);
          } catch (fileError) {
            const errorMsg = `Failed to delete file ${file.getName()}: ${fileError}`;
            console.warn(errorMsg);
            errors.push(errorMsg);

            // If force delete is enabled, try to delete the file with retries
            if (forceDelete) {
              let retryCount = 0;
              while (retryCount < maxRetries) {
                try {
                  Utilities.sleep(retryDelayMs);
                  file.setTrashed(true);
                  console.log(
                    `Successfully deleted file ${file.getName()} on retry ${retryCount + 1}`,
                  );
                  break;
                } catch (retryError) {
                  retryCount++;
                  console.warn(
                    `Retry ${retryCount} failed for file ${file.getName()}: ${retryError}`,
                  );
                }
              }
            }
          }
        }

        // Delete subfolders
        console.log("Deleting subfolders...");
        const folders = tempFolder.getFolders();
        while (folders.hasNext()) {
          const subfolder = folders.next();
          try {
            // Recursively clean up subfolders
            const subfolderResult = cleanupTempResources(subfolder, options);
            if (!subfolderResult.success && subfolderResult.errors) {
              errors.push(...subfolderResult.errors);
            }
          } catch (folderError) {
            const errorMsg = `Failed to delete subfolder ${subfolder.getName()}: ${folderError}`;
            console.warn(errorMsg);
            errors.push(errorMsg);
          }
        }
      } catch (childrenError) {
        const errorMsg = `Error accessing folder children: ${childrenError}`;
        console.warn(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Delete the folder itself with retries
    let retryCount = 0;
    let folderDeleted = false;

    while (retryCount <= maxRetries && !folderDeleted) {
      try {
        if (retryCount > 0) {
          console.log(`Retrying folder deletion (attempt ${retryCount})...`);
          Utilities.sleep(retryDelayMs * retryCount); // Exponential backoff
        }

        tempFolder.setTrashed(true);
        folderDeleted = true;
        console.log(`Successfully deleted folder: ${tempFolder.getName()}`);
      } catch (error) {
        retryCount++;
        const errorMsg = `Failed to delete folder on attempt ${retryCount}: ${error}`;
        console.warn(errorMsg);

        if (retryCount > maxRetries) {
          errors.push(errorMsg);
        }
      }
    }

    // Return success status
    return {
      success: folderDeleted || errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    const errorMsg = `Unexpected error during cleanup: ${error}`;
    console.error(errorMsg);
    errors.push(errorMsg);

    return {
      success: false,
      errors,
    };
  }
}
