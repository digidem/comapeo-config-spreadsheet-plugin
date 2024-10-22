/**
 * Processes icons for each category and returns an array of CoMapeoIcon objects.
 * @param data - Any additional data (unused in this function)
 * @param folder - Optional Google Drive folder to save icons
 * @returns Array of CoMapeoIcon objects
 */
function processIcons(folder?: GoogleAppsScript.Drive.Folder): CoMapeoIcon[] {
  console.log("Starting icon processing");
  const { categories, backgroundColors, iconUrls, categoriesSheet } = getCategoryData();
  return categories.reduce((icons: CoMapeoIcon[], category, index) => {
    const [name, , , icon] = category;
    const backgroundColor = backgroundColors[index][0];
    const iconImage = iconUrls[index][0];

    console.log(`Processing icon for category: ${name}`);
    const iconSvg = processIconImage(name, iconImage, backgroundColor, index);
    let iconUrl = iconSvg;
    console.log(`Folder provided: ${!!folder}`);
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

function createIconFolder(folder?: GoogleAppsScript.Drive.Folder): GoogleAppsScript.Drive.Folder | undefined {
  return folder ? folder.createFolder('icons') : undefined;
}

function updateIconUrlInSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet, row: number, col: number, iconUrl: string) {
  if (iconUrl) {
    sheet.getRange(row, col).setValue(iconUrl);
    console.log(`Updated icon URL in sheet: ${sheet.getRange(row, col).getValue()}`);
  } else {
    console.warn(`Failed to save icon URL for ${sheet.getRange(row, col).getValue()}`);
  }
}
