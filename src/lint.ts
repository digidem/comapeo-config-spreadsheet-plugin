// Import slugify function from utils
/// <reference path="./utils.ts" />

// Helper functions
function capitalizeFirstLetter(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function validateAndCapitalizeCommaList(value: string): string {
  if (!value || typeof value !== "string") return "";
  return value
    .split(",")
    .map((item) => capitalizeFirstLetter(item.trim()))
    .filter((item) => item)
    .join(", ");
}

function setInvalidCellBackground(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  row: number,
  col: number,
  color: string,
): void {
  sheet.getRange(row, col).setBackground(color);
}

function isEmptyOrWhitespace(value: any): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
}

function cleanWhitespaceOnlyCells(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  startRow: number,
  startCol: number,
  numRows: number,
  numCols: number,
): void {
  const range = sheet.getRange(startRow, startCol, numRows, numCols);
  const values = range.getValues();
  let changesMade = false;

  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < values[i].length; j++) {
      const value = values[i][j];
      if (typeof value === "string" && value.trim() === "" && value !== "") {
        values[i][j] = "";
        changesMade = true;
      }
    }
  }

  if (changesMade) {
    range.setValues(values);
    console.log(`Cleaned whitespace-only cells in ${sheet.getName()}`);
  }
}

function checkForDuplicates(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  columnIndex: number,
  startRow: number = 2,
): void {
  const lastRow = sheet.getLastRow();
  if (lastRow <= startRow) return;

  const range = sheet.getRange(
    startRow,
    columnIndex,
    lastRow - startRow + 1,
    1,
  );
  const values = range
    .getValues()
    .map((row) => row[0].toString().trim().toLowerCase());
  const duplicates = new Map<string, number[]>();

  values.forEach((value, index) => {
    if (value === "") return;

    if (!duplicates.has(value)) {
      duplicates.set(value, [index + startRow]);
    } else {
      duplicates.get(value)?.push(index + startRow);
    }
  });

  // Highlight duplicates
  duplicates.forEach((rows, value) => {
    if (rows.length > 1) {
      console.log(
        'Found duplicate value "' + value + '" in rows: ' + rows.join(", "),
      );
      for (let i = 0; i < rows.length; i++) {
        sheet.getRange(rows[i], columnIndex).setBackground("#FFC7CE"); // Light red
      }
    }
  });
}

// Generic linting function
function lintSheet(
  sheetName: string,
  columnValidations: ((value: string, row: number, col: number) => void)[],
  requiredColumns: number[] = [],
): void {
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
    cleanWhitespaceOnlyCells(
      sheet,
      2,
      1,
      lastRow - 1,
      columnValidations.length,
    );
    console.timeEnd(`Cleaning whitespace cells for ${sheetName}`);

    // Check for duplicates in the first column (usually the name/identifier column)
    console.time(`Checking for duplicates in ${sheetName}`);
    checkForDuplicates(sheet, 1);
    console.timeEnd(`Checking for duplicates in ${sheetName}`);

    console.time(`Getting data for ${sheetName}`);
    // Get all data from the sheet, excluding the header row
    const data = sheet
      .getRange(2, 1, lastRow - 1, columnValidations.length)
      .getValues();
    console.timeEnd(`Getting data for ${sheetName}`);

    console.time(`Validating cells for ${sheetName}`);
    // Iterate through each cell and apply the corresponding validation function
    data.forEach((row, rowIndex) => {
      // Check for required fields
      requiredColumns.forEach((colIndex) => {
        if (isEmptyOrWhitespace(row[colIndex])) {
          sheet.getRange(rowIndex + 2, colIndex + 1).setBackground("#FFF2CC"); // Light yellow for required fields
        }
      });

      // Apply validations
      row.forEach((cellValue, colIndex) => {
        if (columnValidations[colIndex]) {
          columnValidations[colIndex](
            String(cellValue || ""),
            rowIndex + 2,
            colIndex + 1,
          );
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
          SpreadsheetApp.getActiveSpreadsheet()
            .getSheetByName("Categories")
            ?.getRange(row, col)
            .setValue(capitalizedValue);
        } catch (error) {
          console.error(
            "Error capitalizing value in Categories sheet at row " +
              row +
              ", col " +
              col +
              ":",
            error,
          );
        }
      }
    },
    // Rule 2: Validate icon URL - must not be empty/whitespace and must be valid Google Drive URL
    (value, row, col) => {
      try {
        // Check if icon is missing or whitespace-only
        if (isEmptyOrWhitespace(value)) {
          console.log("Missing icon at row " + row);
          SpreadsheetApp.getActiveSpreadsheet()
            .getSheetByName("Categories")
            ?.getRange(row, col)
            .setBackground("#FFC7CE"); // Light red for missing required icon
          return;
        }

        // Validate URL format
        function getIdFromUrl(url: string): string | null {
          const match = url.match(/[-\w]{25,}/);
          return match ? match[0] : null;
        }
        const isValidGoogleDriveUrl = (url: string): boolean => {
          return (
            url.startsWith("https://drive.google.com/") &&
            getIdFromUrl(url) !== null
          );
        };

        if (!isValidGoogleDriveUrl(value)) {
          console.log("Invalid icon URL: " + value);
          SpreadsheetApp.getActiveSpreadsheet()
            .getSheetByName("Categories")
            ?.getRange(row, col)
            .setFontColor("red");
        }
      } catch (error) {
        console.error(
          "Error validating icon URL in Categories sheet at row " +
            row +
            ", col " +
            col +
            ":",
          error,
        );
      }
    },
    // Rule 3: Validate comma-separated fields list
    (value, row, col) => {
      if (isEmptyOrWhitespace(value)) return;

      try {
        // Validate that each field in the comma-separated list exists in the Details sheet
        const detailsSheet =
          SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details");
        if (detailsSheet) {
          const detailsData = detailsSheet
            .getRange(2, 1, detailsSheet.getLastRow() - 1, 1)
            .getValues();
          const detailNames = detailsData
            .map((row) => slugify(String(row[0])))
            .filter((name) => name);

          const fields = value.split(",").map((field) => slugify(field.trim()));
          const invalidFields = fields.filter(
            (field) => field && !detailNames.includes(field),
          );

          if (invalidFields.length > 0) {
            console.log(
              "Invalid fields in row " + row + ": " + invalidFields.join(", "),
            );
            SpreadsheetApp.getActiveSpreadsheet()
              .getSheetByName("Categories")
              ?.getRange(row, col)
              .setBackground("#FFC7CE");
          }
        }
      } catch (error) {
        console.error(
          "Error validating fields in Categories sheet at row " +
            row +
            ", col " +
            col +
            ":",
          error,
        );
      }
    },
  ];

  // Category name and icon are required
  lintSheet("Categories", categoriesValidations, [0, 1]);
}

function lintDetailsSheet(): void {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details");
  if (!sheet) {
    console.log("Details sheet not found");
    return;
  }

  const detailsValidations = [
    // Rule 1: Capitalize the first letter of the detail name
    (value, row, col) => {
      if (isEmptyOrWhitespace(value)) return;

      const capitalizedValue = capitalizeFirstLetter(value);
      if (capitalizedValue !== value) {
        try {
          SpreadsheetApp.getActiveSpreadsheet()
            .getSheetByName("Details")
            ?.getRange(row, col)
            .setValue(capitalizedValue);
        } catch (error) {
          console.error(
            "Error capitalizing detail name at row " +
              row +
              ", col " +
              col +
              ":",
            error,
          );
        }
      }
    },
    // Rule 2: Capitalize the first letter of the helper text
    (value, row, col) => {
      if (isEmptyOrWhitespace(value)) return;

      const capitalizedValue = capitalizeFirstLetter(value);
      if (capitalizedValue !== value) {
        try {
          SpreadsheetApp.getActiveSpreadsheet()
            .getSheetByName("Details")
            ?.getRange(row, col)
            .setValue(capitalizedValue);
        } catch (error) {
          console.error(
            "Error capitalizing helper text at row " +
              row +
              ", col " +
              col +
              ":",
            error,
          );
        }
      }
    },
    // Rule 3: Validate the type column (t, n, m, blank, s, or select* are valid)
    (value, row, col) => {
      // Type column validation logic:
      // - blank/empty → selectOne (valid)
      // - "s*" (select, single, etc.) → selectOne (valid)
      // - "m*" (multi, multiple, etc.) → selectMultiple (valid)
      // - "n*" (number, numeric, etc.) → number (valid)
      // - "t*" (text, textual, etc.) → text (valid)
      // - Any other value → invalid

      // Empty/blank is valid (defaults to selectOne)
      if (isEmptyOrWhitespace(value)) {
        return;
      }

      const firstChar = value.toLowerCase().charAt(0);
      const validTypes = ["t", "n", "m", "s"];

      if (!validTypes.includes(firstChar)) {
        try {
          console.log("Invalid type '" + value + "' at row " + row);
          setInvalidCellBackground(
            SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details")!,
            row,
            col,
            "#FFC7CE",
          ); // Light red for invalid type
        } catch (error) {
          console.error(
            "Error highlighting invalid type at row " +
              row +
              ", col " +
              col +
              ":",
            error,
          );
        }
      }
    },
    // Rule 4: Validate options column
    (value, row, col) => {
      try {
        // Get the type from column 3 (index 2) to determine if options are required
        const typeValue = sheet.getRange(row, 3).getValue();
        const typeStr = String(typeValue || "").trim();

        // Determine if this is a select field (requires options)
        const isSelectField = (() => {
          if (isEmptyOrWhitespace(typeStr)) return true; // blank → selectOne
          const firstChar = typeStr.toLowerCase().charAt(0);
          return firstChar === "s" || firstChar === "m"; // s* → selectOne, m* → selectMultiple
        })();

        if (isSelectField) {
          // Select fields MUST have options
          if (isEmptyOrWhitespace(value)) {
            console.log(
              "Select field at row " + row + " is missing required options",
            );
            setInvalidCellBackground(sheet, row, col, "#FFC7CE"); // Light red for missing options
            return;
          }

          // Validate that options are non-empty after trimming
          const options = value
            .split(",")
            .map((opt) => opt.trim())
            .filter((opt) => opt !== "");

          if (options.length === 0) {
            console.log(
              "Select field at row " + row + " has empty options after trimming",
            );
            setInvalidCellBackground(sheet, row, col, "#FFC7CE"); // Light red for empty options
            return;
          }

          // Capitalize and format the options
          const capitalizedList = validateAndCapitalizeCommaList(value);
          if (capitalizedList !== value) {
            sheet.getRange(row, col).setValue(capitalizedList);
          }
        } else {
          // For number/text fields, just capitalize if options are provided (optional warning could be added here)
          if (!isEmptyOrWhitespace(value)) {
            const capitalizedList = validateAndCapitalizeCommaList(value);
            if (capitalizedList !== value) {
              sheet.getRange(row, col).setValue(capitalizedList);
            }
          }
        }
      } catch (error) {
        console.error(
          "Error validating options at row " + row + ", col " + col + ":",
          error,
        );
      }
    },
  ];

  // Detail name and type are required fields
  lintSheet("Details", detailsValidations, [0, 2]);
}

function lintTranslationSheets(): void {
  const translationSheets = sheets(true);
  translationSheets.forEach((sheetName) => {
    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      console.error(`Sheet "${sheetName}" not found`);
      return;
    }

    try {
      console.log("Linting translation sheet: " + sheetName);

      // First clean any whitespace-only cells
      cleanWhitespaceOnlyCells(
        sheet,
        1,
        1,
        sheet.getLastRow(),
        sheet.getLastColumn(),
      );

      // Get all data from the sheet
      const data = sheet.getDataRange().getValues();
      // Capitalize the first letter of each cell if it's a string and not empty
      const updatedData = data.map((row) =>
        row.map((cell) =>
          typeof cell === "string" && cell.trim() !== ""
            ? capitalizeFirstLetter(cell)
            : cell,
        ),
      );

      // Update the sheet with the capitalized data
      sheet.getDataRange().setValues(updatedData);
      console.log("Finished linting translation sheet: " + sheetName);
    } catch (error) {
      console.error(
        "Error linting translation sheet " + sheetName + ":",
        error,
      );
    }
  });

  // After basic linting, validate translation sheet consistency
  validateTranslationSheetConsistency();
}

/**
 * Validates that translation sheets have consistent headers and row counts with their source sheets.
 */
function validateTranslationSheetConsistency(): void {
  console.log("Validating translation sheet consistency...");

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  try {
    // Validate Category Translations
    const categoriesSheet = spreadsheet.getSheetByName("Categories");
    const categoryTranslationsSheet = spreadsheet.getSheetByName(
      "Category Translations",
    );

    if (categoriesSheet && categoryTranslationsSheet) {
      validateSheetConsistency(
        categoriesSheet,
        categoryTranslationsSheet,
        "Category Translations",
        false,
      );
    }

    // Validate Detail translations
    const detailsSheet = spreadsheet.getSheetByName("Details");

    if (detailsSheet) {
      const detailLabelTranslations = spreadsheet.getSheetByName(
        "Detail Label Translations",
      );
      const detailHelperTranslations = spreadsheet.getSheetByName(
        "Detail Helper Text Translations",
      );
      const detailOptionTranslations = spreadsheet.getSheetByName(
        "Detail Option Translations",
      );

      if (detailLabelTranslations) {
        validateSheetConsistency(
          detailsSheet,
          detailLabelTranslations,
          "Detail Label Translations",
          false,
        );
      }

      if (detailHelperTranslations) {
        validateSheetConsistency(
          detailsSheet,
          detailHelperTranslations,
          "Detail Helper Text Translations",
          false,
        );
      }

      if (detailOptionTranslations) {
        validateSheetConsistency(
          detailsSheet,
          detailOptionTranslations,
          "Detail Option Translations",
          true, // Special handling for option count validation
        );
      }
    }

    console.log("Translation sheet consistency validation complete");
  } catch (error) {
    console.error("Error validating translation sheet consistency:", error);
  }
}

/**
 * Validates consistency between a source sheet and its translation sheet.
 *
 * @param sourceSheet - The source sheet (Categories or Details)
 * @param translationSheet - The translation sheet to validate
 * @param translationSheetName - Name for logging
 * @param validateOptionCounts - Whether to validate option counts (for Detail Option Translations)
 */
function validateSheetConsistency(
  sourceSheet: GoogleAppsScript.Spreadsheet.Sheet,
  translationSheet: GoogleAppsScript.Spreadsheet.Sheet,
  translationSheetName: string,
  validateOptionCounts: boolean,
): void {
  console.log(
    `Validating consistency for ${translationSheetName} against ${sourceSheet.getName()}`,
  );

  try {
    // Check row count consistency (excluding header)
    const sourceRowCount = sourceSheet.getLastRow();
    const translationRowCount = translationSheet.getLastRow();

    if (sourceRowCount !== translationRowCount) {
      console.warn(
        `Row count mismatch in ${translationSheetName}: ` +
          `Source has ${sourceRowCount} rows, translation has ${translationRowCount} rows`,
      );

      // Highlight the discrepancy in the translation sheet
      const lastRow = translationSheet.getLastRow();
      if (lastRow > 0) {
        translationSheet
          .getRange(1, 1, Math.min(lastRow, 1), 1)
          .setBackground("#FFF2CC"); // Light yellow warning
      }
    }

    // Validate option counts for Detail Option Translations
    if (validateOptionCounts && sourceRowCount > 1) {
      const detailsSheet =
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details");
      if (!detailsSheet) return;

      // Get the options column (column 4) from Details sheet
      const detailsData = detailsSheet
        .getRange(2, 4, sourceRowCount - 1, 1)
        .getValues();

      // Get all translation data
      const translationData = translationSheet
        .getRange(2, 1, translationRowCount - 1, translationSheet.getLastColumn())
        .getValues();

      // Validate each row
      for (let i = 0; i < Math.min(detailsData.length, translationData.length); i++) {
        const sourceOptions = String(detailsData[i][0] || "").trim();
        if (!sourceOptions) continue; // Skip if no options in source

        const sourceOptionCount = sourceOptions
          .split(",")
          .map((opt) => opt.trim())
          .filter((opt) => opt !== "").length;

        // Check each translation column (starting from column 4, after Name, ISO, Source columns)
        for (let col = 3; col < translationData[i].length; col++) {
          const translatedOptions = String(translationData[i][col] || "").trim();
          if (!translatedOptions) continue;

          const translatedOptionCount = translatedOptions
            .split(",")
            .map((opt) => opt.trim())
            .filter((opt) => opt !== "").length;

          if (sourceOptionCount !== translatedOptionCount) {
            console.warn(
              `Option count mismatch in ${translationSheetName} at row ${i + 2}, column ${col + 1}: ` +
                `Expected ${sourceOptionCount} options, found ${translatedOptionCount}`,
            );

            // Highlight the mismatched cell
            translationSheet
              .getRange(i + 2, col + 1)
              .setBackground("#FFC7CE"); // Light red for mismatch
          }
        }
      }
    }
  } catch (error) {
    console.error(
      `Error validating ${translationSheetName} consistency:`,
      error,
    );
  }
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
          "- Yellow highlighted cells: Required fields that are missing or translation row count mismatches\n" +
          "- Red highlighted cells: Invalid values, missing icons, or missing select field options\n" +
          "- Red text: Invalid URLs\n" +
          "- Pink highlighted cells: Duplicate values, invalid references, or option count mismatches in translations",
        ui.ButtonSet.OK,
      );
    }
  } catch (error) {
    console.error("Error during linting process:", error);

    // Only show error alert if showAlerts is true
    if (showAlerts) {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        "Linting Error",
        "An error occurred during the linting process: " +
          error.message +
          "\n\nSome sheets may not have been fully processed.",
        ui.ButtonSet.OK,
      );
    }
  }
}
