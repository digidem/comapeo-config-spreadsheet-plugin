function generateCoMapeoConfig() {
  const data = getSpreadsheetData();
  const config = processDataForCoMapeo(data);
  const folderUrl = saveConfigToDrive(config);
  showDownloadLink(folderUrl);
}

function processDataForCoMapeo(data) {
  const fields = processFields(data);
  const presets = processPresets(data);
  return {
    fields,
    presets,
    messages: processTranslations(data, fields, presets)
  };
}
