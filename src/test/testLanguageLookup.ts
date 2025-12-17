/// <reference path="../types.ts" />
/// <reference path="../languageLookup.ts" />

/**
 * Unit Tests for Language Lookup System
 *
 * Tests bidirectional language name recognition supporting both
 * English and native language names with case-insensitive matching.
 *
 * Run these tests by calling testLanguageLookup() from the Apps Script editor.
 */

/**
 * Test suite for language lookup functionality
 */
function testLanguageLookup(): void {
  // Environment check - ensure we're in Apps Script context
  if (typeof Logger === "undefined") {
    throw new Error("Logger not available - tests must run in Apps Script environment");
  }
  if (typeof SpreadsheetApp === "undefined") {
    throw new Error("SpreadsheetApp not available - tests must run in Apps Script environment");
  }

  const testResults: {
    passed: number;
    failed: number;
    tests: Array<{ name: string; passed: boolean; error?: string }>;
  } = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  /**
   * Helper function to run a test
   */
  function runTest(name: string, testFn: () => void): void {
    try {
      testFn();
      testResults.tests.push({ name, passed: true });
      testResults.passed++;
    } catch (error) {
      testResults.tests.push({
        name,
        passed: false,
        error: error.message || String(error),
      });
      testResults.failed++;
    }
  }

  /**
   * Helper function to assert equality
   */
  function assertEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(
        `Assertion failed: ${message || ""}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`,
      );
    }
  }

  /**
   * Helper function to assert truthiness
   */
  function assertTrue(value: boolean, message?: string): void {
    if (!value) {
      throw new Error(`Assertion failed: ${message || "Expected true but got false"}`);
    }
  }

  /**
   * Helper function to assert falsiness
   */
  function assertFalse(value: boolean, message?: string): void {
    if (value) {
      throw new Error(`Assertion failed: ${message || "Expected false but got true"}`);
    }
  }

  // Create test data
  const testLanguageData: LanguageMapEnhanced = {
    en: { englishName: "English", nativeName: "English" },
    pt: { englishName: "Portuguese", nativeName: "Português" },
    es: { englishName: "Spanish", nativeName: "Español" },
    fr: { englishName: "French", nativeName: "Français" },
    de: { englishName: "German", nativeName: "Deutsch" },
    ja: { englishName: "Japanese", nativeName: "日本語" },
    zh: { englishName: "Chinese", nativeName: "中文" },
  };

  const lookup = createLanguageLookup(testLanguageData);

  // Test 1: English name lookup
  runTest("Get code by English name", () => {
    assertEqual(lookup.getCodeByName("English"), "en", "Should find 'en' for 'English'");
    assertEqual(lookup.getCodeByName("Portuguese"), "pt", "Should find 'pt' for 'Portuguese'");
    assertEqual(lookup.getCodeByName("Spanish"), "es", "Should find 'es' for 'Spanish'");
  });

  // Test 2: Native name lookup
  runTest("Get code by native name", () => {
    assertEqual(lookup.getCodeByName("Português"), "pt", "Should find 'pt' for 'Português'");
    assertEqual(lookup.getCodeByName("Español"), "es", "Should find 'es' for 'Español'");
    assertEqual(lookup.getCodeByName("Français"), "fr", "Should find 'fr' for 'Français'");
    assertEqual(lookup.getCodeByName("Deutsch"), "de", "Should find 'de' for 'Deutsch'");
  });

  // Test 3: Case-insensitive matching
  runTest("Case-insensitive English name lookup", () => {
    assertEqual(lookup.getCodeByName("english"), "en", "Should find 'en' for lowercase 'english'");
    assertEqual(lookup.getCodeByName("PORTUGUESE"), "pt", "Should find 'pt' for uppercase 'PORTUGUESE'");
    assertEqual(lookup.getCodeByName("SpAnIsH"), "es", "Should find 'es' for mixed case 'SpAnIsH'");
  });

  // Test 4: Case-insensitive native name lookup
  runTest("Case-insensitive native name lookup", () => {
    assertEqual(lookup.getCodeByName("português"), "pt", "Should find 'pt' for lowercase 'português'");
    assertEqual(lookup.getCodeByName("ESPAÑOL"), "es", "Should find 'es' for uppercase 'ESPAÑOL'");
    assertEqual(lookup.getCodeByName("français"), "fr", "Should find 'fr' for lowercase 'français'");
  });

  // Test 5: Whitespace handling
  runTest("Whitespace trimming", () => {
    assertEqual(lookup.getCodeByName("  English  "), "en", "Should trim whitespace around 'English'");
    assertEqual(lookup.getCodeByName(" Português "), "pt", "Should trim whitespace around 'Português'");
  });

  // Test 6: Non-Latin scripts
  runTest("Non-Latin script support", () => {
    assertEqual(lookup.getCodeByName("日本語"), "ja", "Should find 'ja' for Japanese native name");
    assertEqual(lookup.getCodeByName("中文"), "zh", "Should find 'zh' for Chinese native name");
  });

  // Test 7: Invalid names
  runTest("Invalid name returns undefined", () => {
    assertEqual(lookup.getCodeByName("InvalidLanguage"), undefined, "Should return undefined for invalid name");
    assertEqual(lookup.getCodeByName(""), undefined, "Should return undefined for empty string");
    assertEqual(lookup.getCodeByName("   "), undefined, "Should return undefined for whitespace only");
  });

  // Test 8: Get names by code
  runTest("Get names by code", () => {
    const ptNames = lookup.getNamesByCode("pt");
    assertTrue(!!ptNames, "Should return names for 'pt'");
    assertEqual(ptNames?.english, "Portuguese", "English name should be 'Portuguese'");
    assertEqual(ptNames?.native, "Português", "Native name should be 'Português'");

    const esNames = lookup.getNamesByCode("es");
    assertTrue(!!esNames, "Should return names for 'es'");
    assertEqual(esNames?.english, "Spanish", "English name should be 'Spanish'");
    assertEqual(esNames?.native, "Español", "Native name should be 'Español'");
  });

  // Test 9: Get all aliases
  runTest("Get all aliases for a language", () => {
    const ptAliases = lookup.getAllAliases("pt");
    assertEqual(ptAliases.length, 2, "Should have 2 aliases for Portuguese");
    assertTrue(ptAliases.includes("Portuguese"), "Should include English name");
    assertTrue(ptAliases.includes("Português"), "Should include native name");

    const enAliases = lookup.getAllAliases("en");
    assertEqual(enAliases.length, 1, "Should have 1 alias for English (same English and native)");
    assertTrue(enAliases.includes("English"), "Should include English name");
  });

  // Test 10: Has code
  runTest("Check if code exists", () => {
    assertTrue(lookup.hasCode("pt"), "Should have code 'pt'");
    assertTrue(lookup.hasCode("es"), "Should have code 'es'");
    assertFalse(lookup.hasCode("invalid"), "Should not have code 'invalid'");
  });

  // Test 11: Has name
  runTest("Check if name exists", () => {
    assertTrue(lookup.hasName("Portuguese"), "Should have name 'Portuguese'");
    assertTrue(lookup.hasName("Português"), "Should have name 'Português'");
    assertTrue(lookup.hasName("portuguese"), "Should have name 'portuguese' (case-insensitive)");
    assertFalse(lookup.hasName("InvalidLanguage"), "Should not have name 'InvalidLanguage'");
  });

  // Test 12: Get all codes
  runTest("Get all language codes", () => {
    const codes = lookup.getAllCodes();
    assertEqual(codes.length, 7, "Should have 7 language codes");
    assertTrue(codes.includes("en"), "Should include 'en'");
    assertTrue(codes.includes("pt"), "Should include 'pt'");
    assertTrue(codes.includes("es"), "Should include 'es'");
  });

  // Test 13: Legacy conversion - toLegacyLanguageMap
  runTest("Convert to legacy language map (English)", () => {
    const legacy = toLegacyLanguageMap(testLanguageData, false);
    assertEqual(legacy.pt, "Portuguese", "Should use English name for 'pt'");
    assertEqual(legacy.es, "Spanish", "Should use English name for 'es'");
  });

  // Test 14: Legacy conversion - toLegacyLanguageMap (native)
  runTest("Convert to legacy language map (native)", () => {
    const legacy = toLegacyLanguageMap(testLanguageData, true);
    assertEqual(legacy.pt, "Português", "Should use native name for 'pt'");
    assertEqual(legacy.es, "Español", "Should use native name for 'es'");
  });

  // Test 15: Legacy conversion - fromLegacyLanguageMap
  runTest("Convert from legacy language map", () => {
    const legacy: LanguageMap = {
      pt: "Portuguese",
      es: "Spanish",
    };
    const enhanced = fromLegacyLanguageMap(legacy);
    assertEqual(enhanced.pt.englishName, "Portuguese", "Should set English name");
    assertEqual(enhanced.pt.nativeName, "Portuguese", "Should fallback native to English");
    assertEqual(enhanced.es.englishName, "Spanish", "Should set English name");
    assertEqual(enhanced.es.nativeName, "Spanish", "Should fallback native to English");
  });

  // Test 16: Edge case - Same English and native names
  runTest("Handle same English and native names", () => {
    const enNames = lookup.getNamesByCode("en");
    assertEqual(enNames?.english, "English", "English name should be 'English'");
    assertEqual(enNames?.native, "English", "Native name should also be 'English'");

    const aliases = lookup.getAllAliases("en");
    assertEqual(aliases.length, 1, "Should have only 1 alias when names are the same");
  });

  // Test 17: Normalization consistency
  runTest("Normalization is consistent", () => {
    assertEqual(lookup.getCodeByName("Portuguese"), lookup.getCodeByName("PORTUGUESE"), "Different cases should match same code");
    assertEqual(lookup.getCodeByName("Português"), lookup.getCodeByName("PORTUGUÊS"), "Native name case variations should match");
  });

  // ═══════════════════════════════════════════════════════════════════════
  // GROUP: Edge Case Tests (Production Hardening)
  // ═══════════════════════════════════════════════════════════════════════

  // Test 18: Null/undefined handling - getCodeByName
  runTest("Null/undefined handling in getCodeByName", () => {
    assertEqual(lookup.getCodeByName(null), undefined, "Should return undefined for null");
    assertEqual(lookup.getCodeByName(undefined), undefined, "Should return undefined for undefined");
    assertEqual(lookup.getCodeByName(""), undefined, "Should return undefined for empty string");
  });

  // Test 19: Null/undefined handling - getNamesByCode
  runTest("Null/undefined handling in getNamesByCode", () => {
    assertEqual(lookup.getNamesByCode(null), undefined, "Should return undefined for null");
    assertEqual(lookup.getNamesByCode(undefined), undefined, "Should return undefined for undefined");
    assertEqual(lookup.getNamesByCode(""), undefined, "Should return undefined for empty string");
  });

  // Test 20: Null/undefined handling - getAllAliases
  runTest("Null/undefined handling in getAllAliases", () => {
    assertEqual(lookup.getAllAliases(null).length, 0, "Should return empty array for null");
    assertEqual(lookup.getAllAliases(undefined).length, 0, "Should return empty array for undefined");
    assertEqual(lookup.getAllAliases("").length, 0, "Should return empty array for empty string");
  });

  // Test 21: Null/undefined handling - hasCode
  runTest("Null/undefined handling in hasCode", () => {
    assertFalse(lookup.hasCode(null), "Should return false for null");
    assertFalse(lookup.hasCode(undefined), "Should return false for undefined");
    assertFalse(lookup.hasCode(""), "Should return false for empty string");
  });

  // Test 22: Null/undefined handling - hasName
  runTest("Null/undefined handling in hasName", () => {
    assertFalse(lookup.hasName(null), "Should return false for null");
    assertFalse(lookup.hasName(undefined), "Should return false for undefined");
    assertFalse(lookup.hasName(""), "Should return false for empty string");
  });

  // Test 23: Null/undefined handling - normalize
  runTest("Null/undefined handling in normalize", () => {
    assertEqual(lookup.normalize(null), "", "Should return empty string for null");
    assertEqual(lookup.normalize(undefined), "", "Should return empty string for undefined");
    assertEqual(lookup.normalize(""), "", "Should return empty string for empty string");
  });

  // Test 24: Very long string handling
  runTest("Very long string handling", () => {
    const longString = "a".repeat(1000);
    assertEqual(lookup.getCodeByName(longString), undefined, "Should handle very long strings without crashing");
    assertEqual(lookup.normalize(longString).length, 1000, "Should normalize very long strings");
  });

  // Test 25: Special characters in names
  runTest("Special characters handling", () => {
    // Languages with special characters should work
    assertTrue(lookup.hasName("Français"), "Should handle accented characters");
    assertTrue(lookup.hasName("Español"), "Should handle Spanish ñ and accents");
    assertTrue(lookup.hasName("Português"), "Should handle Portuguese accents");
  });

  // Test 26: Unicode normalization edge cases
  runTest("Unicode handling", () => {
    // Test non-Latin scripts
    assertTrue(lookup.hasName("日本語"), "Should handle Japanese characters");
    assertTrue(lookup.hasName("中文"), "Should handle Chinese characters");
    assertEqual(lookup.getCodeByName("日本語"), "ja", "Should find correct code for Japanese");
    assertEqual(lookup.getCodeByName("中文"), "zh", "Should find correct code for Chinese");
  });

  // Test 27: Excessive whitespace handling
  runTest("Excessive whitespace handling", () => {
    assertEqual(lookup.getCodeByName("   Portuguese   "), "pt", "Should trim multiple spaces");
    assertEqual(lookup.getCodeByName("Portuguese   "), "pt", "Should trim trailing spaces");
    assertEqual(lookup.getCodeByName("   Portuguese"), "pt", "Should trim leading spaces");
    assertEqual(lookup.getCodeByName("\tPortuguese\n"), "pt", "Should trim tabs and newlines");
  });

  // Test 28: Case consistency with Turkish locale
  runTest("Turkish locale case handling", () => {
    // Verify that 'I' converts to 'i' not 'ı' (Turkish behavior)
    const normalized = lookup.normalize("IRISH");
    assertEqual(normalized, "irish", "Should use en-US locale for normalization");
    // Verify lookup works
    assertTrue(lookup.hasName("IRISH"), "Should find Irish in uppercase");
    assertTrue(lookup.hasName("irish"), "Should find Irish in lowercase");
  });

  // Print test results
  Logger.log("\n=== Language Lookup Test Results ===");
  Logger.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  Logger.log(`Passed: ${testResults.passed}`);
  Logger.log(`Failed: ${testResults.failed}`);
  Logger.log("\nDetailed Results:");

  for (const test of testResults.tests) {
    const status = test.passed ? "✓ PASS" : "✗ FAIL";
    Logger.log(`${status}: ${test.name}`);
    if (!test.passed && test.error) {
      Logger.log(`  Error: ${test.error}`);
    }
  }

  // Show summary in UI
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (spreadsheet) {
    const message = `Tests: ${testResults.passed + testResults.failed}\nPassed: ${testResults.passed}\nFailed: ${testResults.failed}`;
    spreadsheet.toast(message, "Language Lookup Tests", 10);
  }

  // Throw error if any tests failed
  if (testResults.failed > 0) {
    throw new Error(`${testResults.failed} test(s) failed. Check logs for details.`);
  }
}

/**
 * Quick smoke test for language lookup
 * Tests the most critical functionality only
 */
function testLanguageLookupQuick(): void {
  // Environment check
  if (typeof Logger === "undefined") {
    throw new Error("Logger not available - tests must run in Apps Script environment");
  }

  const testData: LanguageMapEnhanced = {
    en: { englishName: "English", nativeName: "English" },
    pt: { englishName: "Portuguese", nativeName: "Português" },
    es: { englishName: "Spanish", nativeName: "Español" },
  };

  const lookup = createLanguageLookup(testData);

  // Critical tests
  const tests = [
    { name: "English by English name", actual: lookup.getCodeByName("English"), expected: "en" },
    { name: "Portuguese by English name", actual: lookup.getCodeByName("Portuguese"), expected: "pt" },
    { name: "Portuguese by native name", actual: lookup.getCodeByName("Português"), expected: "pt" },
    { name: "Case-insensitive Portuguese", actual: lookup.getCodeByName("PORTUGUESE"), expected: "pt" },
    { name: "Case-insensitive native", actual: lookup.getCodeByName("português"), expected: "pt" },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    if (test.actual === test.expected) {
      Logger.log(`✓ ${test.name}`);
      passed++;
    } else {
      Logger.log(`✗ ${test.name}: expected ${test.expected}, got ${test.actual}`);
      failed++;
    }
  }

  Logger.log(`\nQuick Test Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    throw new Error(`${failed} quick test(s) failed`);
  }
}
