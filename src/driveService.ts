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

function showDownloadLink(fileUrl: string) {
  // Create a simple dialog in the Spreadsheet UI
  const html = '<a href="' + fileUrl + '" target="_blank">Download Processed ZIP File</a>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html), 'Download ZIP');
}
