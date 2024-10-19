function saveZipToDrive(zipBlob) {
  var folder = DriveApp.getRootFolder();  // Save to root folder
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const fileName = `${spreadsheet.getName()}.comapeocat`;
  var zipFile = folder.createFile(zipBlob).setName(fileName);
  
  // Generate a download link
  var fileUrl = zipFile.getUrl();
  Logger.log("Download the ZIP file here: " + fileUrl);

  // Optionally send the link to the user via email or show in the UI
  return fileUrl;
}

function showDownloadLink(fileUrl: string) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Download CoMapeo Configuration</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #e0e0e0;
          background-color: #1a1a1a;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        h1 {
          color: #330B9E;
        }
        p {
          margin-bottom: 20px;
        }
        .download-btn {
          display: inline-block;
          background-color: #330B9E;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          transition: background-color 0.3s ease;
        }
        .download-btn:hover {
          background-color: #330B9E;
        }
      </style>
    </head>
    <body>
      <img src="https://github.com/digidem/comapeo-mobile/blob/develop/assets/splash.png?raw=true" alt="CoMapeo Logo" style="width: 100px; height: 100px; margin-bottom: 20px;">
      <p>Your CoMapeo configuration file has been generated and is ready for download.</p>
      <p>After downloading, please load this file into your CoMapeo application to update your configuration.</p>
      <a href="${fileUrl}" target="_blank" class="download-btn">Download Configuration ZIP</a>
    </body>
    </html>
  `;
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(650).setHeight(400), 'Download CoMapeo Configuration');
}
