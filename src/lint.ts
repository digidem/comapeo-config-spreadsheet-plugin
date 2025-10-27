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

const LINT_WARNING_BACKGROUND_COLORS = [
  "#FFC7CE",
  "#FFEB9C",
  "#FFFFCC",
  "#FFF2CC",
];
const LINT_WARNING_FONT_COLORS = ["red", "#FF0000"];
const LINT_NOTE_PREFIX = "[Lint] ";

function clearRangeBackgroundIfMatches(
  range: GoogleAppsScript.Spreadsheet.Range,
  colorsToClear: string[],
): void {
  if (!range) return;
  if (range.getNumRows() === 0 || range.getNumColumns() === 0) return;

  const normalized = colorsToClear.map((color) => color.toUpperCase());
  const backgrounds = range.getBackgrounds();
  let updated = false;

  for (let row = 0; row < backgrounds.length; row++) {
    for (let col = 0; col < backgrounds[row].length; col++) {
      const background = backgrounds[row][col];
      if (
        background &&
        normalized.includes(background.toUpperCase())
      ) {
        backgrounds[row][col] = null;
        updated = true;
      }
    }
  }

  if (updated) {
    range.setBackgrounds(backgrounds);
  }
}

function clearRangeFontColorIfMatches(
  range: GoogleAppsScript.Spreadsheet.Range,
  colorsToClear: string[],
): void {
  if (!range) return;
  if (range.getNumRows() === 0 || range.getNumColumns() === 0) return;

  const normalized = colorsToClear.map((color) => color.toUpperCase());
  const fontColors = range.getFontColors();
  let updated = false;

  for (let row = 0; row < fontColors.length; row++) {
    for (let col = 0; col < fontColors[row].length; col++) {
      const fontColor = fontColors[row][col];
      if (
        fontColor &&
        normalized.includes(fontColor.toUpperCase())
      ) {
        fontColors[row][col] = null;
        updated = true;
      }
    }
  }

  if (updated) {
    range.setFontColors(fontColors);
  }
}

function clearRangeNotesWithPrefix(
  range: GoogleAppsScript.Spreadsheet.Range,
  prefix: string,
): void {
  if (!range) return;
  if (range.getNumRows() === 0 || range.getNumColumns() === 0) return;

  const notes = range.getNotes();
  let updated = false;

  for (let row = 0; row < notes.length; row++) {
    for (let col = 0; col < notes[row].length; col++) {
      const note = notes[row][col];
      if (
        note &&
        (note.startsWith(prefix) ||
          note.includes("Icon slug \"") ||
          note.includes("No SVG icon found") ||
          note.includes("Unable to determine an icon name"))
      ) {
        notes[row][col] = "";
        updated = true;
      }
    }
  }

  if (updated) {
    range.setNotes(notes);
  }
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

function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

function columnNumberToLetter(columnNumber: number): string {
  let dividend = columnNumber;
  let columnName = "";
  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }
  return columnName;
}

function normalizeIconSlug(slug: string): string {
  if (!slug) return "";

  const parts = slug.split("-").filter((part) => part !== "");

  while (parts.length > 0) {
    const last = parts[parts.length - 1];
    if (/^(?:\d+px|\d+x|small|medium|large)$/.test(last)) {
      parts.pop();
      continue;
    }
    break;
  }

  return parts.join("-");
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
  clearRangeBackgroundIfMatches(range, ["#FFC7CE"]);
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
      const columnLetter = columnNumberToLetter(columnIndex);
      const rangeAddresses = rows.map((rowNumber) => `${columnLetter}${rowNumber}`);
      sheet.getRangeList(rangeAddresses).setBackground("#FFC7CE"); // Light red
    }
  });
}

// Additional validation functions

/**
 * Check for unreferenced details (details that no category uses)
 */
function checkUnreferencedDetails(): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheet = spreadsheet.getSheetByName("Categories");
  const detailsSheet = spreadsheet.getSheetByName("Details");

  if (!categoriesSheet || !detailsSheet) {
    return;
  }

  try {
    // Get all detail names from Details sheet
    const detailsLastRow = detailsSheet.getLastRow();
    if (detailsLastRow <= 1) return; // No details to check

    clearRangeBackgroundIfMatches(
      detailsSheet.getRange(2, 1, detailsLastRow - 1, 1),
      ["#FFFFCC"],
    );

    const detailNames = detailsSheet
      .getRange(2, 1, detailsLastRow - 1, 1)
      .getValues()
      .map((row) => slugify(String(row[0])))
      .filter((name) => name);

    // Get all field references from Categories sheet (column 3)
    const categoriesLastRow = categoriesSheet.getLastRow();
    if (categoriesLastRow <= 1) {
      // No categories exist, so all details are unreferenced
      console.log("No categories exist - all details are unreferenced");
      for (let i = 2; i <= detailsLastRow; i++) {
        detailsSheet.getRange(i, 1).setBackground("#FFFFCC"); // Light yellow for warning
      }
      return;
    }

    const categoryFields = categoriesSheet
      .getRange(2, 3, categoriesLastRow - 1, 1)
      .getValues()
      .map((row) => String(row[0] || ""))
      .filter((fields) => fields.trim() !== "");

    // Build set of all referenced field names
    const referencedFields = new Set<string>();
    for (const fieldsStr of categoryFields) {
      const fields = fieldsStr
        .split(",")
        .map((f) => slugify(f.trim()))
        .filter((f) => f);
      for (const field of fields) {
        referencedFields.add(field);
      }
    }

    // Check each detail to see if it's referenced
    for (let i = 0; i < detailNames.length; i++) {
      const detailName = detailNames[i];
      if (!referencedFields.has(detailName)) {
        const row = i + 2; // +2 because of header row and 0-indexed
        console.log(`Unreferenced detail: "${detailName}" at row ${row}`);
        detailsSheet.getRange(row, 1).setBackground("#FFFFCC"); // Light yellow for warning
      }
    }
  } catch (error) {
    console.error("Error checking unreferenced details:", error);
  }
}

/**
 * Validate Universal flag column (should be TRUE, FALSE, or blank)
 */
function validateUniversalFlag(
  value: string,
  row: number,
  col: number,
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
): void {
  if (isEmptyOrWhitespace(value)) return; // Blank is allowed

  const upperValue = value.toString().trim().toUpperCase();
  if (upperValue !== "TRUE" && upperValue !== "FALSE") {
    console.log(
      `Invalid Universal flag value "${value}" at row ${row} - must be TRUE, FALSE, or blank`,
    );
    setInvalidCellBackground(sheet, row, col, "#FFC7CE"); // Light red for invalid
  }
}

/**
 * Check for duplicate slugs in translation sheets that would cause conflicts
 */
function checkDuplicateTranslationSlugs(): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const translationSheets = sheets(true);

  for (const sheetName of translationSheets) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) continue;

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) continue;

    try {
      // Get all translated values and check for duplicate slugs
      const lastCol = sheet.getLastColumn();
      if (lastCol < 4) continue; // Need at least Name, ISO, Source, and one translation

      clearRangeBackgroundIfMatches(
        sheet.getRange(2, 4, lastRow - 1, lastCol - 3),
        ["#FFEB9C"],
      );

      // Check each translation column (starting from column 4)
      for (let col = 4; col <= lastCol; col++) {
        const values = sheet
          .getRange(2, col, lastRow - 1, 1)
          .getValues()
          .map((row) => String(row[0] || "").trim())
          .filter((v) => v !== "");

        // Build slug frequency map
        const slugCounts = new Map<string, number[]>();
        for (let i = 0; i < values.length; i++) {
          const value = values[i];
          const slug = slugify(value);
          if (!slug) continue;

          if (!slugCounts.has(slug)) {
            slugCounts.set(slug, [i + 2]); // +2 for header and 0-index
          } else {
            slugCounts.get(slug)?.push(i + 2);
          }
        }

        // Highlight cells with duplicate slugs
        for (const [slug, rows] of slugCounts.entries()) {
          if (rows.length > 1) {
            console.log(
              `Duplicate slug "${slug}" in ${sheetName} column ${col} at rows: ${rows.join(", ")}`,
            );
            for (const row of rows) {
              sheet.getRange(row, col).setBackground("#FFEB9C"); // Light orange for duplicate warning
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error checking duplicate slugs in ${sheetName}:`, error);
    }
  }
}

/**
 * Validate translation headers are valid language codes or "Name - ISO" format
 */
function validateTranslationHeaders(): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const translationSheets = sheets(true);
  const allLanguages = getAllLanguages();
  const validLanguageCodes = Object.keys(allLanguages);

  for (const sheetName of translationSheets) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) continue;

    try {
      const lastCol = sheet.getLastColumn();
      if (lastCol < 4) continue; // Need at least Name, ISO, Source columns

      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      clearRangeBackgroundIfMatches(
        sheet.getRange(1, 1, 1, lastCol),
        ["#FFC7CE", "#FFEB9C"],
      );

      // Check language columns (starting from column 4, index 3)
      for (let i = 3; i < headers.length; i++) {
        const header = String(headers[i] || "").trim();
        if (!header) continue;

        // Check if it's a valid language code or "Name - ISO" format
        const isValidCode = validLanguageCodes.some(
          (code) => code.toLowerCase() === header.toLowerCase(),
        );

        const isValidNameIsoFormat = header.includes(" - ");

        if (!isValidCode && !isValidNameIsoFormat) {
          console.log(
            `Invalid translation header "${header}" in ${sheetName} column ${i + 1} - should be language code or "Name - ISO" format`,
          );
          sheet.getRange(1, i + 1).setBackground("#FFC7CE"); // Light red for invalid
        } else if (isValidNameIsoFormat) {
          // Validate the ISO part
          const parts = header.split(" - ");
          const isoCode = parts[parts.length - 1].trim();
          const isValidIso = validLanguageCodes.some(
            (code) => code.toLowerCase() === isoCode.toLowerCase(),
          );

          if (!isValidIso) {
            console.log(
              `Invalid ISO code "${isoCode}" in header "${header}" in ${sheetName} column ${i + 1}`,
            );
            sheet.getRange(1, i + 1).setBackground("#FFEB9C"); // Light orange for warning
          }
        }
      }
    } catch (error) {
      console.error(`Error validating headers in ${sheetName}:`, error);
    }
  }
}

// Generic linting function
function lintSheet(
  sheetName: string,
  columnValidations: ((value: string, row: number, col: number) => void)[],
  requiredColumns: number[] = [],
  preserveBackgroundColumns: number[] = [],
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
    if (lastRow > 1 && columnValidations.length > 0) {
      // Clear backgrounds and font colors for all columns except those that should be preserved
      for (let col = 0; col < columnValidations.length; col++) {
        // Skip columns that should preserve their backgrounds (e.g., Categories icon column with user colors)
        const shouldClearBackground = !preserveBackgroundColumns.includes(col);
        const colRange = sheet.getRange(2, col + 1, lastRow - 1, 1);

        if (shouldClearBackground) {
          clearRangeBackgroundIfMatches(colRange, LINT_WARNING_BACKGROUND_COLORS);
        }
        clearRangeFontColorIfMatches(colRange, LINT_WARNING_FONT_COLORS);
      }
    }

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
    const dataRange = sheet.getRange(2, 1, lastRow - 1, columnValidations.length);
    const data = dataRange.getValues();
    console.timeEnd(`Getting data for ${sheetName}`);

    console.time(`Validating cells for ${sheetName}`);

    // Highlight required fields in batches before running column validations
    if (requiredColumns.length > 0) {
      const rangesToReset: string[] = [];
      requiredColumns.forEach((colIndex) => {
        // Skip columns that should preserve their backgrounds
        if (!preserveBackgroundColumns.includes(colIndex)) {
          const columnLetter = columnNumberToLetter(colIndex + 1);
          rangesToReset.push(`${columnLetter}2:${columnLetter}${lastRow}`);
        }
      });

      if (rangesToReset.length > 0) {
        sheet.getRangeList(rangesToReset).setBackground(null);
      }

      const requiredHighlights = new Map<number, number[]>();
      requiredColumns.forEach((colIndex) => {
        // Skip columns that should preserve their backgrounds
        if (!preserveBackgroundColumns.includes(colIndex)) {
          requiredHighlights.set(colIndex, []);
        }
      });

      data.forEach((row, rowIndex) => {
        requiredColumns.forEach((colIndex) => {
          // Skip columns that should preserve their backgrounds
          if (!preserveBackgroundColumns.includes(colIndex) && isEmptyOrWhitespace(row[colIndex])) {
            const rows = requiredHighlights.get(colIndex);
            if (rows) {
              rows.push(rowIndex + 2); // +2 accounts for header row
            }
          }
        });
      });

      requiredHighlights.forEach((rows, colIndex) => {
        if (!rows || rows.length === 0) {
          return;
        }
        const columnLetter = columnNumberToLetter(colIndex + 1);
        const rangeAddresses = rows.map((rowNumber) => `${columnLetter}${rowNumber}`);
        sheet.getRangeList(rangeAddresses).setBackground("#FFF2CC"); // Light yellow for required fields
      });
    }

    // Iterate through each cell and apply the corresponding validation function
    data.forEach((row, rowIndex) => {
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

function getDriveIconInfo(fileId: string): {
  slug: string | null;
  isSvg: boolean;
  errorMessage?: string;
} {
  try {
    const file = DriveApp.getFileById(fileId);
    const fileName = file.getName();
    const mimeType = file.getMimeType();
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    const slug = normalizeIconSlug(slugify(nameWithoutExt));
    const isSvg = mimeType === MimeType.SVG || /\.svg$/i.test(fileName);
    return { slug: slug || null, isSvg };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      slug: null,
      isSvg: false,
      errorMessage: `Unable to access icon file (Drive ID ${fileId}): ${message}`,
    };
  }
}

function validateCategoryIcons(): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheet = spreadsheet.getSheetByName("Categories");

  if (!categoriesSheet) {
    console.log("Categories sheet not found during icon validation");
    return;
  }

  const lastRow = categoriesSheet.getLastRow();
  if (lastRow <= 1) {
    console.log("No category rows available for icon validation");
    return;
  }

  const iconRange = categoriesSheet.getRange(2, 2, lastRow - 1, 1);
  // Do NOT clear background colors in icon column - they are user data (category colors)
  clearRangeFontColorIfMatches(iconRange, LINT_WARNING_FONT_COLORS);
  clearRangeNotesWithPrefix(iconRange, LINT_NOTE_PREFIX);

  const presetValues = categoriesSheet
    .getRange(2, 1, lastRow - 1, 1)
    .getValues();
  const iconValues = categoriesSheet.getRange(2, 2, lastRow - 1, 1).getValues();

  const presetSlugToRow = new Map<string, number>();
  const iconSlugToRows = new Map<string, number[]>();
  const driveFileCache = new Map<
    string,
    { slug: string | null; isSvg: boolean; errorMessage?: string }
  >();
  const rowIssues = new Map<number, string[]>();

  const addIssue = (row: number, message: string): void => {
    if (!rowIssues.has(row)) {
      rowIssues.set(row, []);
    }
    const issues = rowIssues.get(row)!;
    if (!issues.includes(message)) {
      issues.push(message);
    }
  };

  presetValues.forEach((row, index) => {
    const rowNumber = index + 2;
    const rawName = row[0];
    const presetName =
      typeof rawName === "string"
        ? rawName.trim()
        : String(rawName ?? "").trim();

    if (!presetName) {
      return;
    }

    const presetSlug = createPresetSlug(presetName, index);
    presetSlugToRow.set(presetSlug, rowNumber);

    const iconCellValue = iconValues[index][0];

    if (iconCellValue === null || iconCellValue === undefined || iconCellValue === "") {
      return;
    }

    let iconSlug: string | null = null;

    if (typeof iconCellValue === "string") {
      const iconValue = iconCellValue.trim();
      if (!iconValue) {
        return;
      }

      if (iconValue.startsWith("data:")) {
        if (!iconValue.startsWith("data:image/svg+xml")) {
          addIssue(rowNumber, "Icon data URI must be image/svg+xml.");
        }
        iconSlug = presetSlug;
      } else if (iconValue.startsWith("https://drive.google.com/")) {
        const fileId = extractDriveFileId(iconValue);
        if (fileId) {
          let info = driveFileCache.get(fileId);
          if (!info) {
            info = getDriveIconInfo(fileId);
            driveFileCache.set(fileId, info);
          }

          if (info.slug) {
            iconSlug = info.slug;
          }

          if (info.errorMessage) {
            addIssue(rowNumber, info.errorMessage);
          } else if (!info.isSvg) {
            addIssue(
              rowNumber,
              "Icon Drive file must be an SVG (MIME type image/svg+xml).",
            );
          }
        } else {
          addIssue(rowNumber, "Icon URL must contain a valid Google Drive file ID.");
        }
      } else if (/^https?:\/\//i.test(iconValue)) {
        const segment = iconValue.split("/").pop() || "";
        const fileName = segment.split("?")[0];
        const baseName = fileName.replace(/\.[^/.]+$/, "");
        iconSlug = normalizeIconSlug(slugify(baseName));
        if (!/\.svg(\?|$)/i.test(fileName)) {
          addIssue(rowNumber, "Icon URL must point to an SVG file.");
        }
      } else {
        iconSlug = normalizeIconSlug(slugify(iconValue));
        if (!iconValue.toLowerCase().endsWith(".svg")) {
          addIssue(rowNumber, "Icon reference must be an SVG file.");
        }
      }
    } else if (
      iconCellValue &&
      typeof iconCellValue === "object" &&
      iconCellValue.toString() === "CellImage"
    ) {
      iconSlug = presetSlug;
      addIssue(
        rowNumber,
        "Embedded images are not supported. Please use an SVG URL stored in the cell.",
      );
    } else {
      iconSlug = presetSlug;
      addIssue(
        rowNumber,
        "Unrecognized icon cell value. Please provide an SVG URL for the icon.",
      );
    }

    if (iconSlug) {
      const rows = iconSlugToRows.get(iconSlug) || [];
      rows.push(rowNumber);
      iconSlugToRows.set(iconSlug, rows);
    } else {
      addIssue(
        rowNumber,
        "Unable to determine an icon name. Icon file name must match the preset slug.",
      );
    }
  });

  iconSlugToRows.forEach((rows, slug) => {
    if (!presetSlugToRow.has(slug)) {
      rows.forEach((rowNumber) => {
        addIssue(
          rowNumber,
          `Icon slug "${slug}" does not match any preset in the Categories sheet.`,
        );
      });
    }
  });

  presetSlugToRow.forEach((rowNumber, slug) => {
    if (!iconSlugToRows.has(slug)) {
      addIssue(
        rowNumber,
        "No SVG icon found for this preset. Ensure the icon file name matches the category slug.",
      );
    }
  });

  rowIssues.forEach((messages, rowNumber) => {
    const cell = categoriesSheet.getRange(rowNumber, 2);
    cell.setFontColor("red");
    cell.setNote(`${LINT_NOTE_PREFIX}${messages.join("\n")}`);
    console.warn(
      `Icon issue in Categories row ${rowNumber}: ${messages.join(" | ")}`,
    );
  });

  if (rowIssues.size === 0) {
    console.log("Category icon validation completed with no issues found.");
  }
}

// Specific sheet linting functions
function lintCategoriesSheet(): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const categoriesSheetRef = spreadsheet.getSheetByName("Categories");
  const detailsSheetRef = spreadsheet.getSheetByName("Details");

  if (categoriesSheetRef) {
    const lastRow = categoriesSheetRef.getLastRow();
    if (lastRow > 1) {
      // Clear font colors in icon column (column 2) but preserve background colors (they are user data)
      clearRangeFontColorIfMatches(
        categoriesSheetRef.getRange(2, 2, lastRow - 1, 1),
        LINT_WARNING_FONT_COLORS,
      );
      // Clear background colors in fields column (column 3)
      clearRangeBackgroundIfMatches(
        categoriesSheetRef.getRange(2, 3, lastRow - 1, 1),
        ["#FFC7CE"],
      );
    }
  }

  let cachedDetailNames: string[] = [];
  if (detailsSheetRef) {
    const lastRow = detailsSheetRef.getLastRow();
    if (lastRow > 1) {
      cachedDetailNames = detailsSheetRef
        .getRange(2, 1, lastRow - 1, 1)
        .getValues()
        .map((row) => slugify(String(row[0])))
        .filter((name) => name);
    }
  }

  const categoriesValidations = [
    // Rule 1: Capitalize the first letter of the category name
    (value, row, col) => {
      if (isEmptyOrWhitespace(value)) return;

      const capitalizedValue = capitalizeFirstLetter(value);
      if (capitalizedValue !== value) {
        try {
          categoriesSheetRef?.getRange(row, col).setValue(capitalizedValue);
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
          const cell = categoriesSheetRef?.getRange(row, col);
          if (cell) {
            cell.setFontColor("red");
            cell.setNote(`${LINT_NOTE_PREFIX}Icon is required but missing or empty`);
          }
          return;
        }

        // Validate URL format
        const isValidGoogleDriveUrl = (url: string): boolean => {
          return (
            url.startsWith("https://drive.google.com/") &&
            extractDriveFileId(url) !== null
          );
        };

        if (!isValidGoogleDriveUrl(value)) {
          console.log("Invalid icon URL: " + value);
          const cell = categoriesSheetRef?.getRange(row, col);
          if (cell) {
            cell.setFontColor("red");
            cell.setNote(`${LINT_NOTE_PREFIX}Invalid icon URL. Must be a valid Google Drive URL`);
          }
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
        if (cachedDetailNames.length > 0) {
          const fields = value.split(",").map((field) => slugify(field.trim()));
          const invalidFields = fields.filter(
            (field) => field && !cachedDetailNames.includes(field),
          );

          if (invalidFields.length > 0) {
            console.log(
              "Invalid fields in row " + row + ": " + invalidFields.join(", "),
            );
            const cell = categoriesSheetRef?.getRange(row, col);
            if (cell) {
              cell.setFontColor("red");
              cell.setNote(`${LINT_NOTE_PREFIX}Invalid fields: ${invalidFields.join(", ")}. These fields do not exist in the Details sheet`);
            }
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
  // Preserve backgrounds in icon column (index 1) because they are user-set category colors
  lintSheet("Categories", categoriesValidations, [0, 1], [1]);
  validateCategoryIcons();
}

function lintDetailsSheet(): void {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details");
  if (!sheet) {
    console.log("Details sheet not found");
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const lastColumn = sheet.getLastColumn();
    if (lastColumn >= 3) {
      clearRangeBackgroundIfMatches(
        sheet.getRange(2, 3, lastRow - 1, 1),
        ["#FFC7CE"],
      );
    }
    if (lastColumn >= 4) {
      clearRangeBackgroundIfMatches(
        sheet.getRange(2, 4, lastRow - 1, 1),
        ["#FFC7CE"],
      );
    }
    if (lastColumn >= 6) {
      clearRangeBackgroundIfMatches(
        sheet.getRange(2, 6, lastRow - 1, 1),
        ["#FFC7CE"],
      );
    }
  }

  // Check for unreferenced details (details not used by any category)
  checkUnreferencedDetails();

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
    // Rule 5: Placeholder for column 5 (no validation needed)
    () => {
      // Column 5 - no validation
    },
    // Rule 6: Validate Universal flag column (TRUE, FALSE, or blank only)
    (value, row, col) => {
      validateUniversalFlag(value, row, col, sheet);
    },
  ];

  // Detail name and type are required fields
  lintSheet("Details", detailsValidations, [0, 2]);
}

function lintTranslationSheets(): void {
  // First validate translation headers
  console.log("Validating translation headers...");
  validateTranslationHeaders();

  // Then check for duplicate slugs
  console.log("Checking for duplicate translation slugs...");
  checkDuplicateTranslationSlugs();

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
    // OPTIMIZATION: Read row counts once
    const sourceRowCount = sourceSheet.getLastRow();
    const translationRowCount = translationSheet.getLastRow();

    if (translationRowCount > 0 && translationSheet.getLastColumn() > 0) {
      clearRangeBackgroundIfMatches(
        translationSheet.getRange(
          1,
          1,
          translationRowCount,
          translationSheet.getLastColumn(),
        ),
        ["#FFC7CE", "#FFF2CC"],
      );
    }

    // Check row count consistency (excluding header)
    if (sourceRowCount !== translationRowCount) {
      console.warn(
        `Row count mismatch in ${translationSheetName}: ` +
          `Source has ${sourceRowCount} rows, translation has ${translationRowCount} rows`,
      );

      // Highlight the discrepancy in the translation sheet
      // Use cached translationRowCount instead of calling getLastRow() again
      if (translationRowCount > 0) {
        translationSheet
          .getRange(1, 1, Math.min(translationRowCount, 1), 1)
          .setBackground("#FFF2CC"); // Light yellow warning
      }
    }

    // Validate option counts for Detail Option Translations
    if (validateOptionCounts && sourceRowCount > 1) {
      const detailsSheet =
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Details");
      if (!detailsSheet) return;

      // OPTIMIZATION: Read all data once in a single batch operation
      const translationLastCol = translationSheet.getLastColumn();

      // Read options column from Details sheet (column 4)
      const detailsData = detailsSheet
        .getRange(2, 4, sourceRowCount - 1, 1)
        .getValues();

      // Read all translation data in one operation
      const translationData = translationSheet
        .getRange(2, 1, translationRowCount - 1, translationLastCol)
        .getValues();

      // OPTIMIZATION: Collect all cells that need highlighting instead of setting individually
      const cellsToHighlight: Array<{ row: number; col: number }> = [];

      // Validate each row in a single pass
      const minRows = Math.min(detailsData.length, translationData.length);
      for (let i = 0; i < minRows; i++) {
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

            // Collect cell for batch highlighting
            cellsToHighlight.push({ row: i + 2, col: col + 1 });
          }
        }
      }

      // OPTIMIZATION: Apply all highlights in a single batch operation using RangeList
      if (cellsToHighlight.length > 0) {
        const rangeStrings = cellsToHighlight.map(
          ({ row, col }) => translationSheet.getRange(row, col).getA1Notation(),
        );
        const rangeList = translationSheet.getRangeList(rangeStrings);
        rangeList.setBackground("#FFC7CE"); // Light red for mismatch
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
 * Validates HTML content for common issues that could cause "Malformed HTML content" errors
 * @param html - The HTML string to validate
 * @returns Object with isValid flag and errors array
 */
function validateHtmlContent(html: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for basic HTML structure issues
  if (!html || typeof html !== "string") {
    errors.push("HTML content is empty or not a string");
    return { isValid: false, errors };
  }

  // Check for unclosed tags (basic validation)
  const tagStack: string[] = [];
  const selfClosingTags = new Set([
    "img",
    "br",
    "hr",
    "input",
    "meta",
    "link",
    "area",
    "base",
    "col",
    "embed",
    "param",
    "source",
    "track",
    "wbr",
  ]);

  // Match opening and closing tags
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();

    // Skip self-closing tags
    if (selfClosingTags.has(tagName) || fullTag.endsWith("/>")) {
      continue;
    }

    // Check if it's a closing tag
    if (fullTag.startsWith("</")) {
      if (tagStack.length === 0) {
        errors.push(`Closing tag </${tagName}> found without matching opening tag`);
      } else {
        const lastTag = tagStack.pop();
        if (lastTag !== tagName) {
          errors.push(
            `Mismatched tags: Expected </${lastTag}>, found </${tagName}>`,
          );
        }
      }
    } else {
      // Opening tag
      tagStack.push(tagName);
    }
  }

  // Check for unclosed tags
  if (tagStack.length > 0) {
    errors.push(`Unclosed tags: ${tagStack.map((tag) => `<${tag}>`).join(", ")}`);
  }

  // Check for common HTML errors
  if (html.includes("<script>") && !html.includes("</script>")) {
    errors.push("Unclosed <script> tag detected");
  }

  if (html.includes("<style>") && !html.includes("</style>")) {
    errors.push("Unclosed <style> tag detected");
  }

  // Check for unescaped special characters in attribute values
  const attrRegex = /(\w+)="([^"]*)"/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(html)) !== null) {
    const attrValue = attrMatch[2];
    if (attrValue.includes("<") && !attrValue.startsWith("data:")) {
      errors.push(
        `Unescaped '<' in attribute ${attrMatch[1]}="${attrValue}" - should use &lt;`,
      );
    }
  }

  // Check for malformed attribute syntax (e.g., style="value";> instead of style="value">)
  const malformedAttrRegex = /(\w+)="([^"]*)";>/g;
  let malformedMatch;
  while ((malformedMatch = malformedAttrRegex.exec(html)) !== null) {
    errors.push(
      `Malformed attribute syntax: ${malformedMatch[0]} - semicolon should be inside quotes or removed`,
    );
  }

  // NOTE: Unclosed quote validation removed due to false positives
  // The regex pattern was incorrectly capturing attributes without their closing quotes,
  // causing all valid attributes to be flagged as errors.
  // Other validations (tag matching, script/style tags, etc.) are sufficient.

  // Check for multiple DOCTYPE declarations
  const doctypeCount = (html.match(/<!DOCTYPE/gi) || []).length;
  if (doctypeCount > 1) {
    errors.push("Multiple DOCTYPE declarations found");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates HTML before showing a dialog to prevent "Malformed HTML content" errors
 * @param html - The HTML string to validate
 * @param context - Context description for error messages (e.g., "Language Selection Dialog")
 * @throws Error if HTML is malformed
 */
function validateDialogHtml(html: string, context: string = "Dialog"): void {
  const validation = validateHtmlContent(html);

  if (!validation.isValid) {
    const errorMessage = `HTML validation failed for ${context}:\n${validation.errors.join("\n")}`;
    console.error(errorMessage);
    throw new Error(
      `Malformed HTML detected in ${context}. Please check the console for details.`,
    );
  }

  // Additional checks specific to Google Apps Script dialogs
  if (html.length > 500000) {
    console.warn(
      `HTML content for ${context} is very large (${html.length} characters). This may cause performance issues.`,
    );
  }
}

/**
 * Test function to validate HTML dialog generation
 * Run this from the Apps Script editor to test HTML validation
 */
function testHtmlValidation(): void {
  console.log("=== Testing HTML Validation ===");

  // Test cases
  const testCases = [
    {
      name: "Valid HTML",
      html: "<p>Hello <strong>world</strong></p>",
      shouldPass: true,
    },
    {
      name: "Unclosed tag",
      html: "<p>Hello <strong>world</p>",
      shouldPass: false,
    },
    {
      name: "Mismatched tags",
      html: "<div><p>Content</div></p>",
      shouldPass: false,
    },
    {
      name: "Unclosed script tag",
      html: "<script>console.log('test')",
      shouldPass: false,
    },
    {
      name: "Valid self-closing tags",
      html: "<p>Line 1<br/>Line 2<img src='test.png' /></p>",
      shouldPass: true,
    },
    {
      name: "Unescaped < in attribute",
      html: '<p data-value="test<value">Content</p>',
      shouldPass: false,
    },
    {
      name: "Valid data URI",
      html: '<img src="data:image/svg+xml,%3Csvg%3E" />',
      shouldPass: true,
    },
    {
      name: "Multiple DOCTYPE declarations",
      html: "<!DOCTYPE html><!DOCTYPE html><html></html>",
      shouldPass: false,
    },
    {
      name: "Malformed attribute with semicolon",
      html: '<ol style="text-align: left";><li>Item</li></ol>',
      shouldPass: false,
    },
    // NOTE: Unclosed quote validation removed due to false positives
    // The test case for unclosed quotes has been removed
    {
      name: "Valid complex HTML",
      html: '<!DOCTYPE html><html><head><style>body { color: red; }</style></head><body><p>Test</p></body></html>',
      shouldPass: true,
    },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase) => {
    console.log(`\nTesting: ${testCase.name}`);
    const validation = validateHtmlContent(testCase.html);

    if (validation.isValid === testCase.shouldPass) {
      console.log(`✅ PASS: ${testCase.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${testCase.name}`);
      console.log(`  Expected: ${testCase.shouldPass ? "valid" : "invalid"}`);
      console.log(`  Got: ${validation.isValid ? "valid" : "invalid"}`);
      if (validation.errors.length > 0) {
        console.log(`  Errors: ${validation.errors.join(", ")}`);
      }
      failed++;
    }
  });

  console.log("\n=== Test Results ===");
  console.log(`Passed: ${passed}/${testCases.length}`);
  console.log(`Failed: ${failed}/${testCases.length}`);

  if (failed === 0) {
    console.log("✅ All tests passed!");
  } else {
    console.log(`❌ ${failed} test(s) failed`);
  }
}

/**
 * INTEGRATION TEST: Test actual dialog HTML generation
 * This validates the real HTML that would be shown to users
 */
function testDialogHtmlGeneration(): void {
  console.log("\n=== Testing Dialog HTML Generation ===");

  let totalTests = 0;
  let passedTests = 0;

  // Test 1: Simple dialog
  try {
    totalTests++;
    const html = generateDialog("Test Title", "<p>Test message</p>");
    validateDialogHtml(html, "Test Dialog");
    console.log("✅ Simple dialog HTML is valid");
    passedTests++;
  } catch (error) {
    console.log("❌ Simple dialog HTML is INVALID:", error);
  }

  // Test 2: Dialog with button
  try {
    totalTests++;
    const html = generateDialog("Test", "<p>Message</p>", "Click", "https://example.com");
    validateDialogHtml(html, "Dialog with Button");
    console.log("✅ Dialog with button HTML is valid");
    passedTests++;
  } catch (error) {
    console.log("❌ Dialog with button HTML is INVALID:", error);
  }

  // Test 3: Dialog with function button
  try {
    totalTests++;
    const html = generateDialog("Test", "<p>Message</p>", "Submit", null, "submitForm");
    validateDialogHtml(html, "Dialog with Function");
    console.log("✅ Dialog with function button HTML is valid");
    passedTests++;
  } catch (error) {
    console.log("❌ Dialog with function button HTML is INVALID:", error);
  }

  // Test 4: Dialog with special characters (should be escaped)
  try {
    totalTests++;
    const title = "Test <> & \"Title\"";
    const message = "<p>" + escapeHtml("Message with <> & \"quotes\"") + "</p>";
    const html = generateDialog(title, message);
    validateDialogHtml(html, "Dialog with Special Chars");
    console.log("✅ Dialog with special characters HTML is valid");
    passedTests++;
  } catch (error) {
    console.log("❌ Dialog with special characters HTML is INVALID:", error);
  }

  console.log(`\n=== Dialog Generation Test Results ===`);
  console.log(`Passed: ${passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log("✅ All dialog generation tests passed!");
  } else {
    console.log(`❌ ${totalTests - passedTests} dialog generation test(s) failed`);
  }
}

/**
 * Run all HTML validation tests
 */
function runAllHtmlValidationTests(): void {
  testHtmlValidation();
  testDialogHtmlGeneration();
  console.log("\n=== All HTML Validation Tests Complete ===");
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
          "- Yellow highlighted cells: Required fields missing, unreferenced details, or translation row mismatches\n" +
          "- Red highlighted cells: Invalid values, missing options, invalid Universal flags, or invalid translation headers\n" +
          "- Red text in Categories icon column: Missing or invalid icons (hover for details)\n" +
          "- Red text in Categories fields column: Invalid field references (hover for details)\n" +
          "- Pink highlighted cells: Duplicate values, invalid references, or option count mismatches\n" +
          "- Orange highlighted cells: Duplicate slugs in translations or invalid ISO codes",
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
