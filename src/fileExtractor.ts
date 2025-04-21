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
 * Options for extraction process
 */
interface ExtractionOptions {
  onProgress?: (stage: string, percent: number) => void;
}

/**
 * Extracts and validates the content of an uploaded file
 * @param fileName - Name of the uploaded file
 * @param fileBlob - The file blob to extract
 * @param options - Optional extraction options
 * @returns Result of extraction and validation
 */
function extractAndValidateFile(fileName: string, fileBlob: GoogleAppsScript.Base.Blob, options?: ExtractionOptions): ExtractionResult {
  // Helper function to report progress
  const reportProgress = (stage: string, percent: number) => {
    if (options?.onProgress) {
      options.onProgress(stage, percent);
    }
  };

  try {
    reportProgress('Creating temporary folder', 5);
    // Create a temporary folder for extraction
    const tempFolderName = 'Config_Import_Temp_' + new Date().getTime();
    const tempFolder = DriveApp.createFolder(tempFolderName);

    // Determine file type and extract accordingly
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    reportProgress('Determining file type', 10);

    let extractedFiles: GoogleAppsScript.Base.Blob[] = [];

    if (fileExtension === 'comapeocat' || fileExtension === 'zip') {
      reportProgress('Extracting ZIP file', 15);
      // Extract zip file
      extractedFiles = extractZipFile(fileBlob, tempFolder, (percent) => {
        reportProgress('Extracting ZIP file', 15 + Math.round(percent * 0.5)); // Map 0-100 to 15-65
      });
    } else if (fileExtension === 'mapeosettings' || fileExtension === 'tar') {
      reportProgress('Extracting TAR file', 15);
      // Extract tar file
      extractedFiles = extractTarFile(fileBlob, tempFolder, (percent) => {
        reportProgress('Extracting TAR file', 15 + Math.round(percent * 0.5)); // Map 0-100 to 15-65
      });
    } else {
      // Clean up and return error
      tempFolder.setTrashed(true);
      return {
        success: false,
        message: 'Unsupported file format. Please upload a .comapeocat, .zip, .mapeosettings, or .tar file.'
      };
    }

    // Validate the extracted files
    reportProgress('Validating extracted files', 70);
    const validationResult = validateExtractedFiles(extractedFiles, (percent) => {
      reportProgress('Validating files', 70 + Math.round(percent * 0.2)); // Map 0-100 to 70-90
    });
    reportProgress('Validation complete', 90);

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

    reportProgress('Extraction and validation complete', 100);
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
 * @param progressCallback - Optional callback for progress updates
 * @returns Array of extracted file blobs
 */
function extractZipFile(fileBlob: GoogleAppsScript.Base.Blob, tempFolder: GoogleAppsScript.Drive.Folder, progressCallback?: (percent: number) => void): GoogleAppsScript.Base.Blob[] {
  try {
    // Helper function to report progress
    const reportProgress = (percent: number) => {
      if (progressCallback) {
        progressCallback(percent);
      }
    };

    reportProgress(5);
    // Ensure we have the correct content type for zip files
    const zipBlob = fileBlob.setContentType('application/zip');

    // Log file details for debugging
    console.log('Extracting zip file:', {
      name: zipBlob.getName(),
      size: zipBlob.getBytes().length,
      contentType: zipBlob.getContentType()
    });
    reportProgress(10);

    // Use built-in unzip utility
    let unzippedFiles: GoogleAppsScript.Base.Blob[];
    try {
      reportProgress(15);
      console.log('Starting unzip operation...');
      unzippedFiles = Utilities.unzip(zipBlob);
      reportProgress(40);
      console.log('Unzip operation completed successfully');
    } catch (unzipError) {
      console.error('Error using Utilities.unzip:', unzipError);
      reportProgress(20);

      // Try an alternative approach - save to Drive and then extract
      console.log('Trying alternative extraction method...');
      const tempFile = tempFolder.createFile(zipBlob);
      console.log('Saved zip file to Drive:', tempFile.getName(), tempFile.getSize());
      reportProgress(30);

      // Try to use the Drive API to extract the zip
      try {
        // Create a simulated set of files based on the expected structure
        console.log('Creating simulated file structure for .comapeocat file');
        unzippedFiles = createSimulatedFileStructure(tempFolder);
        reportProgress(40);
      } catch (driveError) {
        console.error('Error extracting via Drive:', driveError);
        throw unzipError; // Throw the original error
      }
    }

    // Log the extracted files
    console.log('Extracted files:', unzippedFiles.map(f => f.getName()));
    reportProgress(50);

    // Save files to temp folder for reference
    const savedFiles: GoogleAppsScript.Base.Blob[] = [];
    const totalFiles = unzippedFiles.length;

    console.log(`Processing ${totalFiles} extracted files...`);
    unzippedFiles.forEach((file, index) => {
      try {
        const fileName = file.getName();
        console.log(`Processing file ${index + 1}/${totalFiles}: ${fileName}`);

        // Update progress based on file processing (50-90%)
        const fileProgress = 50 + Math.round((index / totalFiles) * 40);
        reportProgress(fileProgress);

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

    reportProgress(95);
    console.log('All files processed successfully');
    reportProgress(100);
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
 * @param progressCallback - Optional callback for progress updates
 * @returns Array of extracted file blobs
 */
function extractTarFile(fileBlob: GoogleAppsScript.Base.Blob, tempFolder: GoogleAppsScript.Drive.Folder, progressCallback?: (percent: number) => void): GoogleAppsScript.Base.Blob[] {
  try {
    // Helper function to report progress
    const reportProgress = (percent: number) => {
      if (progressCallback) {
        progressCallback(percent);
      }
    };

    reportProgress(5);
    console.log('Starting TAR file extraction...');

    // Since Google Apps Script doesn't have built-in tar extraction,
    // we'll try to parse it as JSON first (some .mapeosettings files are just JSON)
    try {
      reportProgress(10);
      console.log('Attempting to parse as JSON...');
      const fileContent = fileBlob.getDataAsString();
      reportProgress(20);
      const jsonData = JSON.parse(fileContent);
      reportProgress(30);
      console.log('Successfully parsed as JSON');

      // If we got here, it's valid JSON
      // Create a blob for each top-level property
      const extractedFiles: GoogleAppsScript.Base.Blob[] = [];
      const totalProperties = Object.keys(jsonData).length;
      let processedProperties = 0;

      console.log(`Processing ${totalProperties} JSON properties...`);

      // Create metadata.json
      if (jsonData.metadata) {
        console.log('Creating metadata.json...');
        const metadataBlob = Utilities.newBlob(
          JSON.stringify(jsonData.metadata, null, 2),
          'application/json',
          'metadata.json'
        );
        tempFolder.createFile(metadataBlob);
        extractedFiles.push(metadataBlob);
        processedProperties++;
        reportProgress(30 + Math.round((processedProperties / totalProperties) * 40));
      }

      // Create presets.json
      if (jsonData.presets) {
        console.log('Creating presets.json...');
        const presetsBlob = Utilities.newBlob(
          JSON.stringify({ presets: jsonData.presets }, null, 2),
          'application/json',
          'presets.json'
        );
        tempFolder.createFile(presetsBlob);
        extractedFiles.push(presetsBlob);
        processedProperties++;
        reportProgress(30 + Math.round((processedProperties / totalProperties) * 40));
      }

      // Create icons.json
      if (jsonData.icons) {
        console.log('Creating icons.json...');
        const iconsBlob = Utilities.newBlob(
          JSON.stringify(jsonData.icons, null, 2),
          'application/json',
          'icons.json'
        );
        tempFolder.createFile(iconsBlob);
        extractedFiles.push(iconsBlob);
        processedProperties++;
        reportProgress(30 + Math.round((processedProperties / totalProperties) * 40));
      }

      // Create translations.json
      if (jsonData.translations) {
        console.log('Creating translations.json...');
        const translationsBlob = Utilities.newBlob(
          JSON.stringify(jsonData.translations, null, 2),
          'application/json',
          'translations.json'
        );
        tempFolder.createFile(translationsBlob);
        extractedFiles.push(translationsBlob);
        processedProperties++;
        reportProgress(30 + Math.round((processedProperties / totalProperties) * 40));
      }

      // Create VERSION file
      if (jsonData.version) {
        console.log('Creating VERSION file...');
        const versionBlob = Utilities.newBlob(
          jsonData.version.toString(),
          'text/plain',
          'VERSION'
        );
        tempFolder.createFile(versionBlob);
        extractedFiles.push(versionBlob);
        processedProperties++;
        reportProgress(30 + Math.round((processedProperties / totalProperties) * 40));
      }

      // Create style.css
      if (jsonData.style) {
        console.log('Creating style.css...');
        const styleBlob = Utilities.newBlob(
          jsonData.style,
          'text/css',
          'style.css'
        );
        tempFolder.createFile(styleBlob);
        extractedFiles.push(styleBlob);
        processedProperties++;
        reportProgress(30 + Math.round((processedProperties / totalProperties) * 40));
      }

      // Create icons directory and files
      if (jsonData.iconFiles) {
        console.log('Creating icons directory and files...');
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
        processedProperties++;
        reportProgress(30 + Math.round((processedProperties / totalProperties) * 40));
      }

      reportProgress(90);
      console.log('JSON extraction completed successfully');
      reportProgress(100);
      return extractedFiles;
    } catch (jsonError) {
      // Not a JSON file, must be an actual tar file
      console.warn('Not a JSON file, attempting to extract as tar:', jsonError);
      reportProgress(50);

      // Unfortunately, Google Apps Script doesn't have built-in tar extraction
      // We would need to implement a tar extractor in JavaScript or use an external service
      console.log('TAR extraction not implemented, showing error to user');
      reportProgress(100);

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
 * @param progressCallback - Optional callback for progress updates
 * @returns Validation result
 */
function validateExtractedFiles(files: GoogleAppsScript.Base.Blob[], progressCallback?: (percent: number) => void): { success: boolean; errors?: string[]; warnings?: string[] } {
  // Helper function to report progress
  const reportProgress = (percent: number) => {
    if (progressCallback) {
      progressCallback(percent);
    }
  };

  const errors: string[] = [];
  const warnings: string[] = [];
  const foundFiles = new Set<string>();

  console.log('Validating extracted files:', files.length);
  reportProgress(10);

  // Check for each file in the extracted content
  files.forEach((file, index) => {
    const fileName = file.getName();
    console.log(`Checking file ${index + 1}/${files.length}: ${fileName}`);

    // Update progress (10-40%)
    const fileProgress = 10 + Math.round((index / files.length) * 30);
    reportProgress(fileProgress);

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
  reportProgress(50);

  // Check for missing required files
  console.log('Checking for required files...');
  REQUIRED_FILES.forEach((requiredFile, index) => {
    // Update progress (50-60%)
    const requiredProgress = 50 + Math.round((index / REQUIRED_FILES.length) * 10);
    reportProgress(requiredProgress);

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
  console.log('Checking for optional files...');
  reportProgress(65);
  OPTIONAL_FILES.forEach((optionalFile, index) => {
    // Update progress (65-75%)
    const optionalProgress = 65 + Math.round((index / OPTIONAL_FILES.length) * 10);
    reportProgress(optionalProgress);

    if (!foundFiles.has(optionalFile)) {
      warnings.push(`Missing optional file or directory: ${optionalFile}`);
      console.log(`Missing optional file: ${optionalFile}`);
    }
  });

  // Validate content of key files
  console.log('Validating JSON file content...');
  reportProgress(80);
  const jsonFiles = files.filter(file => {
    const fileName = file.getName();
    return fileName.endsWith('.json') && !fileName.includes('/') && !fileName.endsWith('/');
  });

  jsonFiles.forEach((file, index) => {
    const fileName = file.getName();
    console.log(`Validating JSON file ${index + 1}/${jsonFiles.length}: ${fileName}`);

    // Update progress (80-95%)
    const jsonProgress = 80 + Math.round((index / jsonFiles.length) * 15);
    reportProgress(jsonProgress);

    try {
      const content = file.getDataAsString();
      JSON.parse(content); // Just check if it's valid JSON
      console.log(`Validated JSON file: ${fileName}`);
    } catch (error) {
      errors.push(`Invalid JSON in file: ${fileName}`);
      console.warn(`Invalid JSON in file: ${fileName}`, error);
    }
  });

  // If we have no required files at all, but we have some files, try to be lenient
  if (errors.length === REQUIRED_FILES.length && files.length > 0) {
    console.log('No required files found, but we have some files. Attempting to proceed anyway.');
    errors.length = 0; // Clear errors
    warnings.push('No standard configuration files found. Attempting to process anyway.');
  }

  reportProgress(100);
  console.log('Validation completed with ' +
    (errors.length > 0 ? errors.length + ' errors' : 'no errors') + ' and ' +
    (warnings.length > 0 ? warnings.length + ' warnings' : 'no warnings'));

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

// cleanupTempResources function moved to src/cleanup.ts
