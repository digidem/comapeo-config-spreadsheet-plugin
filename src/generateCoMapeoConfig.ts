function generateCoMapeoConfig() {
  console.log('Generating CoMapeo config...');
  console.log('Auto translating...');
  autoTranslateSheets();
  console.log('Linting CoMapeo config...');
  lintAllSheets();
  const data = getSpreadsheetData();
  const config = processDataForCoMapeo(data);
  const { id } = saveConfigToDrive(config);
  console.log(`Zipping folder ID: ${id}`);
  const folderZip = saveDriveFolderToZip(id);
  const configUrl = sendDataToApiAndGetZip(folderZip, config.metadata);
  showConfigurationGeneratedDialog(configUrl);
}

/**
 * Process all the data from the spreadsheet into a CoMapeo configuration object.
 * @param {Object} data - The data from the spreadsheet, including fields, presets, icons, metadata, and translations.
 * @returns {Object} An object with the following properties:
 *   - metadata: The metadata for the CoMapeo configuration, including the dataset ID, name, and version.
 *   - packageJson: The package.json for the CoMapeo configuration, including the dependencies and version.
 *   - fields: An array of CoMapeoField objects, each representing a field in the CoMapeo configuration.
 *   - presets: An array of CoMapeoPreset objects, each representing a preset in the CoMapeo configuration.
 *   - icons: An array of CoMapeoIcon objects, each representing an icon in the CoMapeo configuration.
 *   - messages: An object with two properties, pt and es, each containing an object with translation messages for the corresponding language.
 */
function processDataForCoMapeo(data) {
  console.log('Processing CoMapeo data...');
  const fields = processFields(data);
  console.log(`Done processing ${fields.length} fields`);
  console.log('Processing presets...');
  const presets = processPresets(data);
  console.log(`Done processing ${presets.length} presets`);
  console.log('Processing icons...');
  const icons = processIcons();
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
