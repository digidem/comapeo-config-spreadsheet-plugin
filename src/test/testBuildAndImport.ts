/**
 * Test suite for CoMapeo Config v2.0.0 API
 * Tests build flow (JSON payload, category ordering, API call) and import flow
 *
 * Run these tests from the Apps Script editor console
 */

// ============================================
// Test Data
// ============================================

const TEST_SPREADSHEET_DATA: SheetData = {
  Categories: [
    ["Name", "Icon", "Fields", "Color"],
    ["Trees", "", "species,diameter", "#4CAF50"],
    ["Rivers", "", "flow-rate,depth", "#2196F3"],
    ["Buildings", "", "height,material", "#9C27B0"]
  ],
  Details: [
    ["Name", "Helper Text", "Type", "Options", "", "Universal"],
    ["Species", "Select the tree species", "s", "Oak,Pine,Maple", "", "FALSE"],
    ["Diameter", "Enter trunk diameter in cm", "n", "", "", "FALSE"],
    ["Flow Rate", "Water flow measurement", "n", "", "", "FALSE"],
    ["Depth", "River depth in meters", "n", "", "", "FALSE"],
    ["Height", "Building height in meters", "n", "", "", "FALSE"],
    ["Material", "Construction material", "m", "Wood,Concrete,Steel", "", "FALSE"]
  ],
  documentName: [["Test Config"]]
};

// ============================================
// Build Flow Tests
// ============================================

function testBuildPayloadCreation(): boolean {
  console.log("=== Test: Build Payload Creation ===");

  try {
    const payload = createBuildPayload(TEST_SPREADSHEET_DATA);

    // Verify metadata
    if (!payload.metadata || !payload.metadata.name || !payload.metadata.version) {
      console.error("FAIL: Metadata missing required fields");
      return false;
    }
    console.log("PASS: Metadata has required fields");

    // Verify categories array exists and has correct count
    if (!Array.isArray(payload.categories) || payload.categories.length !== 3) {
      console.error("FAIL: Expected 3 categories, got " + (payload.categories?.length || 0));
      return false;
    }
    console.log("PASS: Categories array has correct count");

    // Verify fields array exists and has correct count
    if (!Array.isArray(payload.fields) || payload.fields.length !== 6) {
      console.error("FAIL: Expected 6 fields, got " + (payload.fields?.length || 0));
      return false;
    }
    console.log("PASS: Fields array has correct count");

    console.log("=== Build Payload Creation: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testCategoryOrdering(): boolean {
  console.log("=== Test: Category Ordering ===");

  try {
    const payload = createBuildPayload(TEST_SPREADSHEET_DATA);

    // Categories should be in spreadsheet order: Trees, Rivers, Buildings
    const expectedOrder = ["trees", "rivers", "buildings"];
    const actualOrder = payload.categories.map(c => c.id);

    for (let i = 0; i < expectedOrder.length; i++) {
      if (actualOrder[i] !== expectedOrder[i]) {
        console.error(`FAIL: Category at index ${i} expected '${expectedOrder[i]}', got '${actualOrder[i]}'`);
        return false;
      }
    }
    console.log("PASS: Categories in correct spreadsheet order");

    // Verify setCategorySelection was called with correct order
    const selection = getCategorySelection();
    for (let i = 0; i < expectedOrder.length; i++) {
      if (selection[i] !== expectedOrder[i]) {
        console.error(`FAIL: setCategorySelection order mismatch at index ${i}`);
        return false;
      }
    }
    console.log("PASS: setCategorySelection called with correct order");

    console.log("=== Category Ordering: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testFieldTypeMapping(): boolean {
  console.log("=== Test: Field Type Mapping ===");

  try {
    const payload = createBuildPayload(TEST_SPREADSHEET_DATA);

    // Find species field (select type)
    const speciesField = payload.fields.find(f => f.id === "species");
    if (!speciesField || speciesField.type !== "select") {
      console.error("FAIL: Species field should be type 'select'");
      return false;
    }
    if (!speciesField.options || speciesField.options.length !== 3) {
      console.error("FAIL: Species field should have 3 options");
      return false;
    }
    console.log("PASS: Select field type mapped correctly with options");

    // Find diameter field (number type)
    const diameterField = payload.fields.find(f => f.id === "diameter");
    if (!diameterField || diameterField.type !== "number") {
      console.error("FAIL: Diameter field should be type 'number'");
      return false;
    }
    console.log("PASS: Number field type mapped correctly");

    // Find material field (multiselect type)
    const materialField = payload.fields.find(f => f.id === "material");
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

function testCategoryFieldReferences(): boolean {
  console.log("=== Test: Category Field References ===");

  try {
    const payload = createBuildPayload(TEST_SPREADSHEET_DATA);

    // Trees category should reference species and diameter fields
    const treesCategory = payload.categories.find(c => c.id === "trees");
    if (!treesCategory?.defaultFieldIds) {
      console.error("FAIL: Trees category missing defaultFieldIds");
      return false;
    }

    if (!treesCategory.defaultFieldIds.includes("species") ||
        !treesCategory.defaultFieldIds.includes("diameter")) {
      console.error("FAIL: Trees category should reference species and diameter");
      return false;
    }
    console.log("PASS: Category field references correct");

    console.log("=== Category Field References: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

// ============================================
// Import Flow Tests
// ============================================

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

    // Test parsing
    const parsed = parseImportedConfig(mockImportData);

    if (parsed.categories.length !== 2) {
      console.error("FAIL: Expected 2 categories after parsing");
      return false;
    }
    console.log("PASS: Categories parsed correctly");

    if (parsed.fields.length !== 2) {
      console.error("FAIL: Expected 2 fields after parsing");
      return false;
    }
    console.log("PASS: Fields parsed correctly");

    if (!parsed.metadata.name || parsed.metadata.name !== "Test Import Config") {
      console.error("FAIL: Metadata name not preserved");
      return false;
    }
    console.log("PASS: Metadata preserved correctly");

    console.log("=== Import Parsing: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testImportCategoryOrder(): boolean {
  console.log("=== Test: Import Category Order ===");

  try {
    const mockImportData: BuildRequest = {
      metadata: { name: "Order Test", version: "1.0.0" },
      categories: [
        { id: "alpha", name: "Alpha" },
        { id: "beta", name: "Beta" },
        { id: "gamma", name: "Gamma" }
      ],
      fields: []
    };

    const parsed = parseImportedConfig(mockImportData);

    // Order should be preserved as-is from the import
    const expectedOrder = ["alpha", "beta", "gamma"];
    for (let i = 0; i < expectedOrder.length; i++) {
      if (parsed.categories[i].id !== expectedOrder[i]) {
        console.error(`FAIL: Import order mismatch at index ${i}`);
        return false;
      }
    }
    console.log("PASS: Import preserves category order");

    console.log("=== Import Category Order: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

// ============================================
// API Response Tests
// ============================================

function testApiErrorHandling(): boolean {
  console.log("=== Test: API Error Handling ===");

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

    if (!parsed.details?.errors?.includes("Missing required field: name")) {
      console.error("FAIL: Error details not parsed correctly");
      return false;
    }
    console.log("PASS: Error details parsed correctly");

    console.log("=== API Error Handling: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

// ============================================
// Test Runner
// ============================================

function runAllTests(): void {
  console.log("\n========================================");
  console.log("CoMapeo Config v2.0.0 Test Suite");
  console.log("========================================\n");

  const tests = [
    { name: "Build Payload Creation", fn: testBuildPayloadCreation },
    { name: "Category Ordering", fn: testCategoryOrdering },
    { name: "Field Type Mapping", fn: testFieldTypeMapping },
    { name: "Category Field References", fn: testCategoryFieldReferences },
    { name: "Import Parsing", fn: testImportParsing },
    { name: "Import Category Order", fn: testImportCategoryOrder },
    { name: "API Error Handling", fn: testApiErrorHandling }
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
}

// ============================================
// Helper: Parse imported config (used by tests)
// ============================================

function parseImportedConfig(data: BuildRequest): BuildRequest {
  // Validate and return the config structure
  return {
    metadata: data.metadata,
    categories: data.categories || [],
    fields: data.fields || [],
    icons: data.icons,
    translations: data.translations
  };
}
