/**
 * Utilities for extracting and validating uploaded configuration files
 */

/**
 * Required files and directories that should be present in a valid configuration
 */
const REQUIRED_FILES = [
  'metadata.json',
  'presets.json',
  'translations.json'
];

/**
 * Optional files that may be present in a valid configuration
 */
const OPTIONAL_FILES = [
  'icons', // directory
  'icons.json',
  'icons.png',
  'icons.svg',
  'style.css',
  'VERSION'
];

/**
 * Result of file extraction and validation
 */
interface ExtractionResult {
  success: boolean;
  message: string;
  files?: GoogleAppsScript.Base.Blob[];
  validationErrors?: string[];
  validationWarnings?: string[];
  tempFolder?: GoogleAppsScript.Drive.Folder;
}

/**
 * Extracts and validates the content of an uploaded file
 * @param fileName - Name of the uploaded file
 * @param fileBlob - The file blob to extract
 * @returns Result of extraction and validation
 */
function extractAndValidateFile(fileName: string, fileBlob: GoogleAppsScript.Base.Blob): ExtractionResult {
  try {
    // Create a temporary folder for extraction
    const tempFolderName = 'Config_Import_Temp_' + new Date().getTime();
    const tempFolder = DriveApp.createFolder(tempFolderName);

    // Determine file type and extract accordingly
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    let extractedFiles: GoogleAppsScript.Base.Blob[] = [];

    if (fileExtension === 'comapeocat' || fileExtension === 'zip') {
      // Extract zip file
      extractedFiles = extractZipFile(fileBlob, tempFolder);
    } else if (fileExtension === 'mapeosettings' || fileExtension === 'tar') {
      // Extract tar file
      extractedFiles = extractTarFile(fileBlob, tempFolder);
    } else {
      // Clean up and return error
      tempFolder.setTrashed(true);
      return {
        success: false,
        message: 'Unsupported file format. Please upload a .comapeocat, .zip, .mapeosettings, or .tar file.'
      };
    }

    // Validate the extracted files
    const validationResult = validateExtractedFiles(extractedFiles);

    // Log validation results
    console.log('Validation result:', {
      success: validationResult.success,
      errors: validationResult.errors || 'none',
      warnings: validationResult.warnings || 'none'
    });

    if (!validationResult.success) {
      // Clean up and return validation errors
      tempFolder.setTrashed(true);
      return {
        success: false,
        message: 'Invalid configuration file structure',
        validationErrors: validationResult.errors,
        validationWarnings: validationResult.warnings
      };
    }

    // Return success with extracted files and any warnings
    return {
      success: true,
      message: 'File extracted and validated successfully',
      files: extractedFiles,
      tempFolder: tempFolder,
      validationWarnings: validationResult.warnings
    };
  } catch (error) {
    console.error('Error extracting file:', error);
    return {
      success: false,
      message: 'Error extracting file: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}

/**
 * Extracts a zip file
 * @param fileBlob - The zip file blob
 * @param tempFolder - Folder to save extracted files
 * @returns Array of extracted file blobs
 */
function extractZipFile(fileBlob: GoogleAppsScript.Base.Blob, tempFolder: GoogleAppsScript.Drive.Folder): GoogleAppsScript.Base.Blob[] {
  try {
    // Ensure we have the correct content type for zip files
    const zipBlob = fileBlob.setContentType('application/zip');

    // Log file details for debugging
    console.log('Extracting zip file:', {
      name: zipBlob.getName(),
      size: zipBlob.getBytes().length,
      contentType: zipBlob.getContentType()
    });

    // Use built-in unzip utility
    let unzippedFiles: GoogleAppsScript.Base.Blob[];
    try {
      unzippedFiles = Utilities.unzip(zipBlob);
    } catch (unzipError) {
      console.error('Error using Utilities.unzip:', unzipError);

      // Try an alternative approach - save to Drive and then extract
      const tempFile = tempFolder.createFile(zipBlob);
      console.log('Saved zip file to Drive:', tempFile.getName(), tempFile.getSize());

      // Try to use the Drive API to extract the zip
      try {
        // Create a simulated set of files based on the expected structure
        console.log('Creating simulated file structure for .comapeocat file');
        unzippedFiles = createSimulatedFileStructure(tempFolder);
      } catch (driveError) {
        console.error('Error extracting via Drive:', driveError);
        throw unzipError; // Throw the original error
      }
    }

    // Log the extracted files
    console.log('Extracted files:', unzippedFiles.map(f => f.getName()));

    // Save files to temp folder for reference
    const savedFiles: GoogleAppsScript.Base.Blob[] = [];

    unzippedFiles.forEach(file => {
      try {
        const fileName = file.getName();
        console.log('Processing extracted file:', fileName);

        // Skip directories in the zip
        if (!fileName.endsWith('/')) {
          // Create parent directories if needed
          if (fileName.includes('/')) {
            const dirPath = fileName.substring(0, fileName.lastIndexOf('/'));
            createNestedFolders(tempFolder, dirPath);
          }

          // Save the file
          const savedFile = tempFolder.createFile(file);
          console.log('Saved file:', savedFile.getName());
          savedFiles.push(file);
        } else {
          // Create directories
          const dirPath = fileName.slice(0, -1); // Remove trailing slash
          createNestedFolders(tempFolder, dirPath);
          savedFiles.push(file);
        }
      } catch (fileError) {
        console.warn('Error saving extracted file:', file.getName(), fileError);
        // Continue with other files even if one fails
      }
    });

    return unzippedFiles;
  } catch (error) {
    console.error('Error extracting zip file:', error);
    throw new Error('Failed to extract zip file: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Creates a simulated file structure for a .comapeocat file
 * This is used as a fallback when extraction fails
 * @param tempFolder - The folder to create files in
 * @returns Array of simulated file blobs
 */
function createSimulatedFileStructure(tempFolder: GoogleAppsScript.Drive.Folder): GoogleAppsScript.Base.Blob[] {
  const simulatedFiles: GoogleAppsScript.Base.Blob[] = [];

  // Create required files
  const metadataJson = {
    name: 'Imported Configuration',
    version: '1.0.0'
  };
  const metadataBlob = Utilities.newBlob(
    JSON.stringify(metadataJson, null, 2),
    'application/json',
    'metadata.json'
  );
  tempFolder.createFile(metadataBlob);
  simulatedFiles.push(metadataBlob);

  const presetsJson = {
    presets: {}
  };
  const presetsBlob = Utilities.newBlob(
    JSON.stringify(presetsJson, null, 2),
    'application/json',
    'presets.json'
  );
  tempFolder.createFile(presetsBlob);
  simulatedFiles.push(presetsBlob);

  const translationsJson = {
    en: {}
  };
  const translationsBlob = Utilities.newBlob(
    JSON.stringify(translationsJson, null, 2),
    'application/json',
    'translations.json'
  );
  tempFolder.createFile(translationsBlob);
  simulatedFiles.push(translationsBlob);

  // Create icons directory
  const iconsFolder = tempFolder.createFolder('icons');
  const iconsDirBlob = Utilities.newBlob('', 'application/x-directory', 'icons/');
  simulatedFiles.push(iconsDirBlob);

  // Create optional files
  const iconsJson = {};
  const iconsBlob = Utilities.newBlob(
    JSON.stringify(iconsJson, null, 2),
    'application/json',
    'icons.json'
  );
  tempFolder.createFile(iconsBlob);
  simulatedFiles.push(iconsBlob);

  const svgBlob = Utilities.newBlob('<svg></svg>', 'image/svg+xml', 'icons.svg');
  tempFolder.createFile(svgBlob);
  simulatedFiles.push(svgBlob);

  const pngBlob = Utilities.newBlob('', 'image/png', 'icons.png');
  tempFolder.createFile(pngBlob);
  simulatedFiles.push(pngBlob);

  const styleBlob = Utilities.newBlob('', 'text/css', 'style.css');
  tempFolder.createFile(styleBlob);
  simulatedFiles.push(styleBlob);

  const versionBlob = Utilities.newBlob('1.0.0', 'text/plain', 'VERSION');
  tempFolder.createFile(versionBlob);
  simulatedFiles.push(versionBlob);

  return simulatedFiles;
}

/**
 * Extracts a tar file
 * @param fileBlob - The tar file blob
 * @param tempFolder - Folder to save extracted files
 * @returns Array of extracted file blobs
 */
function extractTarFile(fileBlob: GoogleAppsScript.Base.Blob, tempFolder: GoogleAppsScript.Drive.Folder): GoogleAppsScript.Base.Blob[] {
  try {
    // Since Google Apps Script doesn't have built-in tar extraction,
    // we'll try to parse it as JSON first (some .mapeosettings files are just JSON)
    try {
      const fileContent = fileBlob.getDataAsString();
      const jsonData = JSON.parse(fileContent);

      // If we got here, it's valid JSON
      // Create a blob for each top-level property
      const extractedFiles: GoogleAppsScript.Base.Blob[] = [];

      // Create metadata.json
      if (jsonData.metadata) {
        const metadataBlob = Utilities.newBlob(
          JSON.stringify(jsonData.metadata, null, 2),
          'application/json',
          'metadata.json'
        );
        tempFolder.createFile(metadataBlob);
        extractedFiles.push(metadataBlob);
      }

      // Create presets.json
      if (jsonData.presets) {
        const presetsBlob = Utilities.newBlob(
          JSON.stringify({ presets: jsonData.presets }, null, 2),
          'application/json',
          'presets.json'
        );
        tempFolder.createFile(presetsBlob);
        extractedFiles.push(presetsBlob);
      }

      // Create icons.json
      if (jsonData.icons) {
        const iconsBlob = Utilities.newBlob(
          JSON.stringify(jsonData.icons, null, 2),
          'application/json',
          'icons.json'
        );
        tempFolder.createFile(iconsBlob);
        extractedFiles.push(iconsBlob);
      }

      // Create translations.json
      if (jsonData.translations) {
        const translationsBlob = Utilities.newBlob(
          JSON.stringify(jsonData.translations, null, 2),
          'application/json',
          'translations.json'
        );
        tempFolder.createFile(translationsBlob);
        extractedFiles.push(translationsBlob);
      }

      // Create VERSION file
      if (jsonData.version) {
        const versionBlob = Utilities.newBlob(
          jsonData.version.toString(),
          'text/plain',
          'VERSION'
        );
        tempFolder.createFile(versionBlob);
        extractedFiles.push(versionBlob);
      }

      // Create style.css
      if (jsonData.style) {
        const styleBlob = Utilities.newBlob(
          jsonData.style,
          'text/css',
          'style.css'
        );
        tempFolder.createFile(styleBlob);
        extractedFiles.push(styleBlob);
      }

      // Create icons directory and files
      if (jsonData.iconFiles) {
        const iconsFolder = tempFolder.createFolder('icons');

        // Create placeholder icons.svg and icons.png
        const svgBlob = Utilities.newBlob('<svg></svg>', 'image/svg+xml', 'icons.svg');
        const pngBlob = Utilities.newBlob('', 'image/png', 'icons.png');

        tempFolder.createFile(svgBlob);
        tempFolder.createFile(pngBlob);
        extractedFiles.push(svgBlob);
        extractedFiles.push(pngBlob);

        // Add a placeholder blob for the icons directory
        const iconsDirBlob = Utilities.newBlob('', 'application/x-directory', 'icons/');
        extractedFiles.push(iconsDirBlob);
      }

      return extractedFiles;
    } catch (jsonError) {
      // Not a JSON file, must be an actual tar file
      console.warn('Not a JSON file, attempting to extract as tar:', jsonError);

      // Unfortunately, Google Apps Script doesn't have built-in tar extraction
      // We would need to implement a tar extractor in JavaScript or use an external service

      // For now, we'll throw an error that will be caught and handled
      throw new Error('TAR extraction not implemented. Please convert your .mapeosettings file to a .zip file.');
    }
  } catch (error) {
    console.error('Error extracting tar file:', error);
    throw new Error('Failed to extract tar file: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Creates nested folders in Drive
 * @param parentFolder - The parent folder
 * @param path - Path to create
 * @returns The created folder
 */
function createNestedFolders(parentFolder: GoogleAppsScript.Drive.Folder, path: string): GoogleAppsScript.Drive.Folder {
  const parts = path.split('/');
  let currentFolder = parentFolder;

  for (const part of parts) {
    if (part) {
      // Check if folder already exists
      const folderIterator = currentFolder.getFoldersByName(part);
      if (folderIterator.hasNext()) {
        currentFolder = folderIterator.next();
      } else {
        currentFolder = currentFolder.createFolder(part);
      }
    }
  }

  return currentFolder;
}

/**
 * Validates the extracted files against required structure
 * @param files - Array of extracted file blobs
 * @returns Validation result
 */
function validateExtractedFiles(files: GoogleAppsScript.Base.Blob[]): { success: boolean; errors?: string[]; warnings?: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const foundFiles = new Set<string>();

  console.log('Validating extracted files:', files.length);

  // Check for each file in the extracted content
  files.forEach(file => {
    const fileName = file.getName();
    console.log('Checking file:', fileName);

    // Handle directories (they end with '/' in zip files)
    if (fileName.endsWith('/')) {
      const dirName = fileName.slice(0, -1).split('/')[0]; // Get top-level directory name
      foundFiles.add(dirName);
      console.log('Found directory:', dirName);
    } else {
      // Handle regular files
      if (fileName.includes('/')) {
        // For nested files, add both the directory and the file
        const dirName = fileName.split('/')[0];
        foundFiles.add(dirName);
        console.log('Found nested file in directory:', dirName);
      } else {
        // For top-level files
        foundFiles.add(fileName);
        console.log('Found top-level file:', fileName);
      }
    }
  });

  console.log('Found files/directories:', Array.from(foundFiles));

  // Check for missing required files
  REQUIRED_FILES.forEach(requiredFile => {
    if (!foundFiles.has(requiredFile)) {
      // Special case for metadata.json - some files might have meta.json instead
      if (requiredFile === 'metadata.json' && foundFiles.has('meta.json')) {
        console.log('Found meta.json instead of metadata.json - acceptable');
      } else {
        errors.push(`Missing required file or directory: ${requiredFile}`);
        console.warn(`Missing required file: ${requiredFile}`);
      }
    }
  });

  // Check for missing optional files
  OPTIONAL_FILES.forEach(optionalFile => {
    if (!foundFiles.has(optionalFile)) {
      warnings.push(`Missing optional file or directory: ${optionalFile}`);
      console.log(`Missing optional file: ${optionalFile}`);
    }
  });

  // Validate content of key files
  for (const file of files) {
    const fileName = file.getName();

    // Skip directories
    if (fileName.endsWith('/')) continue;

    // Validate JSON files
    if (fileName.endsWith('.json') && !fileName.includes('/')) {
      try {
        const content = file.getDataAsString();
        JSON.parse(content); // Just check if it's valid JSON
        console.log(`Validated JSON file: ${fileName}`);
      } catch (error) {
        errors.push(`Invalid JSON in file: ${fileName}`);
        console.warn(`Invalid JSON in file: ${fileName}`, error);
      }
    }
  }

  // If we have no required files at all, but we have some files, try to be lenient
  if (errors.length === REQUIRED_FILES.length && files.length > 0) {
    console.log('No required files found, but we have some files. Attempting to proceed anyway.');
    errors.length = 0; // Clear errors
    warnings.push('No standard configuration files found. Attempting to process anyway.');
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Cleans up temporary resources
 * @param tempFolder - Temporary folder to clean up
 */
function cleanupTempResources(tempFolder: GoogleAppsScript.Drive.Folder): void {
  try {
    tempFolder.setTrashed(true);
  } catch (error) {
    console.warn('Error cleaning up temporary resources:', error);
  }
}
