function sendDataToApiAndGetZip() {
  const data = getSpreadsheetData();
  const formattedData = JSON.stringify(data);

  const apiUrl = "http://builer.comapeo.app/api/v1/jsonBuilder";  // Your API URL

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "post",
    contentType: "application/json",
    payload: formattedData
  };

  const response = UrlFetchApp.fetch(apiUrl, options);
  
  // Handle the ZIP file response
  const zipBlob = response.getBlob();
  return saveZipToDrive(zipBlob);  // Save the ZIP to Google Drive
}
