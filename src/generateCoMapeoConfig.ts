/**
 * Generates a CoMapeo configuration file from the spreadsheet data.
 * v2.0.0 - Uses JSON-only API, no ZIP workflow
 */
function generateCoMapeoConfig() {
  try {
    // Step 1: Initialize
    showProcessingModalDialog(processingDialogTexts[0][locale]);
    console.log('Generating CoMapeo config v2.0.0...');

    // Step 2: Auto translate
    showProcessingModalDialog(processingDialogTexts[1][locale]);
    console.log('Auto translating...');
    autoTranslateSheets();

    // Step 3: Lint (passing false to prevent UI alerts)
    console.log('Linting CoMapeo config...');
    showProcessingModalDialog(processingDialogTexts[2][locale]);
    lintAllSheets(false);

    // Step 4: Get data
    const data = getSpreadsheetData();
    showProcessingModalDialog(processingDialogTexts[3][locale]);

    // Step 5: Create build payload (JSON)
    showProcessingModalDialog(processingDialogTexts[4][locale]);
    console.log('Creating build payload...');
    const buildRequest = createBuildPayload(data);

    // Log category selection for verification
    console.log('Category selection order:', getCategorySelection());

    // Step 6: Send to API (JSON mode)
    showProcessingModalDialog(processingDialogTexts[5][locale]);
    console.log('Sending JSON request to API...');
    const configUrl = sendBuildRequest(buildRequest);

    // Step 7: Show success dialog
    showProcessingModalDialog(processingDialogTexts[7][locale]);
    showConfigurationGeneratedDialog(configUrl);
  } catch (error) {
    console.error('Error generating CoMapeo config:', error);

    const ui = SpreadsheetApp.getUi();
    ui.alert(
      "Error Generating CoMapeo Category",
      "An error occurred while generating the CoMapeo category: " + error.message +
      "\n\nPlease try again. If the problem persists, contact support.",
      ui.ButtonSet.OK
    );
  }
}
