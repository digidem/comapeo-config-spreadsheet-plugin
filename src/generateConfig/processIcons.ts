function processIcons(data): CoMapeoIcon[] {
  const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  const categories = data['Categories'].slice(1);
  const backgroundColors = categoriesSheet.getRange(2, 2, categories.length, 1).getBackgrounds();
  const iconUrls = categoriesSheet.getRange(2, 2, categories.length, 1).getValues();
  return categories.reduce((icons: CoMapeoIcon[], category, index) => {
    const [name, , , icon] = category;
    const backgroundColor = backgroundColors[index][0];
    const iconImage = iconUrls[index][0];
    if (iconImage && typeof iconImage === 'string' && iconImage.startsWith('https://drive.google.com')) {
      // If it's a Google Drive URL, use it directly
      console.log(`Using existing Google Drive icon for ${name}: ${iconImage}`);
      icons.push({
        name: slugify(name),
        svg: iconImage
      });
    } else if (iconImage && typeof iconImage === 'object' && iconImage.toString() === 'CellImage') {
      // If it's a cell image, get the URL and process it
      const iconUrl = iconImage.getUrl();
      console.log(`Processing cell image icon for ${name}: ${iconUrl}`);
      let generateData = getGenerateData(iconUrl, backgroundColor);
      if (generateData) {
        icons.push({
          name: slugify(name),
          svg: generateData[0].svg
        });
      } else {
        // If generating data from existing cellimage fails, generate a new one
        console.log(`Failed to process cell image. Generating new icon for ${name}`);
        const preset = {
          icon: slugify(name),
          color: backgroundColor,
          name: name
        };
        const generatedIcon = getIconForPreset(preset);
        if (generatedIcon) {
          icons.push(generatedIcon);
          // updateIconUrlInSheet(categoriesSheet, index + 2, 2, generatedIcon.svg);
        }
      }
    } else {
      // If empty or invalid, generate a new icon
      console.log(`Generating new icon for ${name}`);
      const preset = {
        icon: slugify(name),
        color: backgroundColor,
        name: name
      };
      const generatedIcon = getIconForPreset(preset);
      if (generatedIcon) {
        icons.push(generatedIcon);
        updateIconUrlInSheet(categoriesSheet, index + 2, 2, generatedIcon.svg);
      }
    }
    return icons;
  }, []);
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