/// <reference path="../loggingHelpers.ts" />
/// <reference path="../types.ts" />
/// <reference path="../spreadsheetData.ts" />
/// <reference path="../generateConfig/processFields.ts" />
/// <reference path="../generateConfig/processPresets.ts" />
/// <reference path="../generateConfig/processTranslations.ts" />

/**
 * Test function to investigate row 2 translation issue
 *
 * This test checks if the first category (row 2) is being properly matched
 * during translation processing.
 */
function testRow2Translation() {
  const log = getScopedLogger("TestRow2Translation");
  log.info("=== Testing Row 2 Translation Issue ===");

  try {
    // Get spreadsheet data
    const data = getSpreadsheetData();
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Process fields and presets
    const categoriesSheet = spreadsheet.getSheetByName("Categories");
    const detailsSheet = spreadsheet.getSheetByName("Details");

    if (!categoriesSheet || !detailsSheet) {
      log.error("Categories or Details sheet not found");
      return;
    }

    const fields = processFields(data, detailsSheet);
    const presets = processPresets(data, categoriesSheet, fields);

    log.info(`Processed ${presets.length} presets`);
    log.info("First preset (should match row 2):", presets[0]);

    // Check Category Translations sheet
    const categoryTranslationsSheet = spreadsheet.getSheetByName("Category Translations");
    if (!categoryTranslationsSheet) {
      log.error("Category Translations sheet not found");
      return;
    }

    const categoryTranslations = data["Category Translations"];
    if (!categoryTranslations) {
      log.error("No Category Translations data");
      return;
    }

    log.info(`Category Translations has ${categoryTranslations.length} rows (including header)`);

    // Check row 2 (index 1 after slicing)
    const translations = categoryTranslations.slice(1);
    if (translations.length === 0) {
      log.error("No translation rows found");
      return;
    }

    log.info("Row 2 of Category Translations (translations[0]):", translations[0]);

    // Build preset lookup
    const presetLookup = buildPresetLookup(presets);

    // Get primary language
    const primaryLanguage = getPrimaryLanguage();
    log.info("Primary language:", primaryLanguage);

    // Build column map
    const { targetLanguages, columnToLanguageMap } = buildColumnMapForSheet("Category Translations");
    log.info("Target languages:", targetLanguages);
    log.info("Column to language map:", columnToLanguageMap);

    // Try to resolve preset for row 2
    const translationIndex = 0;
    const translation = translations[translationIndex].map((t) =>
      t === null || t === undefined ? "" : t.toString().trim()
    );

    log.info(`Translation values for row 2:`, translation);

    // Find primary column
    const primaryColumnIndexEntry = Object.entries(columnToLanguageMap).find(
      ([, lang]) => lang === primaryLanguage.code
    );
    const primaryColumnIndex = primaryColumnIndexEntry
      ? parseInt(primaryColumnIndexEntry[0], 10)
      : 0;

    log.info(`Primary column index: ${primaryColumnIndex}`);

    const primaryCell = translation[primaryColumnIndex] ?? translation[0] ?? "";
    log.info(`Primary cell value: "${primaryCell}"`);

    // Try to match
    const matchedPreset = presetLookup.find(primaryCell);
    log.info("Matched preset:", matchedPreset);

    if (!matchedPreset) {
      log.warn("No match found! Falling back to row order.");
      const fallbackPreset = presets[translationIndex];
      log.info("Fallback preset:", fallbackPreset);

      // Check normalization
      const normalizedPrimaryCell = normalizeComparisonKey(primaryCell);
      const normalizedPresetName = normalizeComparisonKey(presets[0].name);
      const normalizedPresetIcon = normalizeComparisonKey(presets[0].icon);

      log.info(`Normalized primary cell: "${normalizedPrimaryCell}"`);
      log.info(`Normalized preset[0].name: "${normalizedPresetName}"`);
      log.info(`Normalized preset[0].icon: "${normalizedPresetIcon}"`);

      if (normalizedPrimaryCell !== normalizedPresetName &&
          normalizedPrimaryCell !== normalizedPresetIcon) {
        log.error(`⚠️ MISMATCH DETECTED! Primary cell "${primaryCell}" doesn't match preset name "${presets[0].name}" or icon "${presets[0].icon}"`);
      }
    } else {
      log.info("✅ Preset matched successfully");
    }

    log.info("=== Test Complete ===");

  } catch (error) {
    log.error("Test failed:", error);
    throw error;
  }
}

/**
 * Helper function that must match the one in processTranslations.ts
 */
function normalizeComparisonKey(value: unknown): string {
  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
}

/**
 * Helper function that must match the one in processTranslations.ts
 */
function buildPresetLookup(presets: CoMapeoPreset[]) {
  const byName = new Map<string, CoMapeoPreset>();
  const byIcon = new Map<string, CoMapeoPreset>();

  presets.forEach((preset) => {
    if (preset?.name) {
      const key = normalizeComparisonKey(preset.name);
      if (key) byName.set(key, preset);
    }
    if (preset?.icon) {
      const key = normalizeComparisonKey(preset.icon);
      if (key) byIcon.set(key, preset);
    }
  });

  return {
    find(candidate: unknown): CoMapeoPreset | undefined {
      const key = normalizeComparisonKey(candidate);
      if (!key) return undefined;
      return byName.get(key) || byIcon.get(key);
    },
  };
}

/**
 * Helper function that must match the one in processTranslations.ts
 */
function buildColumnMapForSheet(sheetName: string): {
  targetLanguages: string[];
  columnToLanguageMap: Record<number, string>;
} {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {
    const log = getScopedLogger("TestRow2Translation");
    log.warn(`⏭️  Sheet "${sheetName}" not found - using only primary language`);
    const primaryLanguage = getPrimaryLanguage();
    return {
      targetLanguages: [primaryLanguage.code],
      columnToLanguageMap: { 0: primaryLanguage.code },
    };
  }

  const lastColumn = sheet.getLastColumn();

  if (lastColumn === 0) {
    const log = getScopedLogger("TestRow2Translation");
    log.warn(`⏭️  Sheet "${sheetName}" is empty - using only primary language`);
    const primaryLanguage = getPrimaryLanguage();
    return {
      targetLanguages: [primaryLanguage.code],
      columnToLanguageMap: { 0: primaryLanguage.code },
    };
  }

  const headerRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const targetLanguages: string[] = [];
  const columnToLanguageMap: Record<number, string> = {};

  const allLanguages: LanguageMap = getAllLanguages();
  const resolveHeaderCode = createTranslationHeaderResolver(allLanguages);
  const seenLanguages = new Set<string>();
  const headerB = String(headerRow[1] || "").trim().toLowerCase();
  const headerC = String(headerRow[2] || "").trim().toLowerCase();
  const hasMetaColumns = headerB.includes("iso") && headerC.includes("source");
  const languageStartIndex = hasMetaColumns ? 3 : 1;

  for (let i = languageStartIndex; i < headerRow.length; i++) {
    const header = headerRow[i]?.toString().trim();
    if (!header) {
      continue;
    }

    const langCode = resolveHeaderCode(header);
    if (!langCode) {
      continue;
    }

    const normalizedCode = langCode.toLowerCase();
    if (seenLanguages.has(normalizedCode)) {
      continue;
    }

    seenLanguages.add(normalizedCode);
    targetLanguages.push(langCode);
    columnToLanguageMap[i] = langCode;
  }

  return { targetLanguages, columnToLanguageMap };
}
