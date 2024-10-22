function sendDataToApiAndGetZip(zipFile: GoogleAppsScript.Base.Blob, metadata: { name: string, version: string }) {
  const fileName = `${metadata.name}.comapeocat`
  const apiUrl = "http://137.184.153.36:3000/";
  console.log('Posting zip to API URL:', apiUrl);
  const form = {
    file: zipFile
  };

  console.log('Setting up request options');
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    payload: form,
    muteHttpExceptions: true
  };
  console.log('Sending request to API');
  const response = UrlFetchApp.fetch(apiUrl, options);
  console.log('Response code:', response.getResponseCode());

  if (response.getResponseCode() === 200) {
    const zipBlob = response.getBlob().setName(fileName || "config.comapeocat");
    return saveZipToDrive(zipBlob, metadata.version);  // Save the ZIP to Google Drive
  } else {
    throw new Error(`API request failed with status ${response.getResponseCode()}: ${response.getContentText()}`);
  }
}
