function saveZipToDrive(zipBlob) {
  var folder = DriveApp.getRootFolder();  // Save to root folder
  var fileName = "Processed_Data.zip";
  var zipFile = folder.createFile(zipBlob).setName(fileName);
  
  // Generate a download link
  var fileUrl = zipFile.getUrl();
  Logger.log("Download the ZIP file here: " + fileUrl);

  // Optionally send the link to the user via email or show in the UI
  return fileUrl;
}

function showDownloadLink() {
  // var fileUrl = sendDataToApiAndGetZip();  // Send data and get the ZIP download link
  var fileUrl = sendDataToConvertApiAndGetZip();  // Send data and get the ZIP download link
  // Create a simple dialog in the Spreadsheet UI
  var html = '<a href="' + fileUrl + '" target="_blank">Download Processed ZIP File</a>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html), 'Download ZIP');
}
