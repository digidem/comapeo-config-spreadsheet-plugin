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
