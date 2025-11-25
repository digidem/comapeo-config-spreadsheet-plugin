/**
 * Processes icons for each category and returns an array of CoMapeoIcon objects.
 * @param folder - Optional Google Drive folder to save icons
 * @returns Array of CoMapeoIcon objects
 */
function processIcons(folder?: GoogleAppsScript.Drive.Folder, suffixes: string[] = []): CoMapeoIcon[] {
  console.log("Starting icon processing");
  const { categories, backgroundColors, iconUrls, categoriesSheet } = getCategoryData();
  return categories.reduce((icons: CoMapeoIcon[], category, index) => {
    const [name, , , icon] = category;
    const backgroundColor = backgroundColors[index][0];
    const iconImage = iconUrls[index][0];

    console.log(`Processing icon for category: ${name}`);
    const iconSvg = processIconImage(name, iconImage, backgroundColor);
    let iconUrl = iconSvg;

    if (folder) {
      iconUrl = saveIconToFolder(folder, name, iconSvg, suffixes);
    }

    console.log(`Updating icon URL in sheet for: ${name}`);
    updateIconUrlInSheet(categoriesSheet, index + 2, 2, iconUrl);

    icons.push({
      name: slugify(name),
      svg: iconSvg
    });

    console.log(`Finished processing icon for: ${name}`);
    return icons;
  }, []);
}

function getCategoryData() {
  const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  const categories = categoriesSheet.getRange(2, 1, categoriesSheet.getLastRow() - 1, 4).getValues();
  const backgroundColors = categoriesSheet.getRange(2, 2, categories.length, 1).getBackgrounds();
  const iconUrls = categoriesSheet.getRange(2, 2, categories.length, 1).getValues();

  return { categories, backgroundColors, iconUrls, categoriesSheet };
}

function processIconImage(name: string, iconImage: any, backgroundColor: string): string {
  if (isGoogleDriveIcon(iconImage)) {
    console.log(`Using existing Google Drive icon for ${name}: ${iconImage}`);
    return iconImage;
  } else if (isCellImage(iconImage)) {
    return processCellImage(name, iconImage, backgroundColor);
  } else {
    console.log(`Generating new icon for ${name}`);
    return generateNewIcon(name, backgroundColor);
  }
}

function isGoogleDriveIcon(iconImage: any): boolean {
  return typeof iconImage === 'string' && iconImage.startsWith('https://drive.google.com');
}

function isCellImage(iconImage: any): boolean {
  return typeof iconImage === 'object' && iconImage.toString() === 'CellImage';
}

function processCellImage(name: string, iconImage: any, backgroundColor: string): string {
  const iconUrl = iconImage.getUrl();
  console.log(`Processing cell image icon for ${name}: ${iconUrl}`);
  let generateData = getGenerateData(iconUrl, backgroundColor);
  if (generateData) {
    return generateData[0].svg;
  } else {
    console.log(`Failed to process cell image. Generating new icon for ${name}`);
    return generateNewIcon(name, backgroundColor);
  }
}

function saveIconToFolder(folder: GoogleAppsScript.Drive.Folder, name: string, iconSvg: string, suffixes: string[]): string {
  console.log(`Saving icon to folder for ${name}:`, iconSvg);

  const { iconContent, mimeType } = getIconContent({ svg: iconSvg, name: slugify(name) });

  if (!iconContent) {
    console.error('Failed to get icon content');
    return '';
  }

  let files: GoogleAppsScript.Drive.File[] = [];
  if (suffixes.length > 0) {
    suffixes.forEach(suffix => {
      const file = createIconFile(folder, slugify(name), suffix.replace('-', ''), iconContent, mimeType);
      files.push(file);
    });
  } else {
    const file = createIconFile(folder, slugify(name), '', iconContent, mimeType);
    files.push(file);
  }
  const file = files[0]; // Use the first file for compatibility with existing code
  console.log(`Saved icon to folder: ${file.getUrl()}`);
  return file.getUrl();
}

function getIconContent(icon: CoMapeoIcon): { iconContent: string | null, mimeType: string } {
  if (icon.svg.startsWith('data:image/svg+xml')) {
    // Handle both plain and base64 encoded data URIs
    let iconContent: string;
    if (icon.svg.includes(';base64,')) {
      // Base64 encoded data URI
      const base64Data = icon.svg.replace(/^data:image\/svg\+xml;base64,/, '');
      iconContent = Utilities.newBlob(Utilities.base64Decode(base64Data)).getDataAsString();
    } else {
      // Plain data URI (URL-encoded)
      iconContent = decodeURIComponent(icon.svg.replace(/^data:image\/svg\+xml,/, ''));
    }
    return {
      iconContent,
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

function updateIconUrlInSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet, row: number, col: number, iconUrl: string) {
  if (iconUrl) {
    sheet.getRange(row, col).setValue(iconUrl);
    console.log(`Updated icon URL in sheet: ${sheet.getRange(row, col).getValue()}`);
  } else {
    console.warn(`Failed to save icon URL for ${sheet.getRange(row, col).getValue()}`);
  }
}

// Import necessary functions from iconGenerator.ts
function generateNewIcon(name: string, backgroundColor: string): string {
  const preset = {
    icon: slugify(name),
    color: backgroundColor,
    name: name
  };
  const generatedIcon = getIconForPreset(preset);
  return generatedIcon ? generatedIcon.svg : '';
}

function getIconForPreset(preset: Partial<CoMapeoPreset>): CoMapeoIcon | null {
  const searchParams = getSearchParams(preset.name);
  let searchData = findValidSearchData(searchParams);

  while (!searchData) {
    console.log(`Retrying search for ${preset.name}`);
    searchData = findValidSearchData(searchParams);
  }

  if (searchData) {
    const generateData = getGenerateData(searchData[0], preset.color);
    if (generateData) {
      return {
        name: preset.icon,
        svg: generateData[0].svg
      };
    }
  }
  return null;
}

function getSearchParams(name: string): string[] {
  const nameOptions = name.split(' ');
  const extraNameOptions = name.split('-');
  return [name, ...nameOptions, ...extraNameOptions, 'marker'];
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
