/**
 * File extraction functions for the import category functionality.
 * This file contains functions related to extracting files from a tar archive.
 */

/**
 * Creates an SVG sprite from an array of icon objects.
 * @param icons - Array of icon objects with name and svg properties
 * @returns SVG sprite string
 */
function createIconSprite(icons: any[]): string {
  console.log(`Creating SVG sprite from ${icons.length} icons`);

  // Start with SVG root element
  let sprite = '<svg xmlns="http://www.w3.org/2000/svg">\n';

  for (const icon of icons) {
    if (!icon.name || !icon.svg) {
      console.warn(`Skipping icon without name or svg:`, icon);
      continue;
    }

    // Extract SVG content (remove wrapping <svg> tags if present)
    let svgContent = icon.svg;

    // Try to extract content between <svg> tags
    const svgMatch = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    if (svgMatch) {
      svgContent = svgMatch[1];
    }

    // Create symbol element with icon content
    sprite += `  <symbol id="${icon.name}">\n`;
    sprite += `    ${svgContent.trim()}\n`;
    sprite += `  </symbol>\n`;
  }

  sprite += "</svg>";

  console.log(`Created sprite with ${icons.length} symbols`);
  return sprite;
}

/**
 * Maximum file size for imports (100MB)
 */
const MAX_IMPORT_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Validates a file path to prevent path traversal attacks
 *
 * @param path - The file path to validate
 * @returns true if valid, throws error if invalid
 * @throws Error if path contains path traversal sequences
 */
function validateFilePath(path: string): boolean {
  // Check for path traversal attempts
  if (path.includes("../") || path.includes("..\\")) {
    throw new Error(`Invalid file path detected (path traversal attempt): ${path}`);
  }

  // Check for absolute paths (Unix and Windows)
  if (path.startsWith("/") || /^[A-Za-z]:/.test(path)) {
    throw new Error(`Invalid file path detected (absolute path): ${path}`);
  }

  return true;
}

/**
 * Extracts a tar file and returns the extracted files.
 * @param blob - The tar file blob
 * @returns Extraction result with files and temp folder
 */
function extractTarFile(blob: GoogleAppsScript.Base.Blob): {
  success: boolean;
  message?: string;
  files?: GoogleAppsScript.Base.Blob[];
  tempFolder?: GoogleAppsScript.Drive.Folder;
} {
  try {
    console.log("Extracting tar file...");

    // Validate file size to prevent memory exhaustion
    const fileSize = blob.getBytes().length;
    console.log(`File size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

    if (fileSize > MAX_IMPORT_FILE_SIZE) {
      const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
      const maxSizeMB = (MAX_IMPORT_FILE_SIZE / 1024 / 1024).toFixed(0);
      const errorMessage = `File too large: ${fileSizeMB} MB (maximum: ${maxSizeMB} MB)`;
      console.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }

    // Create a temporary folder to extract files
    const tempFolder = DriveApp.createFolder(
      "temp_import_" + new Date().getTime(),
    );
    console.log(`Created temporary folder: ${tempFolder.getName()}`);

    // Save the tar file to the temporary folder
    const tarFile = tempFolder.createFile(blob);
    console.log(`Saved tar file: ${tarFile.getName()}`);

    // Extract the file based on its extension
    let extractedFiles: GoogleAppsScript.Base.Blob[] = [];
    const fileName = tarFile.getName().toLowerCase();

    try {
      if (fileName.endsWith(".zip") || fileName.endsWith(".comapeocat")) {
        // Use unzip for ZIP files
        extractedFiles = Utilities.unzip(tarFile);
        console.log(`Extracted ${extractedFiles.length} files using unzip`);

        // Validate all extracted file paths for security
        for (const file of extractedFiles) {
          const extractedFileName = file.getName();
          try {
            validateFilePath(extractedFileName);
          } catch (pathError) {
            console.error(`Path validation failed: ${pathError.message}`);
            // Clean up temp folder
            tempFolder.setTrashed(true);
            return {
              success: false,
              message: `Security error: ${pathError.message}`,
            };
          }
        }
      } else if (
        fileName.endsWith(".mapeosettings") ||
        fileName.endsWith(".tar")
      ) {
        // For .mapeosettings files, we need to handle them differently
        console.log("Processing .mapeosettings or .tar file");

        // Try to parse as JSON first (some .mapeosettings files are just JSON)
        try {
          console.log("Attempting to parse as JSON...");
          const fileContent = tarFile.getBlob().getDataAsString();
          const jsonData = JSON.parse(fileContent);
          console.log("Successfully parsed as JSON");

          // If we got here, it's valid JSON
          const extractFolder = tempFolder.createFolder("extracted_content");

          // Create metadata.json
          if (jsonData.metadata) {
            console.log("Creating metadata.json...");
            const metadataBlob = Utilities.newBlob(
              JSON.stringify(jsonData.metadata, null, 2),
              "application/json",
              "metadata.json",
            );
            extractFolder.createFile(metadataBlob);
            extractedFiles.push(metadataBlob);
          }

          // Create presets.json
          if (jsonData.presets) {
            console.log("Creating presets.json...");
            const presetsBlob = Utilities.newBlob(
              JSON.stringify({ presets: jsonData.presets }, null, 2),
              "application/json",
              "presets.json",
            );
            extractFolder.createFile(presetsBlob);
            extractedFiles.push(presetsBlob);
          }

          // Create translations.json
          if (jsonData.translations) {
            console.log("Creating translations.json...");
            const translationsBlob = Utilities.newBlob(
              JSON.stringify(jsonData.translations, null, 2),
              "application/json",
              "translations.json",
            );
            extractFolder.createFile(translationsBlob);
            extractedFiles.push(translationsBlob);
          }

          // Handle icons.svg if present
          if (jsonData.icons) {
            console.log("Creating icons.svg from embedded data...");
            try {
              // Icons might be embedded as SVG string or base64
              let iconsSvgContent = "";

              if (typeof jsonData.icons === "string") {
                // Direct SVG string
                iconsSvgContent = jsonData.icons;
              } else if (jsonData.icons.svg) {
                // SVG in an object
                iconsSvgContent = jsonData.icons.svg;
              } else if (Array.isArray(jsonData.icons)) {
                // Array of icon objects - need to create sprite
                console.log(
                  `Found ${jsonData.icons.length} icon objects, creating sprite...`,
                );
                iconsSvgContent = createIconSprite(jsonData.icons);
              }

              if (iconsSvgContent) {
                const iconsSvgBlob = Utilities.newBlob(
                  iconsSvgContent,
                  "image/svg+xml",
                  "icons.svg",
                );
                extractFolder.createFile(iconsSvgBlob);
                extractedFiles.push(iconsSvgBlob);
                console.log("Successfully created icons.svg");
              } else {
                console.warn("Icons data found but could not be converted to SVG");
              }
            } catch (iconError) {
              console.error("Error processing embedded icons:", iconError);
            }
          } else {
            console.warn("No icons data found in .mapeosettings JSON");
          }

          console.log("JSON extraction completed successfully");
        } catch (jsonError) {
          // Not a JSON file, must be an actual tar file
          console.warn(
            "Not a JSON file, attempting to extract as tar:",
            jsonError,
          );

          // TAR file format constants
          const HEADER_SIZE = 512;
          const BLOCK_SIZE = 512;
          const NAME_OFFSET = 0;
          const NAME_LENGTH = 100;
          const SIZE_OFFSET = 124;
          const SIZE_LENGTH = 12;
          const TYPE_FLAG_OFFSET = 156;
          const MAGIC_OFFSET = 257;
          const MAGIC_LENGTH = 6;

          // Get the raw bytes of the tar file
          const bytes = tarFile.getBlob().getBytes();
          console.log(`TAR file size: ${bytes.length} bytes`);

          // Create a folder to store the extracted content
          const extractFolder = tempFolder.createFolder("extracted_content");

          // Process the tar file
          let position = 0;
          let fileCount = 0;
          const processedFiles = new Set<string>();

          while (position + HEADER_SIZE <= bytes.length) {
            // Read header block
            const headerBlock = bytes.slice(position, position + HEADER_SIZE);

            // Check for end of archive (empty block)
            let isEmpty = true;
            for (let i = 0; i < HEADER_SIZE; i++) {
              if (headerBlock[i] !== 0) {
                isEmpty = false;
                break;
              }
            }

            if (isEmpty) {
              console.log("Reached end of archive (empty block)");
              break;
            }

            // Check magic number "ustar"
            const magicBytes = headerBlock.slice(
              MAGIC_OFFSET,
              MAGIC_OFFSET + MAGIC_LENGTH,
            );
            const magic = String.fromCharCode.apply(null, magicBytes);

            if (magic.indexOf("ustar") !== 0) {
              console.warn(
                `Invalid magic number at position ${position}, skipping block`,
              );
              position += BLOCK_SIZE;
              continue;
            }

            // Extract file name (null-terminated C string)
            const nameBytes = headerBlock.slice(
              NAME_OFFSET,
              NAME_OFFSET + NAME_LENGTH,
            );
            let fileName = "";
            for (let i = 0; i < nameBytes.length; i++) {
              if (nameBytes[i] === 0) break;
              fileName += String.fromCharCode(nameBytes[i]);
            }

            // Skip if we've already processed this file (avoid duplicates)
            if (processedFiles.has(fileName)) {
              console.log(`Skipping duplicate file: ${fileName}`);
              position += BLOCK_SIZE;
              continue;
            }

            // Extract file size (octal string)
            const sizeBytes = headerBlock.slice(
              SIZE_OFFSET,
              SIZE_OFFSET + SIZE_LENGTH,
            );
            let sizeStr = "";
            for (let i = 0; i < sizeBytes.length; i++) {
              if (sizeBytes[i] === 0) break;
              sizeStr += String.fromCharCode(sizeBytes[i]);
            }

            // Parse size as octal
            const fileSize = parseInt(sizeStr.trim(), 8);

            // Get type flag (0 or '0' = regular file, 5 = directory)
            const typeFlag = headerBlock[TYPE_FLAG_OFFSET];
            const isDirectory = typeFlag === 53; // ASCII '5'

            console.log(
              `Found ${isDirectory ? "directory" : "file"}: ${fileName}, size: ${fileSize}`,
            );

            // Only process metadata.json, presets.json, translations.json, and icons.svg
            const isTargetFile =
              fileName === "metadata.json" ||
              fileName === "presets.json" ||
              fileName === "translations.json" ||
              fileName === "icons.svg";

            if (!isDirectory && isTargetFile) {
              // Extract file data
              const fileData = bytes.slice(
                position + HEADER_SIZE,
                position + HEADER_SIZE + fileSize,
              );

              // Create file blob
              const fileBlob = Utilities.newBlob(
                fileData,
                "application/json",
                fileName,
              );

              // Save file to temp folder
              extractFolder.createFile(fileBlob);
              extractedFiles.push(fileBlob);
            }

            // Calculate how many blocks to skip
            const dataBlocks = Math.ceil(fileSize / BLOCK_SIZE);
            const dataSize = dataBlocks * BLOCK_SIZE;
            position += HEADER_SIZE + dataSize;

            // Mark file as processed
            processedFiles.add(fileName);
            fileCount++;
          }

          console.log(`Processed ${fileCount} files from tar archive`);

          // Get all files from the extraction folder
          const files = extractFolder.getFiles();
          while (files.hasNext()) {
            const file = files.next();
            if (
              !extractedFiles.some((blob) => blob.getName() === file.getName())
            ) {
              extractedFiles.push(file.getBlob());
            }
          }
        }
      } else {
        throw new Error(`Unsupported file format: ${fileName}`);
      }
    } catch (e) {
      console.log(`Extraction failed for ${fileName}`);
      console.error("Extraction error details:", e);

      // Instead of throwing, return a failure result
      return {
        success: false,
        message: `Unable to extract the file ${fileName}: ${e.message}`,
        files: [],
        tempFolder: tempFolder,
      };
    }

    // Delete the original tar file
    tarFile.setTrashed(true);

    return {
      success: true,
      files: extractedFiles,
      tempFolder: tempFolder,
    };
  } catch (error) {
    console.error("Error extracting tar file:", error);
    return {
      success: false,
      message:
        "Failed to extract tar file: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}
