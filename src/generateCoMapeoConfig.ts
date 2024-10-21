function generateCoMapeoConfig() {
  const data = getSpreadsheetData();
  const config = processDataForCoMapeo(data);
  const { id } = saveConfigToDrive(config);
  console.log("Zipping folder ID: " + id);
  const folderZip = saveDriveFolderToZip(id);
  const configUrl = sendDataToApiAndGetZip(folderZip, config.metadata.name);
  showDownloadLink(configUrl);
}

function processDataForCoMapeo(data) {
  console.log('Processing CoMapeo data...');
  const fields = processFields(data);
  console.log(`Done processing ${fields.length} fields`);
  console.log(`Processing presets...`);
  const presets = processPresets(data);
  console.log(`Done processing ${presets.length} presets`);
  console.log('Processing icons...');
  const icons = processIcons(data);
  console.log(`Done processing ${icons.length} icons`);
  console.log('Processing metadata...');
  const { metadata, packageJson } = processMetadata(data);
  console.log('Processing translations...');
  const messages = processTranslations(data, fields, presets);
  console.log(`Done processing ${Object.keys(messages.pt).length} PT and ${Object.keys(messages.es).length} ES messages`);
  console.log('Generating CoMapeo config...');
  return {
    metadata,
    packageJson,
    fields,
    presets,
    icons,
    messages
  };
}
