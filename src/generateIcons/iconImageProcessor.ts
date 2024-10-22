function processIconImage(name: string, iconImage: any, backgroundColor: string, index: number): string {
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
  console.log(`Saving icon to folder for ${name}:`¸ iconSvg);
  
  // Check if iconSvg is a URL or SVG content
  if (iconSvg.startsWith('http')) {
    // If it's a URL, fetch the content
    const response = UrlFetchApp.fetch(iconSvg);
    const svgContent = response.getContentText();
    const blob = Utilities.newBlob(svgContent, MimeType.SVG, `${slugify(name)}.svg`);
    const file = folder.createFile(blob);
    console.log(`Saved icon to folder: ${file.getUrl()}`);
    return file.getUrl();
  } else {
    // If it's SVG content, save it directly
    const blob = Utilities.newBlob(iconSvg, MimeType.SVG, `${slugify(name)}.svg`);
    const file = folder.createFile(blob);
    console.log(`Saved icon to folder: ${file.getUrl()}`);
    return file.getUrl();
  }
}
