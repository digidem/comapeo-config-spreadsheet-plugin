function testZipToApi() {
    const rootFolder = DriveApp.getRootFolder();
    const files = rootFolder.getFilesByName("test_config.zip");

    if (files.hasNext()) {
      const file = files.next();
      const folderZip = file.getBlob();
      const zipUrl = file.getUrl();
      console.log('Test ZIP URL:', zipUrl);
      const configUrl = sendDataToApiAndGetZip(folderZip, {
        name: 'test_config',
        version: '1.0.0'
      });
      console.log("Test config URL:", configUrl);
    } else {
      console.log("No test_config.zip file found");
    }
}