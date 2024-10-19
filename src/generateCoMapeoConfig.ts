function generateCoMapeoConfig() {
  // Get the spreadsheet data
  const data = getSpreadsheetData();

  // Process the data to create the CoMapeo configuration
  const config = processDataForCoMapeo(data);

  // Convert the config to JSON
  const configJson = JSON.stringify(config, null, 2);

  // Create a blob from the JSON
  const configBlob = Utilities.newBlob(configJson, 'application/json', 'comapeo_config.json');

  // Save the blob to Drive and get the download URL
  const downloadUrl = saveZipToDrive(configBlob);

  // Show the download link
  showDownloadLink(downloadUrl);
}

function processDataForCoMapeo(data) {
  // This is a placeholder function. You'll need to implement the actual logic
  // to transform your spreadsheet data into the CoMapeo configuration format.
  // The exact implementation will depend on your specific requirements and data structure.

  const config = {
    layers: [],
    presets: [],
    fields: []
  };

  // Example: Process Categories sheet
  const categories = data['Categories'].slice(1); // Assuming first row is headers
  categories.forEach(category => {
    config.presets.push({
      id: category[0], // Assuming first column is category ID
      name: category[1], // Assuming second column is category name
      geometry: ['point'], // You might need to adjust this based on your data
      tags: {},
      fields: [] // You'll need to populate this based on your data structure
    });
  });

  // You'll need to add more processing logic here to handle other sheets
  // and create the full CoMapeo configuration

  return config;
}
