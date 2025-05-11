/**
 * Validates if a byte array represents a valid ZIP file by checking its signature.
 * ZIP files start with the bytes: 0x50 0x4B 0x03 0x04 (PK\x03\x04)
 *
 * @param bytes - Byte array to check
 * @returns true if the file appears to be a valid ZIP file, false otherwise
 */
function validateZipFile(bytes: number[]): boolean {
  // Check if the array has at least 4 bytes (minimum for ZIP signature)
  if (!bytes || bytes.length < 4) {
    return false;
  }

  // Check for ZIP file signature (PK\x03\x04)
  return (
    bytes[0] === 0x50 && // P
    bytes[1] === 0x4b && // K
    bytes[2] === 0x03 && // \x03
    bytes[3] === 0x04
  ); // \x04
}

/**
 * Sends data to the API and gets a zip file in return.
 * Includes validation and retry logic to handle common failures.
 *
 * @param zipFile - The zip file to send to the API
 * @param metadata - Metadata about the configuration
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns URL to the saved zip file
 */
function sendDataToApiAndGetZip(
  zipFile: GoogleAppsScript.Base.Blob,
  metadata: { name: string; version: string },
  maxRetries: number = 3,
): string {
  const fileName = metadata.name + "-" + metadata.version + ".comapeocat";
  const apiUrl = "http://137.184.153.36:3000/";
  const minValidFileSize = 10 * 1024; // 10KB - files smaller than this are likely errors
  let retryCount = 0;
  let lastError = null;

  while (retryCount <= maxRetries) {
    try {
      // If this is a retry, show a dialog to the user
      if (retryCount > 0) {
        const ui = SpreadsheetApp.getUi();
        ui.alert(
          "Retrying API Request",
          "Attempt " +
            retryCount +
            " of " +
            maxRetries +
            ". Previous attempt failed: " +
            (lastError ? lastError.message : "Unknown error"),
          ui.ButtonSet.OK,
        );
      }

      console.log(
        "Posting zip to API URL (attempt " + (retryCount + 1) + "):",
        apiUrl,
      );
      const form = {
        file: zipFile,
      };

      console.log("Setting up request options");
      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: "post",
        payload: form,
        muteHttpExceptions: true,
      };

      console.log("Sending request to API");
      const response = UrlFetchApp.fetch(apiUrl, options);
      const responseCode = response.getResponseCode();
      console.log("Response code:", responseCode);

      if (responseCode === 200) {
        const responseBlob = response.getBlob();
        const blobSize = responseBlob.getBytes().length;
        console.log("Response size:", blobSize, "bytes");

        // Check if the response is too small (likely an error)
        if (blobSize < minValidFileSize) {
          lastError = new Error(
            `API returned a file that is too small (${blobSize} bytes). This is likely an error response.`,
          );
          console.error(lastError.message);
          retryCount++;
          // Wait before retrying (exponential backoff)
          Utilities.sleep(1000 * Math.pow(2, retryCount));
          continue;
        }

        // Validate that the response is a valid zip file
        try {
          // Check if the response is a valid zip file by examining the file signature
          const bytes = responseBlob.getBytes();
          const isValidZip = validateZipFile(bytes);

          if (!isValidZip) {
            lastError = new Error(
              `API returned an invalid zip file. The file does not have a valid zip signature.`,
            );
            console.error(lastError.message);
            retryCount++;
            // Wait before retrying
            Utilities.sleep(1000 * Math.pow(2, retryCount));
            continue;
          }

          // Set the name and save to Drive
          const zipBlob = responseBlob.setName(fileName || "config.comapeocat");
          return saveZipToDrive(zipBlob, metadata.version);
        } catch (saveError) {
          lastError = new Error(
            `Failed to save the file: ${saveError.message}`,
          );
          console.error(lastError.message);
          retryCount++;
          // Wait before retrying
          Utilities.sleep(1000 * Math.pow(2, retryCount));
          continue;
        }
      } else {
        // Non-200 response code
        lastError = new Error(
          `API request failed with status ${responseCode}: ${response.getContentText()}`,
        );
        console.error(lastError.message);
        retryCount++;
        // Wait before retrying
        Utilities.sleep(1000 * Math.pow(2, retryCount));
        continue;
      }
    } catch (error) {
      lastError = error;
      console.error(
        "Error in API request (attempt " + (retryCount + 1) + "):",
        error,
      );
      retryCount++;
      // Wait before retrying
      Utilities.sleep(1000 * Math.pow(2, retryCount));
    }
  }

  // If we've exhausted all retries, show an error dialog and throw
  const ui = SpreadsheetApp.getUi();
  const errorMessage = `Failed to generate the CoMapeo category file after ${maxRetries} attempts.
Last error: ${lastError ? lastError.message : "Unknown error"}.

Please check your internet connection and try again. If the problem persists,
contact support with the following information:
- Error message: ${lastError ? lastError.message : "Unknown error"}
- Timestamp: ${new Date().toISOString()}`;

  ui.alert("Error Generating CoMapeo Category", errorMessage, ui.ButtonSet.OK);

  throw new Error(
    `Failed to generate CoMapeo category after ${maxRetries} attempts: ${lastError ? lastError.message : "Unknown error"}`,
  );
}
