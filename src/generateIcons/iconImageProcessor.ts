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

function saveIconToFolder(folder: GoogleAppsScript.Drive.Folder, name: string, iconSvg: string): string {
  console.log(`Saving icon to folder for ${name}:`, iconSvg);
  
  const fileName = `${slugify(name)}.svg`;
  let blob: GoogleAppsScript.Base.Blob;

  if (iconSvg.startsWith('http')) {
    const response = UrlFetchApp.fetch(iconSvg);
    blob = response.getBlob().setName(fileName);
  } else {
    blob = Utilities.newBlob(iconSvg, MimeType.SVG, fileName);
  }

  const file = folder.createFile(blob);
  console.log(`Saved icon to folder: ${file.getUrl()}`);
  return file.getUrl();
}

function processIcons(folder?: GoogleAppsScript.Drive.Folder): CoMapeoIcon[] {
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
      console.log(`Saving icon to folder for: ${name}`);
      iconUrl = saveIconToFolder(folder, name, iconSvg);
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

function updateIconUrlInSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet, row: number, col: number, iconUrl: string) {
  if (iconUrl) {
    sheet.getRange(row, col).setValue(iconUrl);
    console.log(`Updated icon URL in sheet: ${sheet.getRange(row, col).getValue()}`);
  } else {
    console.warn(`Failed to save icon URL for ${sheet.getRange(row, col).getValue()}`);
  }
}
