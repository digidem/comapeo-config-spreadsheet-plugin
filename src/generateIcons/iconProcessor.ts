/// <reference path="../utils.ts" />
/// <reference path="./iconErrors.ts" />
/// <reference path="./svgValidator.ts" />

/**
 * Fallback icon SVG to use when icon generation fails
 * Simple marker icon with 100% fill to use background color
 */
const FALLBACK_ICON_SVG =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E';

/**
 * Result of icon processing with error tracking
 */
interface IconProcessingResult {
  /** Successfully processed icons */
  icons: CoMapeoIcon[];

  /** Error summary from processing */
  errorSummary: IconErrorSummary;
}

/**
 * Processes icons for each category and returns an array of CoMapeoIcon objects.
 * @param folder - Optional Google Drive folder to save icons
 * @param errorCollector - Optional error collector (will create one if not provided)
 * @returns Object with icons array and error summary
 */
function processIcons(
  folder?: GoogleAppsScript.Drive.Folder,
  suffixes: string[] = [],
  errorCollector?: IconErrorCollector,
): IconProcessingResult {
  // Create error collector if not provided
  const collector = errorCollector || createIconErrorCollector();
  console.log("Starting icon processing");
  const { categories, backgroundColors, iconUrls, categoriesSheet } =
    getCategoryData();

  const icons = categories.reduce((icons: CoMapeoIcon[], category, index) => {
    const [name, , , icon] = category;
    const backgroundColor = backgroundColors[index][0];
    const iconImage = iconUrls[index][0];
    const presetSlug = createPresetSlug(name, index);

    console.log(`Processing icon for category: ${name} (slug: ${presetSlug})`);

    // Pre-validate the icon before processing
    const validation = validateCellIcon(iconImage);
    if (!validation.valid) {
      collector.addFormatError(
        name,
        validation.error || "Unknown validation error",
        true, // Will use fallback
        validation.context,
      );
      const iconUrl = FALLBACK_ICON_SVG;
      updateIconUrlInSheet(categoriesSheet, index + 2, 2, iconUrl);
      icons.push({ name: presetSlug, svg: iconUrl });
      return icons;
    }

    const iconSvg = processIconImage(
      name,
      iconImage,
      backgroundColor,
      presetSlug,
      collector,
      folder,
    );
    let iconUrl = iconSvg;

    // Validate icon result before proceeding
    if (!iconSvg || iconSvg.trim() === "") {
      console.warn(`Empty icon generated for ${name}, using fallback icon`);
      collector.addFormatError(name, "Empty icon generated", true);
      iconUrl = FALLBACK_ICON_SVG;
    } else if (folder) {
      iconUrl = saveIconToFolder(
        folder,
        name,
        presetSlug,
        iconSvg,
        suffixes,
        backgroundColor,
        undefined,
        collector,
      );
    }

    console.log(`Updating icon URL in sheet for: ${name}`);
    updateIconUrlInSheet(categoriesSheet, index + 2, 2, iconUrl);

    // Only push valid icons to array
    if (iconUrl && iconUrl.trim() !== "") {
      collector.recordSuccess(name);
      icons.push({
        name: presetSlug,
        svg: iconUrl,
      });
    } else {
      console.error(`Failed to generate valid icon for ${name}, skipping`);
      collector.addUnknownError(
        name,
        "Failed to generate valid icon URL",
        false,
      );
    }

    console.log(`Finished processing icon for: ${name}`);
    return icons;
  }, []);

  return {
    icons,
    errorSummary: collector.getSummary(),
  };
}

function getCategoryData() {
  const categoriesSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Categories");
  const categories = categoriesSheet
    .getRange(2, 1, categoriesSheet.getLastRow() - 1, 4)
    .getValues();
  const backgroundColors = categoriesSheet
    .getRange(2, 2, categories.length, 1)
    .getBackgrounds();
  const iconUrls = categoriesSheet
    .getRange(2, 2, categories.length, 1)
    .getValues();

  return { categories, backgroundColors, iconUrls, categoriesSheet };
}

/**
 * Validates and fixes Drive icon filename to match preset slug.
 * Combines access validation and filename validation to avoid duplicate Drive API calls.
 *
 * @param iconUrl - Google Drive URL
 * @param name - Category display name
 * @param presetSlug - Expected slug for the icon file
 * @param targetFolder - Optional folder where corrected icon should be placed
 * @param collector - Error collector
 * @returns Updated Drive URL (either original or corrected file)
 */
function validateAndFixIconFilename(
  iconUrl: string,
  name: string,
  presetSlug: string,
  targetFolder: GoogleAppsScript.Drive.Folder | undefined,
  collector: IconErrorCollector,
): string {
  try {
    const fileId = iconUrl.split("/d/")[1].split("/")[0];

    // Single Drive API call - validate access AND get file info
    let file: GoogleAppsScript.Drive.File;
    try {
      file = DriveApp.getFileById(fileId);
    } catch (error) {
      // Access validation failed
      collector.addPermissionError(
        name,
        `Drive file not accessible: ${error.message}`,
        false,
        { fileId, url: iconUrl },
      );
      return iconUrl; // Return original URL, caller will handle fallback
    }

    const fileName = file.getName();
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    const currentSlug = normalizeIconSlug(slugify(nameWithoutExt));

    // If filename already matches expected slug, return as-is
    if (currentSlug === presetSlug) {
      console.log(
        `Icon filename "${fileName}" matches preset slug "${presetSlug}" ✓`,
      );
      return iconUrl;
    }

    console.log(
      `Icon filename mismatch for ${name}: expected "${presetSlug}", found "${currentSlug}"`,
    );

    // Get file extension and construct correct filename
    const extension = fileName.match(/\.[^/.]+$/)?.[0] || ".svg";
    const correctFileName = `${presetSlug}${extension}`;

    // Determine target folder for the corrected file
    let folder: GoogleAppsScript.Drive.Folder;
    if (targetFolder) {
      // Use the provided config folder
      folder = targetFolder;
    } else {
      // Fallback: Use file's first parent, or create in root
      const parents = file.getParents();
      if (parents.hasNext()) {
        folder = parents.next();
      } else {
        // File has no parent - shouldn't happen in normal use
        console.warn(
          `Icon file "${fileName}" has no parent folder, using Drive root`,
        );
        folder = DriveApp.getRootFolder();
      }
    }

    // Check if correctly-named file already exists in target folder
    const existingFiles = folder.getFilesByName(correctFileName);
    if (existingFiles.hasNext()) {
      const existingFile = existingFiles.next();
      console.log(`Using existing correctly-named icon: ${correctFileName}`);
      return existingFile.getUrl();
    }

    // Create a copy with the correct name
    console.log(`Creating corrected icon copy: ${correctFileName}`);
    const newFile = file.makeCopy(correctFileName, folder);

    // Apply sharing settings if available
    if (typeof applyDefaultSharing === "function") {
      try {
        applyDefaultSharing(newFile);
      } catch (error) {
        console.warn(
          `Failed to apply sharing for ${correctFileName}: ${error.message}`,
        );
      }
    }

    const newUrl = newFile.getUrl();
    console.log(`Created corrected icon: ${correctFileName} ✓`);

    return newUrl;
  } catch (error) {
    console.error(
      `Error validating icon filename for ${name}: ${error.message}`,
    );
    collector.addUnknownError(
      name,
      `Failed to validate/fix icon filename: ${error.message}`,
      false,
      { originalUrl: iconUrl },
    );
    // Return original URL, caller will handle fallback
    return iconUrl;
  }
}

function processIconImage(
  name: string,
  iconImage: any,
  backgroundColor: string,
  presetSlug: string,
  collector: IconErrorCollector,
  targetFolder?: GoogleAppsScript.Drive.Folder,
): string {
  try {
    if (isInlineSvg(iconImage)) {
      // Normalize to strip XML declarations and ensure clean SVG
      const normalized = normalizeSvgContent(iconImage);
      if (normalized) {
        return normalized;
      }
      // Fallback if normalization fails (shouldn't happen after isInlineSvg check)
      console.warn(
        `Inline SVG normalization failed for ${name}, using original`,
      );
      return iconImage.trim();
    }

    if (isSvgDataUri(iconImage)) {
      return iconImage.trim();
    }

    if (isGoogleDriveIcon(iconImage)) {
      // Only process Drive URLs (not data URIs)
      if (iconImage.startsWith("https://drive.google.com/file/d/")) {
        console.log(`Processing existing Drive icon for ${name}: ${iconImage}`);

        // Validate access AND filename in single operation
        const validatedUrl = validateAndFixIconFilename(
          iconImage,
          name,
          presetSlug,
          targetFolder,
          collector,
        );

        // If validation returned different URL, it means we created/found corrected file
        if (validatedUrl !== iconImage) {
          console.log(`Using corrected icon URL for ${name}`);
          return validatedUrl;
        }

        // Same URL returned - validation passed or failed gracefully
        return iconImage;
      }
      // Non-standard Drive URL format - return as-is
      return iconImage;
    } else if (isExternalHttpIcon(iconImage)) {
      console.log(`Processing external HTTP(S) icon for ${name}: ${iconImage}`);
      return iconImage.trim();
    } else if (isCellImage(iconImage)) {
      return processCellImage(
        name,
        iconImage,
        backgroundColor,
        presetSlug,
        collector,
      );
    } else {
      // Plain text search term (e.g., "river", "building", "tree")
      // Use the icon cell value as the search term instead of the category name
      const searchTerm =
        typeof iconImage === "string" && iconImage.trim() !== ""
          ? iconImage.trim()
          : name;
      console.log(
        `Generating new icon for ${name} using search term: "${searchTerm}"`,
      );
      return generateNewIcon(
        searchTerm,
        backgroundColor,
        presetSlug,
        collector,
      );
    }
  } catch (error) {
    console.error(`Error processing icon for ${name}: ${error.message}`);
    collector.addUnknownError(
      name,
      `Unexpected error during processing: ${error.message}`,
      true, // Will generate fallback
      { errorStack: error.stack },
    );
    // Use icon cell value as search term if it's a non-empty string, otherwise use category name
    const fallbackSearchTerm =
      typeof iconImage === "string" && iconImage.trim() !== ""
        ? iconImage.trim()
        : name;
    console.log(
      `Falling back to generating new icon for ${name} using search term: "${fallbackSearchTerm}"`,
    );
    return generateNewIcon(
      fallbackSearchTerm,
      backgroundColor,
      presetSlug,
      collector,
    );
  }
}

function isGoogleDriveIcon(iconImage: any): boolean {
  return (
    typeof iconImage === "string" &&
    iconImage.startsWith("https://drive.google.com")
  );
}

function isExternalHttpIcon(iconImage: any): boolean {
  if (typeof iconImage !== "string") {
    return false;
  }

  const trimmed = iconImage.trim();
  return (
    (trimmed.startsWith("https://") || trimmed.startsWith("http://")) &&
    !trimmed.startsWith("https://drive.google.com") &&
    !trimmed.startsWith("http://drive.google.com")
  );
}

/**
 * Normalizes inline SVG content by stripping XML declarations, doctypes, and comments.
 * Extracts the clean <svg>...</svg> content for consistent processing.
 *
 * @param svgString - Raw SVG string that may contain XML prologs
 * @returns Cleaned SVG string starting with <svg, or null if invalid
 */
function normalizeSvgContent(svgString: string): string | null {
  if (!svgString || typeof svgString !== "string") {
    return null;
  }

  let cleaned = svgString.trim();

  // Strip XML declarations: <?xml version="1.0" encoding="UTF-8"?>
  cleaned = cleaned.replace(/<\?xml[^?]*\?>\s*/gi, "");

  // Strip DOCTYPE declarations: <!DOCTYPE svg ...>
  cleaned = cleaned.replace(/<!DOCTYPE[^>]*>\s*/gi, "");

  // Strip leading comments: <!-- ... -->
  cleaned = cleaned.replace(/^(\s*<!--[\s\S]*?-->\s*)+/, "");

  // Verify we still have valid SVG structure
  if (!cleaned.includes("<svg") || !cleaned.includes("</svg>")) {
    return null;
  }

  // Extract just the <svg>...</svg> content if there's extra wrapper content
  const svgMatch = cleaned.match(/(<svg[\s\S]*<\/svg>)/i);
  if (svgMatch) {
    return svgMatch[1].trim();
  }

  return cleaned.trim();
}

function isInlineSvg(iconImage: any): boolean {
  if (typeof iconImage !== "string") {
    return false;
  }

  // Use normalizeSvgContent to handle XML declarations and other prologs
  const normalized = normalizeSvgContent(iconImage);
  return normalized !== null;
}

function isSvgDataUri(iconImage: any): boolean {
  return (
    typeof iconImage === "string" &&
    iconImage.trim().startsWith("data:image/svg+xml")
  );
}

function isCellImage(iconImage: any): boolean {
  return typeof iconImage === "object" && iconImage.toString() === "CellImage";
}

function processCellImage(
  name: string,
  iconImage: any,
  backgroundColor: string,
  presetSlug: string,
  collector: IconErrorCollector,
): string {
  const iconUrl = iconImage.getUrl();
  console.log(`Processing cell image icon for ${name}: ${iconUrl}`);
  let generateData = getGenerateData(iconUrl, backgroundColor);
  if (generateData) {
    return generateData[0].svg;
  } else {
    console.log(
      `Failed to process cell image. Generating new icon for ${name}`,
    );
    collector.addApiError(
      name,
      "Failed to process cell image through icon API",
      true, // Will generate fallback
      { iconUrl },
    );
    return generateNewIcon(name, backgroundColor, presetSlug, collector);
  }
}

function saveIconToFolder(
  folder: GoogleAppsScript.Drive.Folder,
  displayName: string,
  presetSlug: string,
  iconSvg: string,
  suffixes: string[],
  backgroundColor: string,
  zipBlobs?: GoogleAppsScript.Base.Blob[],
  collector?: IconErrorCollector,
): string {
  console.log(
    `Saving icon to folder for ${displayName} (slug: ${presetSlug}):`,
    iconSvg,
  );

  const { iconContent, mimeType, error } = getIconContent(
    {
      svg: iconSvg,
      name: presetSlug,
    },
    collector,
    displayName,
  );

  if (!iconContent) {
    console.warn(
      `Failed to get icon content for ${displayName}, using fallback approach`,
    );
    if (collector && error) {
      // Error already recorded by getIconContent
    }

    // Fall back to generating a new icon instead of failing completely
    const defaultBackground = "#6d44d9"; // Default color
    const fallbackSvg = generateNewIcon(
      displayName,
      backgroundColor || defaultBackground,
      presetSlug,
      collector,
    );
    if (fallbackSvg) {
      return saveIconToFolder(
        folder,
        displayName,
        presetSlug,
        fallbackSvg,
        suffixes,
        backgroundColor || defaultBackground,
        zipBlobs,
        collector,
      );
    } else {
      console.error(
        `Complete failure to generate icon for ${displayName}, using fallback icon`,
      );
      if (collector) {
        collector.addUnknownError(
          displayName,
          "Complete failure to generate or save icon",
          true,
        );
      }
      return FALLBACK_ICON_SVG;
    }
  }

  let files: GoogleAppsScript.Drive.File[] = [];
  if (suffixes.length > 0) {
    suffixes.forEach((suffix) => {
      const file = createIconFile(
        folder,
        presetSlug,
        suffix.replace("-", ""),
        iconContent,
        mimeType,
        zipBlobs,
      );
      files.push(file);
    });
  } else {
    const file = createIconFile(
      folder,
      presetSlug,
      "",
      iconContent,
      mimeType,
      zipBlobs,
    );
    files.push(file);
  }
  const file = files[0]; // Use the first file for compatibility with existing code
  console.log(`Saved icon to folder: ${file.getUrl()}`);
  return file.getUrl();
}

function getIconContent(
  icon: CoMapeoIcon,
  collector?: IconErrorCollector,
  iconName?: string,
): {
  iconContent: string | null;
  mimeType: string;
  error?: string;
} {
  // Try to normalize inline SVG (handles XML declarations, comments, etc.)
  const normalized = normalizeSvgContent(icon.svg);
  if (normalized) {
    return {
      iconContent: normalized,
      mimeType: MimeType.SVG,
    };
  }

  // Handle SVG Data-URIs with various encoding schemes
  if (icon.svg.startsWith("data:image/svg+xml")) {
    try {
      let content: string;

      // Match: data:image/svg+xml;base64,<base64-content>
      const base64Match = icon.svg.match(/^data:image\/svg\+xml;base64,(.+)$/);
      if (base64Match) {
        const decoded = Utilities.newBlob(
          Utilities.base64Decode(base64Match[1]),
        ).getDataAsString();
        return {
          iconContent: decoded,
          mimeType: MimeType.SVG,
        };
      }

      // Match: data:image/svg+xml,<url-encoded-content>
      // Also handles: data:image/svg+xml;charset=utf-8,<content>
      //               data:image/svg+xml;utf8,<content>
      const commaIndex = icon.svg.indexOf(",");
      if (commaIndex !== -1) {
        const encodedContent = icon.svg.substring(commaIndex + 1);
        content = decodeURIComponent(encodedContent);
        return {
          iconContent: content,
          mimeType: MimeType.SVG,
        };
      }

      // Fallback: no comma found (malformed Data-URI)
      throw new Error("Malformed SVG Data-URI: no comma separator found");
    } catch (error) {
      const errorMsg = `Failed to decode SVG data URI: ${error.message}`;
      console.error(errorMsg);
      if (collector && iconName) {
        collector.addFormatError(iconName, errorMsg, false, {
          iconSvgPreview: icon.svg.substring(0, 100),
        });
      }
      return { iconContent: null, mimeType: "", error: errorMsg };
    }
  } else if (icon.svg.startsWith("https://drive.google.com/file/d/")) {
    const fileId = icon.svg.split("/d/")[1].split("/")[0];
    console.log(`Attempting to access Drive file with ID: ${fileId}`);

    try {
      const file = DriveApp.getFileById(fileId);
      return {
        iconContent: file.getBlob().getDataAsString(),
        mimeType: file.getMimeType(),
      };
    } catch (error) {
      const errorMsg = `Failed to access Drive file with ID "${fileId}": ${error.message}`;
      console.error(errorMsg);
      console.warn(`Skipping inaccessible Drive file, returning null content`);
      if (collector && iconName) {
        collector.addDriveError(iconName, errorMsg, false, {
          fileId,
          url: icon.svg,
        });
      }
      return { iconContent: null, mimeType: "", error: errorMsg };
    }
  } else if (isExternalHttpIcon(icon.svg)) {
    try {
      const response = UrlFetchApp.fetch(icon.svg, {
        followRedirects: true,
        muteHttpExceptions: true,
      });
      const status = response.getResponseCode();
      if (status < 200 || status >= 300) {
        const errorMsg = `External icon request failed with status ${status}`;
        console.error(errorMsg);
        if (collector && iconName) {
          collector.addNetworkError(iconName, errorMsg, false, {
            url: icon.svg,
            status,
          });
        }
        return { iconContent: null, mimeType: "", error: errorMsg };
      }

      const blob = response.getBlob();
      const contentType = blob.getContentType();
      const baseType = contentType.split(";")[0].trim();
      const content = blob.getDataAsString();
      const normalized = normalizeSvgContent(content);

      if (
        baseType === MimeType.SVG ||
        normalized ||
        content.includes("<svg")
      ) {
        return {
          iconContent: normalized || content,
          mimeType: MimeType.SVG,
        };
      }

      if (baseType === MimeType.PNG) {
        return {
          iconContent: content,
          mimeType: MimeType.PNG,
        };
      }

      const errorMsg = `Unsupported external icon content type: ${contentType}`;
      console.error(errorMsg);
      if (collector && iconName) {
        collector.addFormatError(iconName, errorMsg, false, {
          url: icon.svg,
          contentType,
        });
      }
      return { iconContent: null, mimeType: "", error: errorMsg };
    } catch (error) {
      const errorMsg = `Failed to fetch external icon: ${error.message}`;
      console.error(errorMsg);
      if (collector && iconName) {
        collector.addNetworkError(iconName, errorMsg, false, {
          url: icon.svg,
        });
      }
      return { iconContent: null, mimeType: "", error: errorMsg };
    }
  } else {
    const errorMsg = "Unsupported icon format";
    console.error(errorMsg);
    if (collector && iconName) {
      collector.addFormatError(iconName, errorMsg, false, {
        iconSvgPreview: icon.svg.substring(0, 100),
      });
    }
    return { iconContent: null, mimeType: "", error: errorMsg };
  }
}

function createIconFile(
  folder: GoogleAppsScript.Drive.Folder,
  slug: string,
  size: string,
  content: string,
  mimeType: string,
  zipBlobs?: GoogleAppsScript.Base.Blob[],
): GoogleAppsScript.Drive.File {
  const extension = mimeType === MimeType.SVG ? "svg" : "png";
  const sanitizedSize = size ? `-${size}` : "";
  const baseSlug = sanitizeIconSlug(slug) || slug;
  const fileName = `${baseSlug}${sanitizedSize}.${extension}`;
  removeExistingFilesByName(folder, fileName);
  const blob = Utilities.newBlob(content, mimeType, fileName);
  const file = folder.createFile(blob);
  if (typeof applyDefaultSharing === "function") {
    try {
      applyDefaultSharing(file);
    } catch (error) {
      console.warn(
        `Failed to apply sharing for icon file ${fileName}: ${error.message}`,
      );
    }
  }
  if (zipBlobs) {
    zipBlobs.push(blob.copyBlob().setName(`icons/${fileName}`));
  }
  return file;
}

function removeExistingFilesByName(
  folder: GoogleAppsScript.Drive.Folder,
  fileName: string,
): void {
  const matches = folder.getFilesByName(fileName);
  while (matches.hasNext()) {
    const existing = matches.next();
    console.log(
      `Removing existing icon file to avoid duplicates: ${existing.getName()} (${existing.getId()})`,
    );
    folder.removeFile(existing);
    existing.setTrashed(true);
  }
}

function updateIconUrlInSheet(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  row: number,
  col: number,
  iconUrl: string,
) {
  if (iconUrl) {
    sheet.getRange(row, col).setValue(iconUrl);
    console.log(
      `Updated icon URL in sheet: ${sheet.getRange(row, col).getValue()}`,
    );
  } else {
    console.warn(
      `Failed to save icon URL for ${sheet.getRange(row, col).getValue()}`,
    );
  }
}

// Import necessary functions from iconGenerator.ts
function generateNewIcon(
  name: string,
  backgroundColor: string,
  presetSlug?: string,
  collector?: IconErrorCollector,
): string {
  const iconSlug = presetSlug || createPresetSlug(name);
  const preset = {
    icon: iconSlug,
    color: backgroundColor,
    name: name,
  };
  const generatedIcon = getIconForPreset(preset, collector);
  if (generatedIcon && generatedIcon.svg) {
    return generatedIcon.svg;
  } else {
    console.warn(`Failed to generate icon for ${name}, using fallback icon`);
    if (collector) {
      collector.addApiError(name, "Icon API failed to generate icon", true);
    }
    return FALLBACK_ICON_SVG;
  }
}

function getIconForPreset(
  preset: Partial<CoMapeoPreset>,
  collector?: IconErrorCollector,
): CoMapeoIcon | null {
  const searchParams = getSearchParams(preset.name);
  let searchData = findValidSearchData(searchParams);

  // Add retry limit to prevent infinite loop
  let retryCount = 0;
  const maxRetries = 3;

  while (!searchData && retryCount < maxRetries) {
    console.log(
      `Retrying search for ${preset.name} (attempt ${retryCount + 1}/${maxRetries})`,
    );
    searchData = findValidSearchData(searchParams);
    retryCount++;
  }

  if (!searchData) {
    console.error(
      `Failed to find icon data for ${preset.name} after ${maxRetries} attempts`,
    );
    if (collector) {
      collector.addApiError(
        preset.name || "unknown",
        `Icon search failed after ${maxRetries} attempts`,
        false,
        { searchParams },
      );
    }
    return null;
  }

  if (searchData) {
    const generateData = getGenerateData(searchData[0], preset.color);
    if (generateData) {
      return {
        name: preset.icon,
        svg: generateData[0].svg,
      };
    } else {
      if (collector) {
        collector.addApiError(
          preset.name || "unknown",
          "Icon generation API returned no data",
          false,
          { searchUrl: searchData[0], color: preset.color },
        );
      }
    }
  }
  return null;
}

function getSearchParams(name: string): string[] {
  const nameOptions = name.split(" ");
  const extraNameOptions = name.split("-");
  return [name, ...nameOptions, ...extraNameOptions, "marker"];
}

function findValidSearchData(searchParams: string[]): any[] | null {
  for (const param of searchParams) {
    let searchData = fetchSearchData(param);
    let retries = 0;
    const maxRetries = 3;

    while (!searchData && retries < maxRetries) {
      console.log(`Retrying search for ${param}, attempt ${retries + 1}`);
      searchData = fetchSearchData(param);
      retries++;
    }

    if (Array.isArray(searchData) && searchData.length > 0) {
      return searchData;
    }
  }
  return null;
}
