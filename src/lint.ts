// Import slugify function from utils
/// <reference path="./utils.ts" />

const VALID_DETAIL_TYPE = ["text", "number", "single", "multiple"]
const DEFAULT_DETAIL_TYPE = "single"

// Helper functions
function capitalizeFirstLetter(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function validateAndCapitalizeCommaList(value: string): string {
  if (!value || typeof value !== 'string') return '';
  return value.split(',').map(item => capitalizeFirstLetter(item.trim())).filter(item => item).join(', ');
}

function setCellBackground(cell: GoogleAppsScript.Spreadsheet.Range, color: string): void {
  cell.setBackground(color);
}

function setCellTooltip(cell: GoogleAppsScript.Spreadsheet.Range, text: string){
  cell.setNote(text)
}

function isEmptyOrWhitespace(value: any): boolean {
  return value === undefined || value === null ||
         (typeof value === 'string' && value.trim() === '');
}

function cleanWhitespaceOnlyCells(sheet: GoogleAppsScript.Spreadsheet.Sheet, startRow: number, startCol: number, numRows: number, numCols: number): void {
  const range = sheet.getRange(startRow, startCol, numRows, numCols);
  const values = range.getValues();
  let changesMade = false;

  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < values[i].length; j++) {
      const value = values[i][j];
      if (typeof value === 'string' && value.trim() === '' && value !== '') {
        values[i][j] = '';
        changesMade = true;
      }
    }
  }

  if (changesMade) {
    range.setValues(values);
    console.log(`Cleaned whitespace-only cells in ${sheet.getName()}`);
  }
}

function checkForDuplicates(sheet: GoogleAppsScript.Spreadsheet.Sheet, columnIndex: number, startRow: number = 2): void {
  const lastRow = sheet.getLastRow();
  if (lastRow <= startRow) return;

  const range = sheet.getRange(startRow, columnIndex, lastRow - startRow + 1, 1);
  const values = range.getValues().map(row => row[0].toString().trim().toLowerCase());
  const duplicates = new Map<string, number[]>();

  values.forEach((value, index) => {
    if (value === '') return;

    if (!duplicates.has(value)) {
      duplicates.set(value, [index + startRow]);
    } else {
      duplicates.get(value)?.push(index + startRow);
    }
  });

  // Highlight duplicates
  duplicates.forEach((rows, value) => {
    if (rows.length > 1) {
      console.log("Found duplicate value \"" + capitalizeFirstLetter(value) + "\" in rows: " + rows.join(', '));
      for (let i = 0; i < rows.length; i++) {
        const cell = sheet.getRange(rows[i], columnIndex)
        setCellBackground(cell, "#FFC7CE");
        setCellTooltip(cell, duplicateCellText[locale](capitalizeFirstLetter(value), rows.join(', ')))
      }
    }
  });
}

// Generic linting function
function lintSheet(sheetName: string, columnValidations: ((value: string, row: number, col: number) => void)[], requiredColumns: number[] = []): void {
  console.time(`Linting ${sheetName}`);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    console.log(`${sheetName} sheet not found`);
    console.timeEnd(`Linting ${sheetName}`);
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    console.log(`${sheetName} sheet is empty or contains only header`);
    console.timeEnd(`Linting ${sheetName}`);
    return;
  }

  try {
    // First clean any whitespace-only cells
    console.time(`Cleaning whitespace cells for ${sheetName}`);
    cleanWhitespaceOnlyCells(sheet, 2, 1, lastRow - 1, columnValidations.length);
    console.timeEnd(`Cleaning whitespace cells for ${sheetName}`);

    // Check for duplicates in the first column (usually the name/identifier column)
    console.time(`Checking for duplicates in ${sheetName}`);
    checkForDuplicates(sheet, 1);
    console.timeEnd(`Checking for duplicates in ${sheetName}`);

    console.time(`Getting data for ${sheetName}`);
    // Get all data from the sheet, excluding the header row
    const data = sheet.getRange(2, 1, lastRow - 1, columnValidations.length).getValues();
    console.timeEnd(`Getting data for ${sheetName}`);

    console.time(`Validating cells for ${sheetName}`);
    // Iterate through each cell and apply the corresponding validation function
    data.forEach((row, rowIndex) => {
      // Check for required fields
      requiredColumns.forEach(colIndex => {
        if (isEmptyOrWhitespace(row[colIndex])) {
          sheet.getRange(rowIndex + 2, colIndex + 1).setBackground('#FFF2CC'); // Light yellow for required fields
        }
      });

      // Apply validations
      row.forEach((cellValue, colIndex) => {
        if (columnValidations[colIndex]) {
          columnValidations[colIndex](String(cellValue || ''), rowIndex + 2, colIndex + 1);
        }
      });
    });
    console.timeEnd(`Validating cells for ${sheetName}`);

    console.log(`${sheetName} sheet linting completed`);
  } catch (error) {
    console.error(`Error linting ${sheetName} sheet:`, error);
  } finally {
    console.timeEnd(`Linting ${sheetName}`);
  }
}

// Specific sheet linting functions
function lintCategoriesSheet(): void {
  const categoriesValidations = [
    // Rule 1: Capitalize the first letter of the category name
    (value, row, col) => {
      if (isEmptyOrWhitespace(value)) return;

      const capitalizedValue = capitalizeFirstLetter(value);
      if (capitalizedValue !== value) {
        try {
          SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Categories")?.getRange(row, col).setValue(capitalizedValue);
        } catch (error) {
          console.error("Error capitalizing value in Categories sheet at row " + row + ", col " + col + ":", error);
        }
      }
    },
    // Rule 2: Validate URL format and highlight invalid URLs
    (value, row, col) => {
      if (isEmptyOrWhitespace(value)) return;

      function getIdFromUrl(url: string): string | null {
        const match = url.match(/[-\w]{25,}/);
        return match ? match[0] : null;
      }
      const isValidGoogleDriveUrl = (url: string): boolean => {
        return url.startsWith('https://drive.google.com/') && getIdFromUrl(url) !== null;
      };

      try {
        if (!isValidGoogleDriveUrl(value)) {
          console.log("Invalid URL: " + value);
          SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Categories")?.getRange(row, col).setFontColor("red");
        }
      } catch (error) {
        console.error("Error validating URL in Categories sheet at row " + row + ", col " + col + ":", error);
      }
    },
    // Rule 3: Validate comma-separated fields list
    (value, row, col) => {
      if (isEmptyOrWhitespace(value)) return;

      try {
        // Validate that each field in the comma-separated list exists in the Details sheet
        const detailsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details");
        if (detailsSheet) {
          const detailsData = detailsSheet.getRange(2, 1, detailsSheet.getLastRow() - 1, 1).getValues();
          const detailNames = detailsData.map(row => slugify(String(row[0]))).filter(name => name);

          const fields = value.split(',').map(field => slugify(field.trim()));
          const invalidFields = fields.filter(field => field && !detailNames.includes(field));

          if (invalidFields.length > 0) {
            console.log("Invalid fields in row " + row + ": " + invalidFields.join(', '));
            SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Categories")?.getRange(row, col).setBackground("#FFC7CE");
          }
        }
      } catch (error) {
        console.error("Error validating fields in Categories sheet at row " + row + ", col " + col + ":", error);
      }
    }
  ];

  // Category name is required
  lintSheet("Categories", categoriesValidations, [0]);
}

function lintDetailsSheet(): void {
  const detailsValidations = [
    // Rule 1: Capitalize the first letter of the detail name
    (value, row, col) => {
      if (isEmptyOrWhitespace(value)) return;

      const capitalizedValue = capitalizeFirstLetter(value);
      if (capitalizedValue !== value) {
        try {
          SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details")?.getRange(row, col).setValue(capitalizedValue);
        } catch (error) {
          console.error("Error capitalizing detail name at row " + row + ", col " + col + ":", error);
        }
      }
    },
    // Rule 2: Capitalize the first letter of the helper text
    (value, row, col) => {
      if (isEmptyOrWhitespace(value)) return;

      const capitalizedValue = capitalizeFirstLetter(value);
      if (capitalizedValue !== value) {
        try {
          SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details")?.getRange(row, col).setValue(capitalizedValue);
        } catch (error) {
          console.error("Error capitalizing helper text at row " + row + ", col " + col + ":", error);
        }
      }
    },

    // Rule 3: Validate the type column (text, number, multiple or single)
    (value: string, row, col) => {
      const detailsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details")
      const cell = detailsSheet.getRange(row, col)
      // empty, set value to default (single), set color to yellow, and tooltip
      if (isEmptyOrWhitespace(value)) {
        try {
          cell.setValue(DEFAULT_DETAIL_TYPE)
          // Light yellow to signal empty field (set to single choise)
          setCellBackground(cell!, "#FFF2CC");
          setCellTooltip(cell!, emptyCellText[locale] + DEFAULT_DETAIL_TYPE)
        } catch (error) {
          console.error("Error highlighting missing type at row " + row + ", col " + col + ":", error);
        }
        return;
      }else{
          setCellBackground(cell!, "#FFFFFF")
          cell.clearNote()
      }

      if (!VALID_DETAIL_TYPE.includes(value.toLowerCase())) {
        try {
          setCellBackground(cell!, "#FFC7CE")
          setCellTooltip(cell!, invalidOrMissingTypeText[locale])
        } catch (error) {
          console.error("Error highlighting invalid type at row " + row + ", col " + col + ":", error);
        }
      }else{
          setCellBackground(cell!, "#FFFFFF")
          cell.clearNote()
      }
    },
    // Rule 4: Capitalize and format the comma-separated option list
    (value, row, col) => {
      if (isEmptyOrWhitespace(value)) return;

      try {
        const capitalizedList = validateAndCapitalizeCommaList(value);
        if (capitalizedList !== value) {
          SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details")?.getRange(row, col).setValue(capitalizedList);
        }
      } catch (error) {
        console.error("Error formatting options list at row " + row + ", col " + col + ":", error);
      }
    }
  ];

  // Detail name and type are required fields
  lintSheet("Details", detailsValidations, [0, 2]);
}

function lintTranslationSheets(): void {
  const translationSheets = sheets(true);
  translationSheets.forEach(sheetName => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      console.error(`Sheet "${sheetName}" not found`);
      return;
    }

    try {
      console.log("Linting translation sheet: " + sheetName);

      // First clean any whitespace-only cells
      cleanWhitespaceOnlyCells(sheet, 1, 1, sheet.getLastRow(), sheet.getLastColumn());

      // Get all data from the sheet
      const data = sheet.getDataRange().getValues();
      // Capitalize the first letter of each cell if it's a string and not empty
      const updatedData = data.map(row =>
        row.map(cell =>
          typeof cell === 'string' && cell.trim() !== '' ? capitalizeFirstLetter(cell) : cell
        )
      );

      // Update the sheet with the capitalized data
      sheet.getDataRange().setValues(updatedData);
      console.log("Finished linting translation sheet: " + sheetName);
    } catch (error) {
      console.error("Error linting translation sheet " + sheetName + ":", error);
    }
  });
}

/**
 * Main linting function that validates all sheets in the spreadsheet.
 *
 * @param showAlerts - Whether to show UI alerts (default: true). Set to false when called from other functions.
 */
function lintAllSheets(showAlerts: boolean = true): void {
  try {
    console.log("Starting linting process...");

    console.log("Linting Categories sheet...");
    lintCategoriesSheet();

    console.log("Linting Details sheet...");
    lintDetailsSheet();

    console.log("Linting Translation sheets...");
    lintTranslationSheets();

    console.log("Finished linting all sheets.");

    // Add a summary of issues found, but only if showAlerts is true
    if (showAlerts) {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        "Linting Complete",
        "All sheets have been linted. Please check for:\n" +
        "- Yellow highlighted cells: Required fields that are missing\n" +
        "- Red highlighted cells: Invalid values\n" +
        "- Red text: Invalid URLs\n" +
        "- Pink highlighted cells: Duplicate values or invalid references",
        ui.ButtonSet.OK
      );
    }
  } catch (error) {
    console.error("Error during linting process:", error);

    // Only show error alert if showAlerts is true
    if (showAlerts) {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        "Linting Error",
        "An error occurred during the linting process: " + error.message + "\n\nSome sheets may not have been fully processed.",
        ui.ButtonSet.OK
      );
    }
  }
}
