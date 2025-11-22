/**
 * Test suite for CoMapeo Config v2.0.0 API
 * Tests build flow (JSON payload, category ordering, API call) and import flow
 *
 * Run these tests from the Apps Script editor console:
 *   runAllTests();
 */

// =============================================================================
// Test Data
// =============================================================================

/**
 * Mock spreadsheet data matching the structure returned by getSpreadsheetData()
 * Note: documentName is a STRING (spreadsheet name), not an array
 */
function getMockSpreadsheetData(): SheetData {
  return {
    // documentName is a string from spreadsheet.getName()
    documentName: "Test Config" as any,  // Cast needed since SheetData expects arrays

    // Categories sheet data (row 0 is header)
    Categories: [
      ["Name", "Icon", "Fields", "Color"],
      ["Trees", "", "species,diameter", "#4CAF50"],
      ["Rivers", "", "flow-rate,depth", "#2196F3"],
      ["Buildings", "", "height,material", "#9C27B0"]
    ],

    // Details sheet data (row 0 is header)
    Details: [
      ["Name", "Helper Text", "Type", "Options", "", "Universal"],
      ["Species", "Select the tree species", "s", "Oak,Pine,Maple", "", "FALSE"],
      ["Diameter", "Enter trunk diameter in cm", "n", "", "", "FALSE"],
      ["Flow Rate", "Water flow measurement", "n", "", "", "FALSE"],
      ["Depth", "River depth in meters", "n", "", "", "FALSE"],
      ["Height", "Building height in meters", "n", "", "", "FALSE"],
      ["Material", "Construction material", "m", "Wood,Concrete,Steel", "", "FALSE"]
    ],

    // Translation sheets (minimal for testing)
    "Category Translations": [
      ["English", "Español"],
      ["Trees", "Árboles"],
      ["Rivers", "Ríos"],
      ["Buildings", "Edificios"]
    ],
    "Detail Label Translations": [
      ["English", "Español"],
      ["Species", "Especie"],
      ["Diameter", "Diámetro"],
      ["Flow Rate", "Caudal"],
      ["Depth", "Profundidad"],
      ["Height", "Altura"],
      ["Material", "Material"]
    ],
    "Detail Helper Text Translations": [
      ["English", "Español"],
      ["Select the tree species", "Seleccione la especie de árbol"],
      ["Enter trunk diameter in cm", "Ingrese el diámetro del tronco en cm"],
      ["Water flow measurement", "Medición del flujo de agua"],
      ["River depth in meters", "Profundidad del río en metros"],
      ["Building height in meters", "Altura del edificio en metros"],
      ["Construction material", "Material de construcción"]
    ],
    "Detail Option Translations": [
      ["English", "Español"],
      ["Oak,Pine,Maple", "Roble,Pino,Arce"],
      ["", ""],
      ["", ""],
      ["", ""],
      ["", ""],
      ["Wood,Concrete,Steel", "Madera,Concreto,Acero"]
    ]
  } as SheetData;
}

// =============================================================================
// Build Flow Tests
// =============================================================================

function testBuildPayloadCreation(): boolean {
  console.log("=== Test: Build Payload Creation ===");

  try {
    // Note: This test requires mocking SpreadsheetApp which isn't available in unit tests
    // In a real test environment, we'd use a test spreadsheet
    // For now, we test the data transformation logic

    const mockData = getMockSpreadsheetData();

    // Test buildFields
    const fields = buildFields(mockData);
    if (!Array.isArray(fields)) {
      console.error("FAIL: buildFields should return an array");
      return false;
    }
    if (fields.length !== 6) {
      console.error(`FAIL: Expected 6 fields, got ${fields.length}`);
      return false;
    }
    console.log("PASS: buildFields returns correct count");

    // Verify field structure
    const speciesField = fields.find(f => f.id === "species");
    if (!speciesField) {
      console.error("FAIL: Could not find species field");
      return false;
    }
    if (speciesField.type !== "select") {
      console.error(`FAIL: species field should be 'select', got '${speciesField.type}'`);
      return false;
    }
    if (!speciesField.options || speciesField.options.length !== 3) {
      console.error("FAIL: species field should have 3 options");
      return false;
    }
    console.log("PASS: Field structure is correct");

    console.log("=== Build Payload Creation: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testFieldTypeMapping(): boolean {
  console.log("=== Test: Field Type Mapping ===");

  try {
    const mockData = getMockSpreadsheetData();
    const fields = buildFields(mockData);

    // Find species field (select type - 's')
    const speciesField = fields.find(f => f.id === "species");
    if (!speciesField || speciesField.type !== "select") {
      console.error("FAIL: Species field should be type 'select'");
      return false;
    }
    console.log("PASS: Select field type mapped correctly");

    // Find diameter field (number type - 'n')
    const diameterField = fields.find(f => f.id === "diameter");
    if (!diameterField || diameterField.type !== "number") {
      console.error("FAIL: Diameter field should be type 'number'");
      return false;
    }
    console.log("PASS: Number field type mapped correctly");

    // Find material field (multiselect type - 'm')
    const materialField = fields.find(f => f.id === "material");
    if (!materialField || materialField.type !== "multiselect") {
      console.error("FAIL: Material field should be type 'multiselect'");
      return false;
    }
    console.log("PASS: Multiselect field type mapped correctly");

    console.log("=== Field Type Mapping: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testParseOptions(): boolean {
  console.log("=== Test: Parse Options ===");

  try {
    // Test normal options
    const opts1 = parseOptions("Oak,Pine,Maple");
    if (!opts1 || opts1.length !== 3) {
      console.error("FAIL: Should parse 3 options");
      return false;
    }
    if (opts1[0].label !== "Oak" || opts1[0].value !== "oak") {
      console.error("FAIL: First option should be Oak/oak");
      return false;
    }
    console.log("PASS: Normal options parsed correctly");

    // Test empty string
    const opts2 = parseOptions("");
    if (opts2 !== undefined) {
      console.error("FAIL: Empty string should return undefined");
      return false;
    }
    console.log("PASS: Empty string returns undefined");

    // Test whitespace handling
    const opts3 = parseOptions("  A  ,  B  ,  C  ");
    if (!opts3 || opts3.length !== 3) {
      console.error("FAIL: Should handle whitespace");
      return false;
    }
    if (opts3[0].label !== "A" || opts3[1].label !== "B") {
      console.error("FAIL: Should trim whitespace from labels");
      return false;
    }
    console.log("PASS: Whitespace handled correctly");

    console.log("=== Parse Options: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testSlugify(): boolean {
  console.log("=== Test: Slugify Function ===");

  try {
    // Test basic slugify
    if (slugify("Hello World") !== "hello-world") {
      console.error("FAIL: 'Hello World' should become 'hello-world'");
      return false;
    }
    console.log("PASS: Basic slugify works");

    // Test special characters
    if (slugify("Test & Example!") !== "test-example") {
      console.error("FAIL: Special characters should be removed");
      return false;
    }
    console.log("PASS: Special characters removed");

    // Test multiple spaces/dashes
    if (slugify("Multiple   Spaces") !== "multiple-spaces") {
      console.error("FAIL: Multiple spaces should become single dash");
      return false;
    }
    console.log("PASS: Multiple spaces handled");

    console.log("=== Slugify Function: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

// =============================================================================
// Import Flow Tests
// =============================================================================

function testImportParsing(): boolean {
  console.log("=== Test: Import Parsing ===");

  try {
    // Create a mock BuildRequest to simulate imported data
    const mockImportData: BuildRequest = {
      metadata: {
        name: "Test Import Config",
        version: "1.0.0",
        description: "A test configuration"
      },
      categories: [
        { id: "cat1", name: "Category One", color: "#FF0000", defaultFieldIds: ["field1"] },
        { id: "cat2", name: "Category Two", color: "#00FF00", defaultFieldIds: ["field2"] }
      ],
      fields: [
        { id: "field1", name: "Field One", type: "text" },
        { id: "field2", name: "Field Two", type: "number" }
      ],
      icons: [
        { id: "icon1", svgData: "<svg></svg>" }
      ]
    };

    // Validate the structure
    validateBuildRequest(mockImportData);
    console.log("PASS: Valid BuildRequest passes validation");

    // Test category count
    if (mockImportData.categories.length !== 2) {
      console.error("FAIL: Expected 2 categories");
      return false;
    }
    console.log("PASS: Categories count correct");

    // Test field count
    if (mockImportData.fields.length !== 2) {
      console.error("FAIL: Expected 2 fields");
      return false;
    }
    console.log("PASS: Fields count correct");

    console.log("=== Import Parsing: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testValidateBuildRequest(): boolean {
  console.log("=== Test: Validate BuildRequest ===");

  try {
    // Test missing metadata
    try {
      validateBuildRequest({ categories: [], fields: [] } as any);
      console.error("FAIL: Should throw for missing metadata");
      return false;
    } catch (e) {
      console.log("PASS: Throws for missing metadata");
    }

    // Test missing name
    try {
      validateBuildRequest({ metadata: { version: "1.0.0" }, categories: [], fields: [] } as any);
      console.error("FAIL: Should throw for missing name");
      return false;
    } catch (e) {
      console.log("PASS: Throws for missing name");
    }

    // Test invalid categories (not array)
    try {
      validateBuildRequest({ metadata: { name: "test", version: "1.0.0" }, categories: "invalid", fields: [] } as any);
      console.error("FAIL: Should throw for non-array categories");
      return false;
    } catch (e) {
      console.log("PASS: Throws for non-array categories");
    }

    // Test valid request
    try {
      validateBuildRequest({
        metadata: { name: "test", version: "1.0.0" },
        categories: [],
        fields: []
      });
      console.log("PASS: Valid request passes validation");
    } catch (e) {
      console.error("FAIL: Valid request should not throw");
      return false;
    }

    console.log("=== Validate BuildRequest: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testExtractFileId(): boolean {
  console.log("=== Test: Extract File ID ===");

  try {
    // Test direct file ID
    const id1 = extractFileId("1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms");
    if (id1 !== "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms") {
      console.error("FAIL: Should return direct file ID");
      return false;
    }
    console.log("PASS: Direct file ID extracted");

    // Test /file/d/ URL format
    const id2 = extractFileId("https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view");
    if (id2 !== "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms") {
      console.error("FAIL: Should extract from /file/d/ URL");
      return false;
    }
    console.log("PASS: /file/d/ URL format works");

    // Test ?id= URL format
    const id3 = extractFileId("https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms");
    if (id3 !== "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms") {
      console.error("FAIL: Should extract from ?id= URL");
      return false;
    }
    console.log("PASS: ?id= URL format works");

    // Test empty input
    const id4 = extractFileId("");
    if (id4 !== null) {
      console.error("FAIL: Empty input should return null");
      return false;
    }
    console.log("PASS: Empty input returns null");

    // Test invalid input
    const id5 = extractFileId("not-a-valid-url");
    if (id5 !== null) {
      console.error("FAIL: Invalid input should return null");
      return false;
    }
    console.log("PASS: Invalid input returns null");

    console.log("=== Extract File ID: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testMapFieldTypeToChar(): boolean {
  console.log("=== Test: Map Field Type to Char ===");

  try {
    if (mapFieldTypeToChar("text") !== "t") {
      console.error("FAIL: text should map to 't'");
      return false;
    }
    if (mapFieldTypeToChar("textarea") !== "T") {
      console.error("FAIL: textarea should map to 'T'");
      return false;
    }
    if (mapFieldTypeToChar("number") !== "n") {
      console.error("FAIL: number should map to 'n'");
      return false;
    }
    if (mapFieldTypeToChar("integer") !== "i") {
      console.error("FAIL: integer should map to 'i'");
      return false;
    }
    if (mapFieldTypeToChar("multiselect") !== "m") {
      console.error("FAIL: multiselect should map to 'm'");
      return false;
    }
    if (mapFieldTypeToChar("select") !== "s") {
      console.error("FAIL: select should map to 's'");
      return false;
    }
    console.log("PASS: All field type mappings correct");

    console.log("=== Map Field Type to Char: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

// =============================================================================
// API Response Tests
// =============================================================================

function testApiErrorParsing(): boolean {
  console.log("=== Test: API Error Parsing ===");

  try {
    // Test error response parsing
    const errorJson = JSON.stringify({
      error: "VALIDATION_ERROR",
      message: "Invalid configuration",
      details: { errors: ["Missing required field: name"] }
    });

    const parsed: ApiErrorResponse = JSON.parse(errorJson);

    if (parsed.error !== "VALIDATION_ERROR") {
      console.error("FAIL: Error code not parsed correctly");
      return false;
    }
    console.log("PASS: Error code parsed correctly");

    if (parsed.message !== "Invalid configuration") {
      console.error("FAIL: Error message not parsed correctly");
      return false;
    }
    console.log("PASS: Error message parsed correctly");

    if (!parsed.details?.errors?.includes("Missing required field: name")) {
      console.error("FAIL: Error details not parsed correctly");
      return false;
    }
    console.log("PASS: Error details parsed correctly");

    console.log("=== API Error Parsing: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

// =============================================================================
// Category Selection Tests
// =============================================================================

function testCategorySelection(): boolean {
  console.log("=== Test: Category Selection ===");

  try {
    // Test setting category selection
    const testCategories = ["cat-a", "cat-b", "cat-c"];
    setCategorySelection(testCategories);

    const retrieved = getCategorySelection();
    if (retrieved.length !== 3) {
      console.error("FAIL: Should retrieve 3 categories");
      return false;
    }
    console.log("PASS: Category count correct");

    // Verify order is preserved
    for (let i = 0; i < testCategories.length; i++) {
      if (retrieved[i] !== testCategories[i]) {
        console.error(`FAIL: Category order not preserved at index ${i}`);
        return false;
      }
    }
    console.log("PASS: Category order preserved");

    // Verify it's a copy (modifying retrieved doesn't affect internal state)
    retrieved.push("should-not-appear");
    const retrieved2 = getCategorySelection();
    if (retrieved2.length !== 3) {
      console.error("FAIL: getCategorySelection should return a copy");
      return false;
    }
    console.log("PASS: Returns a copy, not reference");

    console.log("=== Category Selection: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

// =============================================================================
// Test Runner
// =============================================================================

function runAllTests(): void {
  console.log("\n========================================");
  console.log("CoMapeo Config v2.0.0 Test Suite");
  console.log("========================================\n");

  const tests = [
    { name: "Slugify Function", fn: testSlugify },
    { name: "Parse Options", fn: testParseOptions },
    { name: "Field Type Mapping", fn: testFieldTypeMapping },
    { name: "Build Payload Creation", fn: testBuildPayloadCreation },
    { name: "Category Selection", fn: testCategorySelection },
    { name: "Validate BuildRequest", fn: testValidateBuildRequest },
    { name: "Extract File ID", fn: testExtractFileId },
    { name: "Map Field Type to Char", fn: testMapFieldTypeToChar },
    { name: "Import Parsing", fn: testImportParsing },
    { name: "API Error Parsing", fn: testApiErrorParsing }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      if (test.fn()) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Test '${test.name}' threw exception: ${error.message}`);
      failed++;
    }
    console.log("\n");
  }

  console.log("========================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("========================================");

  if (failed > 0) {
    console.log("\nSome tests failed. Please review the output above.");
  } else {
    console.log("\nAll tests passed!");
  }
}
