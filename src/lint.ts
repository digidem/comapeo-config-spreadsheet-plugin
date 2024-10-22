// Helper functions
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function validateAndCapitalizeCommaList(value: string): string {
  return value.split(',').map(item => capitalizeFirstLetter(item.trim())).join(', ');
}

function setInvalidCellBackground(sheet: GoogleAppsScript.Spreadsheet.Sheet, row: number, col: number, color: string): void {
  sheet.getRange(row, col).setBackground(color);
}

// Generic linting function
// Generic linting function
function lintSheet(sheetName: string, columnValidations: ((value: string, row: number, col: number) => void)[]): void {
  console.time(`Linting ${sheetName}`);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) {
    console.log(`${sheetName} sheet not found or empty`);
    console.timeEnd(`Linting ${sheetName}`);
    return;
  }

  console.time(`Getting data for ${sheetName}`);
  // Get all data from the sheet, excluding the header row
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, columnValidations.length).getValues();
  console.timeEnd(`Getting data for ${sheetName}`);

  console.time(`Validating cells for ${sheetName}`);
  // Iterate through each cell and apply the corresponding validation function
  data.forEach((row, rowIndex) => {
    row.forEach((cellValue, colIndex) => {
      if (typeof cellValue === 'string') {
        columnValidations[colIndex](cellValue, rowIndex + 2, colIndex + 1);
      }
    });
  });
  console.timeEnd(`Validating cells for ${sheetName}`);

  console.log(`${sheetName} sheet linting completed`);
  console.timeEnd(`Linting ${sheetName}`);
}

// Specific sheet linting functions
function lintCategoriesSheet(): void {
  const categoriesValidations = [
    // Rule 1: Capitalize the first letter of the category name
    (value, row, col) => {
      const capitalizedValue = capitalizeFirstLetter(value);
      if (capitalizedValue !== value) {
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Categories")!.getRange(row, col).setValue(capitalizedValue);
      }
    },
    // Rule 2: Validate URL format and highlight invalid URLs
    (value, row, col) => {
      function getIdFromUrl(url: string): string | null {
        const match = url.match(/[-\w]{25,}/);
        return match ? match[0] : null;
      }
      const isValidGoogleDriveUrl = (url: string): boolean => {
        return url.startsWith('https://drive.google.com/') && getIdFromUrl(url) !== null;
      };
      console.log(`Is valid Google Drive URL: ${isValidGoogleDriveUrl(value)}`);
      if (value && !isValidGoogleDriveUrl(value)) {
        console.log(`Invalid URL: ${value}`);
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Categories")!.getRange(row, col).setFontColor("red");
      }
      console.log(`Rule 2 executed for value: ${value}, Row: ${row}, Col: ${col}`);
    },
    // Rule 3: Validate tags (column C) without changing them
    // (value, row, col) => {
      // console.time('Rule 3');
      // Validation logic for tags can be added here if needed
      // For now, we're not modifying the tags
      // console.timeEnd('Rule 3');
    // }
  ];

  lintSheet("Categories", categoriesValidations);
}

function lintDetailsSheet(): void {
  const detailsValidations = [
    // Rule 1: Capitalize the first letter of the detail name
    (value, row, col) => {
      const capitalizedValue = capitalizeFirstLetter(value);
      if (capitalizedValue !== value) {
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details")!.getRange(row, col).setValue(capitalizedValue);
      }
    },
    // Rule 2: Capitalize the first letter of the helper text
    (value, row, col) => {
      const capitalizedValue = capitalizeFirstLetter(value);
      if (capitalizedValue !== value) {
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details")!.getRange(row, col).setValue(capitalizedValue);
      }
    },
    // Rule 3: Validate the type column (t, n, or m)
    (value, row, col) => {
      if (value && !['t', 'n', 'm'].includes(value.toLowerCase().charAt(0))) {
        setInvalidCellBackground(SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details")!, row, col, "red");
      }
    },
    // Rule 4: Capitalize and format the comma-separated option list
    (value, row, col) => {
      const capitalizedList = validateAndCapitalizeCommaList(value);
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details")!.getRange(row, col).setValue(capitalizedList);
    }
  ];

  lintSheet("Details", detailsValidations);
}

function lintTranslationSheets(): void {
  const translationSheets = sheets(true);
  translationSheets.forEach(sheetName => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      console.error(`Sheet "${sheetName}" not found`);
      return;
    }

    // Get all data from the sheet
    const data = sheet.getDataRange().getValues();
    // Capitalize the first letter of each cell if it's a string
    const updatedData = data.map(row =>
      row.map(cell =>
        typeof cell === 'string' ? capitalizeFirstLetter(cell) : cell
      )
    );

    // Update the sheet with the capitalized data
    sheet.getDataRange().setValues(updatedData);
  });
}

// Main linting function
function lintAllSheets(): void {
  console.log("Linting Categories sheet...");
  lintCategoriesSheet();
  console.log("Linting Details sheet...");
  lintDetailsSheet();
  console.log("Linting Translation sheets...");
  lintTranslationSheets();
  console.log("Finished linting all sheets.");
  console.log("All sheets linted successfully");
}
