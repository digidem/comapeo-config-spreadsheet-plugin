function sendDataToApiAndGetZip() {
  var data = getSpreadsheetData();
  var formattedData = JSON.stringify(data);  // Convert to JSON

  // Define the API endpoint
  var apiUrl = "https://example.com/api/process";  // Replace with actual API URL

  // Send the data to the API
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": formattedData
  };

  var response = UrlFetchApp.fetch(apiUrl, options);
  
  // Assuming the API returns a ZIP file in the response body
  var zipBlob = response.getBlob();
  return saveZipToDrive(zipBlob);  // Save the ZIP to Google Drive
}

/**
 * Sends the spreadsheet data to the ConvertAPI to generate a ZIP file containing the converted data.
 * The ZIP file is then saved to Google Drive.
 * @returns {string} The download URL for the ZIP file
 */
function sendDataToConvertApiAndGetZip() {
  const data = getSpreadsheetData();
  const formattedData = JSON.stringify(data);

  // Define the ConvertAPI endpoint and parameters
  const apiUrl = "https://v2.convertapi.com/convert/json/to/zip";
  const apiKey = "secret_NKeUCmzEHVYmbhe8"; // Replace with your actual ConvertAPI key

  // Prepare the payload
  const payload = {
    Parameters: [
      { Name: "File", FileValue: { Name: "data.json", Data: Utilities.base64Encode(formattedData) } },
      { Name: "FileName", Value: "processed_data.zip" }
    ]
  };

  // Send the data to ConvertAPI
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: {
      "Authorization": "Bearer " + apiKey
    }
  };

  const response = UrlFetchApp.fetch(apiUrl, options);
  
  // ConvertAPI returns a JSON response with a download URL for the ZIP file
  const responseData = JSON.parse(response.getContentText());
  const zipFileUrl = responseData.Files[0].Url;

  // Fetch the ZIP file from the provided URL
  const zipBlob = UrlFetchApp.fetch(zipFileUrl).getBlob();
  return saveZipToDrive(zipBlob);
}
