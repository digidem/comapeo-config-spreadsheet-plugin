/**
 * Process icons for categories and generate or use existing icons.
 * @param folder - Optional Google Drive folder to store generated icons
 * @returns Array of CoMapeoIcon objects
 */
function processIcons(folder?: GoogleAppsScript.Drive.Folder): CoMapeoIcon[] {
  const { categories, backgroundColors, iconUrls, categoriesSheet } = getCategoryData();
  const iconFolder = createIconFolder(folder);

  return categories.reduce((icons: CoMapeoIcon[], category, index) => {
    const [name, , , icon] = category;
    const backgroundColor = backgroundColors[index][0];
    const iconImage = iconUrls[index][0];

    const iconSvg = processIconImage(categoriesSheet, name, iconImage, backgroundColor, index);
    
    if (iconFolder) {
      saveIconToFolder(iconFolder, name, iconSvg);
    }

    icons.push({
      name: slugify(name),
      svg: iconSvg
    });

    return icons;
  }, []);
}

/**
 * Retrieve category data from the spreadsheet.
 * @returns Object containing category data, background colors, icon URLs, and sheet reference
 */
function getCategoryData() {
  const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  const categories = categoriesSheet.getRange(2, 1, categoriesSheet.getLastRow() - 1, 4).getValues();
  const backgroundColors = categoriesSheet.getRange(2, 2, categories.length, 1).getBackgrounds();
  const iconUrls = categoriesSheet.getRange(2, 2, categories.length, 1).getValues();

  return { categories, backgroundColors, iconUrls, categoriesSheet };
}

/**
 * Create a folder for storing icons if a parent folder is provided.
 * @param folder - Optional parent folder
 * @returns Created icon folder or undefined
 */
function createIconFolder(folder?: GoogleAppsScript.Drive.Folder): GoogleAppsScript.Drive.Folder | undefined {
  return folder ? folder.createFolder('icons') : undefined;
}

/**
 * Process the icon image based on its type and generate or use existing icon.
 * @param name - Category name
 * @param iconImage - Icon image data
 * @param backgroundColor - Background color for the icon
 * @returns SVG string of the processed icon
 */
function processIconImage(categoriesSheet: GoogleAppsScript.Spreadsheet.Sheet, name: string, iconImage: any, backgroundColor: string, index: number): string {
  if (isGoogleDriveIcon(iconImage)) {
    console.log(`Using existing Google Drive icon for ${name}: ${iconImage}`);
    return iconImage;
  } else if (isCellImage(iconImage)) {
    return processCellImage(name, iconImage, backgroundColor);
  } else {
    console.log(`Generating new icon for ${name}`);
    const iconSvg = generateNewIcon(name, backgroundColor);
    updateIconUrlInSheet(categoriesSheet, index + 2, 2, iconSvg);
    return iconSvg;
  }
}

/**
 * Check if the icon is a Google Drive URL.
 * @param iconImage - Icon image data
 * @returns Boolean indicating if it's a Google Drive icon
 */
function isGoogleDriveIcon(iconImage: any): boolean {
  return typeof iconImage === 'string' && iconImage.startsWith('https://drive.google.com');
}

/**
 * Check if the icon is a cell image.
 * @param iconImage - Icon image data
 * @returns Boolean indicating if it's a cell image
 */
function isCellImage(iconImage: any): boolean {
  return typeof iconImage === 'object' && iconImage.toString() === 'CellImage';
}

/**
 * Process a cell image and generate an icon.
 * @param name - Category name
 * @param iconImage - Cell image data
 * @param backgroundColor - Background color for the icon
 * @returns SVG string of the processed icon
 */
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

/**
 * Save the icon SVG to a folder.
 * @param folder - Folder to save the icon
 * @param name - Category name
 * @param iconSvg - SVG string of the icon
 */
function saveIconToFolder(folder: GoogleAppsScript.Drive.Folder, name: string, iconSvg: string): void {
  const blob = Utilities.newBlob(iconSvg, MimeType.SVG, `${slugify(name)}.svg`);
  folder.createFile(blob);
}

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

function fetchSearchData(param: string): any[] | null {
  const searchUrl = `https://icons.earthdefenderstoolkit.com/api/search?s=${encodeURIComponent(param)}&l=en`;
  const searchOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "get",
    muteHttpExceptions: true
  };
  try {
    const searchResponse = UrlFetchApp.fetch(searchUrl, searchOptions);
    return JSON.parse(searchResponse.getContentText());
  } catch (error) {
    console.warn(`Didn't find icon for ${param}`, error);
    return null;
  }
}

function getGenerateData(pngUrl: string, color: string): any[] | null {
  const generateUrl = `https://icons.earthdefenderstoolkit.com/api/generate?image=${encodeURIComponent(pngUrl)}&color=${encodeURIComponent(color.split('#')[1])}`;
  const generateOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "get",
    muteHttpExceptions: true
  };
  try {
    const generateResponse = UrlFetchApp.fetch(generateUrl, generateOptions);
    const generateData = JSON.parse(generateResponse.getContentText());
    if (Array.isArray(generateData) && generateData.length > 0 && generateData[0].svg) {
      return generateData;
    }
  } catch (error) {
    console.warn(`Failed to generate icon`, error);
  }
  return null;
}

function updateIconUrlInSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet, row: number, col: number, svgUrl: string) {
  if (svgUrl) {
    sheet.getRange(row, col).setValue(svgUrl);
    console.log(`Updated icon URL in sheet: ${sheet.getRange(row, col).getValue()}`);
  } else {
    console.warn(`Failed to save SVG URL for ${sheet.getRange(row, col).getValue()}`);
  }
}