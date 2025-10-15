/// <reference path="../utils.ts" />

/**
 * Fallback icon SVG to use when icon generation fails
 * Simple marker icon with 100% fill to use background color
 */
const FALLBACK_ICON_SVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E';

/**
 * Processes icons for each category and returns an array of CoMapeoIcon objects.
 * @param folder - Optional Google Drive folder to save icons
 * @returns Array of CoMapeoIcon objects
 */
function processIcons(
  folder?: GoogleAppsScript.Drive.Folder,
  suffixes: string[] = [],
): CoMapeoIcon[] {
  console.log("Starting icon processing");
  const { categories, backgroundColors, iconUrls, categoriesSheet } =
    getCategoryData();
  return categories.reduce((icons: CoMapeoIcon[], category, index) => {
    const [name, , , icon] = category;
    const backgroundColor = backgroundColors[index][0];
    const iconImage = iconUrls[index][0];
    const presetSlug = createPresetSlug(name, index);

    console.log(`Processing icon for category: ${name} (slug: ${presetSlug})`);
    const iconSvg = processIconImage(name, iconImage, backgroundColor, presetSlug);
    let iconUrl = iconSvg;

    // Validate icon before proceeding
    if (!iconSvg || iconSvg.trim() === '') {
      console.warn(`Empty icon generated for ${name}, using fallback icon`);
      iconUrl = FALLBACK_ICON_SVG;
    } else if (folder) {
      iconUrl = saveIconToFolder(
        folder,
        name,
        presetSlug,
        iconSvg,
        suffixes,
        backgroundColor,
      );
    }

    console.log(`Updating icon URL in sheet for: ${name}`);
    updateIconUrlInSheet(categoriesSheet, index + 2, 2, iconUrl);

    // Only push valid icons to array
    if (iconUrl && iconUrl.trim() !== '') {
      icons.push({
        name: presetSlug,
        svg: iconUrl,
      });
    } else {
      console.error(`Failed to generate valid icon for ${name}, skipping`);
    }

    console.log(`Finished processing icon for: ${name}`);
    return icons;
  }, []);
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

function processIconImage(
  name: string,
  iconImage: any,
  backgroundColor: string,
  presetSlug: string,
): string {
  try {
    if (isGoogleDriveIcon(iconImage)) {
      console.log(`Using existing Google Drive icon for ${name}: ${iconImage}`);
      // Validate that we can access this Drive file before using it
      if (iconImage.startsWith("https://drive.google.com/file/d/")) {
        const fileId = iconImage.split("/d/")[1].split("/")[0];
        try {
          DriveApp.getFileById(fileId); // Test access
          return iconImage; // Return the URL if we can access it
        } catch (error) {
          console.warn(`Cannot access Google Drive icon for ${name}, generating fallback: ${error.message}`);
          return generateNewIcon(name, backgroundColor, presetSlug);
        }
      }
      return iconImage;
    } else if (isCellImage(iconImage)) {
      return processCellImage(name, iconImage, backgroundColor, presetSlug);
    } else {
      console.log(`Generating new icon for ${name}`);
      return generateNewIcon(name, backgroundColor, presetSlug);
    }
  } catch (error) {
    console.error(`Error processing icon for ${name}: ${error.message}`);
    console.log(`Falling back to generating new icon for ${name}`);
    return generateNewIcon(name, backgroundColor, presetSlug);
  }
}

function isGoogleDriveIcon(iconImage: any): boolean {
  return (
    typeof iconImage === "string" &&
    iconImage.startsWith("https://drive.google.com")
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
    return generateNewIcon(name, backgroundColor, presetSlug);
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
): string {
  console.log(`Saving icon to folder for ${displayName} (slug: ${presetSlug}):`, iconSvg);

  const { iconContent, mimeType } = getIconContent({
    svg: iconSvg,
    name: presetSlug,
  });

  if (!iconContent) {
    console.warn(`Failed to get icon content for ${displayName}, using fallback approach`);
    // Fall back to generating a new icon instead of failing completely
    const defaultBackground = "#6d44d9"; // Default color
    const fallbackSvg = generateNewIcon(
      displayName,
      backgroundColor || defaultBackground,
      presetSlug,
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
      );
    } else {
      console.error(`Complete failure to generate icon for ${displayName}, using fallback icon`);
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

function getIconContent(icon: CoMapeoIcon): {
  iconContent: string | null;
  mimeType: string;
} {
  if (icon.svg.startsWith("data:image/svg+xml,")) {
    return {
      iconContent: decodeURIComponent(
        icon.svg.replace(/data:image\/svg\+xml,/, ""),
      ),
      mimeType: MimeType.SVG,
    };
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
      console.error(`Failed to access Drive file with ID "${fileId}": ${error.message}`);
      console.warn(`Skipping inaccessible Drive file, returning null content`);
      return { iconContent: null, mimeType: "" };
    }
  } else {
    console.error("Unsupported icon format");
    return { iconContent: null, mimeType: "" };
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
  const fileName = `${slug}${sanitizedSize}.${extension}`;
  const blob = Utilities.newBlob(content, mimeType, fileName);
  const file = folder.createFile(blob);
  if (typeof applyDefaultSharing === "function") {
    try {
      applyDefaultSharing(file);
    } catch (error) {
      console.warn(`Failed to apply sharing for icon file ${fileName}: ${error.message}`);
    }
  }
  if (zipBlobs) {
    zipBlobs.push(blob.copyBlob().setName(`icons/${fileName}`));
  }
  return file;
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
): string {
  const iconSlug = presetSlug || createPresetSlug(name);
  const preset = {
    icon: iconSlug,
    color: backgroundColor,
    name: name,
  };
  const generatedIcon = getIconForPreset(preset);
  if (generatedIcon && generatedIcon.svg) {
    return generatedIcon.svg;
  } else {
    console.warn(`Failed to generate icon for ${name}, using fallback icon`);
    return FALLBACK_ICON_SVG;
  }
}

function getIconForPreset(preset: Partial<CoMapeoPreset>): CoMapeoIcon | null {
  const searchParams = getSearchParams(preset.name);
  let searchData = findValidSearchData(searchParams);

  // Add retry limit to prevent infinite loop
  let retryCount = 0;
  const maxRetries = 3;

  while (!searchData && retryCount < maxRetries) {
    console.log(`Retrying search for ${preset.name} (attempt ${retryCount + 1}/${maxRetries})`);
    searchData = findValidSearchData(searchParams);
    retryCount++;
  }

  if (!searchData) {
    console.error(`Failed to find icon data for ${preset.name} after ${maxRetries} attempts`);
  }

  if (searchData) {
    const generateData = getGenerateData(searchData[0], preset.color);
    if (generateData) {
      return {
        name: preset.icon,
        svg: generateData[0].svg,
      };
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
