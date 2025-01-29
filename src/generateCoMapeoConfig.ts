function generateCoMapeoConfig() {
  showProcessingModalDialog(processingDialogTexts[0][locale])
  console.log('Generating CoMapeo config...');
  showProcessingModalDialog(processingDialogTexts[1][locale])
  console.log('Auto translating...');
  autoTranslateSheets();
  console.log('Linting CoMapeo config...');
  showProcessingModalDialog(processingDialogTexts[2][locale])
  lintAllSheets();
  const data = getSpreadsheetData();
  showProcessingModalDialog(processingDialogTexts[3][locale])
  const config = processDataForCoMapeo(data);
  showProcessingModalDialog(processingDialogTexts[4][locale])
  const { id } = saveConfigToDrive(config);
  showProcessingModalDialog(processingDialogTexts[5][locale])
  console.log("Zipping folder ID: " + id);
  showProcessingModalDialog(processingDialogTexts[6][locale])
  const folderZip = saveDriveFolderToZip(id);
  const configUrl = sendDataToApiAndGetZip(folderZip, config.metadata);
  showProcessingModalDialog(processingDialogTexts[7][locale])
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
