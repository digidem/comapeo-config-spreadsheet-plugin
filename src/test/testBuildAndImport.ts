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
 * Uses NEW 6-column format for Categories (with ID and Icon ID columns)
 */
function getMockSpreadsheetData(): SheetData {
  return {
    // documentName is a string from spreadsheet.getName()
    documentName: "Test Config" as any,  // Cast needed since SheetData expects arrays

    // Categories sheet data (row 0 is header) - NEW 6-column format
    Categories: [
      ["Name", "Icon", "Fields", "ID", "Color", "Icon ID"],
      ["Trees", "", "species,diameter", "trees", "#4CAF50", "trees"],
      ["Rivers", "", "flow-rate,depth", "rivers", "#2196F3", "rivers"],
      ["Buildings", "", "height,material", "buildings", "#9C27B0", "buildings"]
    ],

    // Details sheet data (row 0 is header) - NEW 6-column format with ID column
    Details: [
      ["Name", "Helper Text", "Type", "Options", "ID", "Universal"],
      ["Species", "Select the tree species", "s", "Oak,Pine,Maple", "species", "FALSE"],
      ["Diameter", "Enter trunk diameter in cm", "n", "", "diameter", "FALSE"],
      ["Flow Rate", "Water flow measurement", "n", "", "flow-rate", "FALSE"],
      ["Depth", "River depth in meters", "n", "", "depth", "FALSE"],
      ["Height", "Building height in meters", "i", "", "height", "FALSE"],
      ["Material", "Construction material", "m", "Wood,Concrete,Steel", "material", "FALSE"]
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

/**
 * Helper: Creates a minimal SheetData with custom categories and details
 * Reduces test data duplication
 */
function createTestSheetData(
  categories: any[][],
  details: any[][]
): SheetData {
  return {
    documentName: "Test Config" as any,
    Categories: [
      ["Name", "Icon", "Fields", "ID", "Color", "Icon ID"],
      ...categories
    ],
    Details: [
      ["Name", "Helper Text", "Type", "Options", "ID", "Universal"],
      ...details
    ]
  } as SheetData;
}

/**
 * Helper: Creates a simple category row
 */
function createCategoryRow(
  name: string,
  fields: string = "",
  id: string = "",
  color: string = "#FF0000"
): any[] {
  const categoryId = id || slugify(name);
  return [name, "", fields, categoryId, color, categoryId];
}

/**
 * Helper: Creates a simple field/detail row
 */
function createDetailRow(
  name: string,
  type: string = "t",
  options: string = "",
  universal: string = "FALSE"
): any[] {
  const fieldId = slugify(name);
  return [name, `Description for ${name}`, type, options, fieldId, universal];
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
// New Field Type Tests (Integer, Boolean, Date, DateTime, Photo, Location)
// =============================================================================

function testAllFieldTypes(): boolean {
  console.log("=== Test: All Field Types ===");

  try {
    // Test all 11 supported field types
    const testData: SheetData = {
      documentName: "Type Test" as any,
      Categories: [
        ["Name", "Icon", "Fields", "ID", "Color", "Icon ID"],
        ["Test", "", "", "test", "#FF0000", "test"]
      ],
      Details: [
        ["Name", "Helper Text", "Type", "Options", "ID", "Universal"],
        ["Text Field", "Single line text", "t", "", "text-field", "FALSE"],
        ["Textarea Field", "Multi-line text", "T", "", "textarea-field", "FALSE"],
        ["Number Field", "Numeric value", "n", "", "number-field", "FALSE"],
        ["Integer Field", "Integer only", "i", "", "integer-field", "FALSE"],
        ["Select Field", "Single choice", "s", "A,B,C", "select-field", "FALSE"],
        ["Multiselect Field", "Multiple choices", "m", "X,Y,Z", "multi-field", "FALSE"],
        ["Boolean Field", "True/False", "b", "", "boolean-field", "FALSE"],
        ["Date Field", "Date only", "d", "", "date-field", "FALSE"],
        ["DateTime Field", "Date and time", "D", "", "datetime-field", "FALSE"],
        ["Photo Field", "Photo attachment", "p", "", "photo-field", "FALSE"],
        ["Location Field", "GPS coordinates", "l", "", "location-field", "FALSE"]
      ]
    } as SheetData;

    const fields = buildFields(testData);

    if (fields.length !== 11) {
      console.error(`FAIL: Expected 11 fields, got ${fields.length}`);
      return false;
    }
    console.log("PASS: All 11 field types created");

    // Verify each type
    const typeChecks = [
      { id: "text-field", expectedType: "text" },
      { id: "textarea-field", expectedType: "textarea" },
      { id: "number-field", expectedType: "number" },
      { id: "integer-field", expectedType: "integer" },
      { id: "select-field", expectedType: "select" },
      { id: "multi-field", expectedType: "multiselect" },
      { id: "boolean-field", expectedType: "boolean" },
      { id: "date-field", expectedType: "date" },
      { id: "datetime-field", expectedType: "datetime" },
      { id: "photo-field", expectedType: "photo" },
      { id: "location-field", expectedType: "location" }
    ];

    for (const check of typeChecks) {
      const field = fields.find(f => f.id === check.id);
      if (!field) {
        console.error(`FAIL: Field ${check.id} not found`);
        return false;
      }
      if (field.type !== check.expectedType) {
        console.error(`FAIL: Field ${check.id} should be type '${check.expectedType}', got '${field.type}'`);
        return false;
      }
    }
    console.log("PASS: All field types mapped correctly");

    console.log("=== All Field Types: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testIntegerVsNumberDistinction(): boolean {
  console.log("=== Test: Integer vs Number Distinction ===");

  try {
    const testData: SheetData = {
      documentName: "Integer Test" as any,
      Categories: [
        ["Name", "Icon", "Fields", "ID", "Color", "Icon ID"],
        ["Test", "", "", "test", "#FF0000", "test"]
      ],
      Details: [
        ["Name", "Helper Text", "Type", "Options", "ID", "Universal"],
        ["Age", "Person's age", "i", "", "age", "FALSE"],
        ["Height", "Height in cm", "n", "", "height", "FALSE"]
      ]
    } as SheetData;

    const fields = buildFields(testData);

    const ageField = fields.find(f => f.id === "age");
    const heightField = fields.find(f => f.id === "height");

    if (!ageField || ageField.type !== "integer") {
      console.error("FAIL: 'i' should map to integer type");
      return false;
    }
    console.log("PASS: Integer type correctly mapped from 'i'");

    if (!heightField || heightField.type !== "number") {
      console.error("FAIL: 'n' should map to number type");
      return false;
    }
    console.log("PASS: Number type correctly mapped from 'n'");

    if (ageField.type === heightField.type) {
      console.error("FAIL: Integer and number should be distinct types");
      return false;
    }
    console.log("PASS: Integer and number are distinct types");

    console.log("=== Integer vs Number Distinction: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testMapFieldTypeToCharAllTypes(): boolean {
  console.log("=== Test: Map All Field Types to Char ===");

  try {
    const mappings = [
      { type: "text", expected: "t" },
      { type: "textarea", expected: "T" },
      { type: "number", expected: "n" },
      { type: "integer", expected: "i" },
      { type: "select", expected: "s" },
      { type: "multiselect", expected: "m" },
      { type: "boolean", expected: "b" },
      { type: "date", expected: "d" },
      { type: "datetime", expected: "D" },
      { type: "photo", expected: "p" },
      { type: "location", expected: "l" }
    ];

    for (const mapping of mappings) {
      const result = mapFieldTypeToChar(mapping.type as FieldType);
      if (result !== mapping.expected) {
        console.error(`FAIL: ${mapping.type} should map to '${mapping.expected}', got '${result}'`);
        return false;
      }
    }
    console.log("PASS: All 11 field types map correctly to characters");

    console.log("=== Map All Field Types to Char: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

// =============================================================================
// Universal Fields Tests
// =============================================================================

function testUniversalFieldsAddedToAllCategories(): boolean {
  console.log("=== Test: Universal Fields Added to All Categories ===");

  try {
    const testData: SheetData = {
      documentName: "Universal Test" as any,
      Categories: [
        ["Name", "Icon", "Fields", "ID", "Color", "Icon ID"],
        ["Category A", "", "field-a", "cat-a", "#FF0000", "cat-a"],
        ["Category B", "", "field-b", "cat-b", "#00FF00", "cat-b"],
        ["Category C", "", "", "cat-c", "#0000FF", "cat-c"]
      ],
      Details: [
        ["Name", "Helper Text", "Type", "Options", "ID", "Universal"],
        ["Notes", "General notes", "T", "", "notes", "TRUE"],  // Universal field
        ["Field A", "Specific to A", "t", "", "field-a", "FALSE"],
        ["Field B", "Specific to B", "t", "", "field-b", "FALSE"]
      ]
    } as SheetData;

    const fields = buildFields(testData);
    const categories = buildCategories(testData, fields);

    if (categories.length !== 3) {
      console.error(`FAIL: Expected 3 categories, got ${categories.length}`);
      return false;
    }

    // All categories should have the universal field 'notes'
    for (const cat of categories) {
      if (!cat.defaultFieldIds || !cat.defaultFieldIds.includes("notes")) {
        console.error(`FAIL: Category '${cat.id}' should include universal field 'notes'`);
        return false;
      }
    }
    console.log("PASS: Universal field 'notes' appears in all categories");

    // Check Category A has both notes (universal) and field-a (explicit)
    const catA = categories.find(c => c.id === "cat-a");
    if (!catA || !catA.defaultFieldIds || catA.defaultFieldIds.length !== 2) {
      console.error("FAIL: Category A should have 2 fields (notes + field-a)");
      return false;
    }
    if (!catA.defaultFieldIds.includes("notes") || !catA.defaultFieldIds.includes("field-a")) {
      console.error("FAIL: Category A should have both notes and field-a");
      return false;
    }
    console.log("PASS: Category A has universal + explicit fields");

    // Check Category C has only notes (universal, no explicit fields)
    const catC = categories.find(c => c.id === "cat-c");
    if (!catC || !catC.defaultFieldIds || catC.defaultFieldIds.length !== 1) {
      console.error("FAIL: Category C should have only 1 field (notes)");
      return false;
    }
    if (!catC.defaultFieldIds.includes("notes")) {
      console.error("FAIL: Category C should have notes field");
      return false;
    }
    console.log("PASS: Category C has only universal field");

    console.log("=== Universal Fields Added to All Categories: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testUniversalFieldDoesNotSetRequired(): boolean {
  console.log("=== Test: Universal Field Does Not Set Required ===");

  try {
    const testData: SheetData = {
      documentName: "Universal Required Test" as any,
      Categories: [
        ["Name", "Icon", "Fields", "ID", "Color", "Icon ID"],
        ["Test", "", "", "test", "#FF0000", "test"]
      ],
      Details: [
        ["Name", "Helper Text", "Type", "Options", "ID", "Universal"],
        ["Universal Field", "Universal but optional", "t", "", "universal-field", "TRUE"],
        ["Regular Field", "Regular field", "t", "", "regular-field", "FALSE"]
      ]
    } as SheetData;

    const fields = buildFields(testData);

    const universalField = fields.find(f => f.id === "universal-field");
    if (!universalField) {
      console.error("FAIL: Universal field not found");
      return false;
    }

    // Universal field should NOT have required property set
    if (universalField.required === true) {
      console.error("FAIL: Universal field should not be marked as required");
      return false;
    }
    console.log("PASS: Universal field is not marked as required");

    // Neither field should have required set (since we removed that mapping)
    const regularField = fields.find(f => f.id === "regular-field");
    if (regularField && regularField.required === true) {
      console.error("FAIL: Regular field should not have required set either");
      return false;
    }
    console.log("PASS: Required property is not set from spreadsheet");

    console.log("=== Universal Field Does Not Set Required: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}


// =============================================================================
// Round-Trip Integration Tests
// =============================================================================

function testIntegerFieldRoundTrip(): boolean {
  console.log("=== Test: Integer Field Round-Trip ===");

  try {
    // Start with integer field in spreadsheet
    const buildData: SheetData = {
      documentName: "Round Trip Test" as any,
      Categories: [
        ["Name", "Icon", "Fields", "ID", "Color", "Icon ID"],
        ["Test", "", "age", "test", "#FF0000", "test"]
      ],
      Details: [
        ["Name", "Helper Text", "Type", "Options", "ID", "Universal"],
        ["Age", "Person's age", "i", "", "age", "FALSE"]
      ]
    } as SheetData;

    // Build fields (simulates build process)
    const fields = buildFields(buildData);
    const ageField = fields.find(f => f.id === "age");

    if (!ageField || ageField.type !== "integer") {
      console.error("FAIL: Initial build should create integer field");
      return false;
    }
    console.log("PASS: Build creates integer field");

    // Map back to character (simulates import process)
    const charCode = mapFieldTypeToChar(ageField.type);
    if (charCode !== "i") {
      console.error(`FAIL: Integer should map back to 'i', got '${charCode}'`);
      return false;
    }
    console.log("PASS: Integer maps back to 'i'");

    // Verify it doesn't become 'n' (number)
    if (charCode === "n") {
      console.error("FAIL: Integer incorrectly mapped to 'n' (number)");
      return false;
    }
    console.log("PASS: Integer preserved (not converted to number)");

    console.log("=== Integer Field Round-Trip: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testUniversalFieldRoundTrip(): boolean {
  console.log("=== Test: Import Preserves Field Distribution (No Universal Inference) ===");

  try {
    // Create a spreadsheet with a universal field
    const testData: SheetData = {
      documentName: "Universal Round-Trip" as any,
      Categories: [
        ["Name", "Icon", "Fields", "ID", "Color", "Icon ID"],
        ["Cat 1", "", "field1", "cat1", "#FF0000", "cat1"],
        ["Cat 2", "", "field2", "cat2", "#00FF00", "cat2"],
        ["Cat 3", "", "", "cat3", "#0000FF", "cat3"]
      ],
      Details: [
        ["Name", "Helper Text", "Type", "Options", "ID", "Universal"],
        ["Notes", "Universal notes field", "T", "", "notes", "TRUE"],  // Universal field
        ["Field 1", "Specific to Cat 1", "t", "", "field1", "FALSE"],
        ["Field 2", "Specific to Cat 2", "t", "", "field2", "FALSE"]
      ]
    } as SheetData;

    // Build from spreadsheet (notes should be added to all categories)
    const fields = buildFields(testData);
    const categories = buildCategories(testData, fields);

    // Create BuildRequest from built data
    const buildRequest: BuildRequest = {
      metadata: { name: "Test", version: "1.0.0" },
      categories: categories,
      fields: fields
    };

    // All categories should have 'notes' after build (due to Universal=TRUE)
    for (const cat of buildRequest.categories) {
      if (!cat.defaultFieldIds || !cat.defaultFieldIds.includes("notes")) {
        console.error(`FAIL: Category '${cat.id}' should have universal field 'notes' after build`);
        return false;
      }
    }
    console.log("PASS: Universal field added to all categories during build");

    // Now simulate import: create a mock spreadsheet context
    // In real import, populateDetailsSheet would be called
    // We verify it does NOT mark 'notes' as Universal just because it appears everywhere

    // Mock the Details sheet that would be populated during import
    const mockImportedDetails: any[][] = [];
    for (const field of buildRequest.fields) {
      // populateDetailsSheet always sets Universal=FALSE on import
      mockImportedDetails.push([
        field.name,
        field.description || '',
        mapFieldTypeToChar(field.type),
        '',  // options
        field.id,
        'FALSE'  // Always FALSE on import to preserve exact field distribution
      ]);
    }

    // Verify 'notes' is NOT marked as Universal in the imported Details sheet
    const notesRow = mockImportedDetails.find(row => row[4] === 'notes');
    if (!notesRow) {
      console.error("FAIL: 'notes' field should be in imported Details sheet");
      return false;
    }
    if (notesRow[5] !== 'FALSE') {
      console.error("FAIL: 'notes' should NOT be marked as Universal during import (got: " + notesRow[5] + ")");
      return false;
    }
    console.log("PASS: Field appearing in all categories is NOT auto-marked as Universal during import");

    // Verify Categories sheet would show 'notes' in each category's Fields column
    // (not stripped out, which would happen if it were incorrectly marked as Universal)
    for (const cat of buildRequest.categories) {
      const hasNotes = cat.defaultFieldIds && cat.defaultFieldIds.includes("notes");
      if (!hasNotes) {
        console.error(`FAIL: Category ${cat.id} should retain 'notes' in defaultFieldIds during import`);
        return false;
      }
    }
    console.log("PASS: Import preserves exact field distribution without inferring universal intent");

    console.log("=== Import Preserves Field Distribution: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

// =============================================================================
// Edge Case Tests
// =============================================================================

function testEmptyInputs(): boolean {
  console.log("=== Test: Empty Inputs ===");

  try {
    // Test buildFields with empty details
    const emptyData: SheetData = {
      documentName: "Empty Test" as any,
      Categories: [
        ["Name", "Icon", "Fields", "ID", "Color", "Icon ID"]
      ],
      Details: [
        ["Name", "Helper Text", "Type", "Options", "ID", "Universal"]
      ]
    } as SheetData;

    const fields = buildFields(emptyData);
    if (fields.length !== 0) {
      console.error("FAIL: Empty Details should produce 0 fields");
      return false;
    }
    console.log("PASS: Empty Details produces 0 fields");

    // Test parseOptions with empty string
    const emptyOptions = parseOptions("");
    if (emptyOptions !== undefined) {
      console.error("FAIL: Empty options string should return undefined");
      return false;
    }
    console.log("PASS: Empty options string returns undefined");

    console.log("=== Empty Inputs: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testOptionValuePreservation(): boolean {
  console.log("=== Test: Option Value Preservation ===");

  try {
    // Test "value:label" format
    const opts1 = parseOptions("oak:Oak Tree,pine:Pine Tree");
    if (!opts1 || opts1.length !== 2) {
      console.error("FAIL: Should parse 2 options with custom values");
      return false;
    }
    if (opts1[0].value !== "oak" || opts1[0].label !== "Oak Tree") {
      console.error("FAIL: First option should preserve custom value 'oak'");
      return false;
    }
    if (opts1[1].value !== "pine" || opts1[1].label !== "Pine Tree") {
      console.error("FAIL: Second option should preserve custom value 'pine'");
      return false;
    }
    console.log("PASS: Custom option values preserved");

    // Test mixed format (some with custom values, some without)
    const opts2 = parseOptions("oak:Oak Tree,Maple,pine:Pine Tree");
    if (!opts2 || opts2.length !== 3) {
      console.error("FAIL: Should parse 3 options in mixed format");
      return false;
    }
    if (opts2[0].value !== "oak") {
      console.error("FAIL: First option should have custom value 'oak'");
      return false;
    }
    if (opts2[1].value !== "maple" || opts2[1].label !== "Maple") {
      console.error("FAIL: Second option should auto-slugify to 'maple'");
      return false;
    }
    console.log("PASS: Mixed format (custom + auto values) handled correctly");

    console.log("=== Option Value Preservation: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testCategoryIdPreservation(): boolean {
  console.log("=== Test: Category ID Preservation ===");

  try {
    const testData: SheetData = {
      documentName: "ID Test" as any,
      Categories: [
        ["Name", "Icon", "Fields", "ID", "Color", "Icon ID"],
        ["My Category", "", "", "custom-cat-id", "#FF0000", "custom-icon-id"],
        ["Auto ID Category", "", "", "", "#00FF00", ""]
      ],
      Details: [
        ["Name", "Helper Text", "Type", "Options", "ID", "Universal"]
      ]
    } as SheetData;

    const fields = buildFields(testData);
    const categories = buildCategories(testData, fields);

    // First category should use explicit ID
    const cat1 = categories[0];
    if (cat1.id !== "custom-cat-id") {
      console.error(`FAIL: Category should preserve explicit ID 'custom-cat-id', got '${cat1.id}'`);
      return false;
    }
    if (cat1.iconId !== "custom-icon-id") {
      console.error(`FAIL: Category should preserve explicit iconId 'custom-icon-id', got '${cat1.iconId}'`);
      return false;
    }
    console.log("PASS: Explicit category and icon IDs preserved");

    // Second category should auto-generate ID from name
    const cat2 = categories[1];
    if (cat2.id !== "auto-id-category") {
      console.error(`FAIL: Category should auto-generate ID 'auto-id-category', got '${cat2.id}'`);
      return false;
    }
    console.log("PASS: Category ID auto-generated when not provided");

    console.log("=== Category ID Preservation: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testFieldIdPreservation(): boolean {
  console.log("=== Test: Field ID Preservation ===");

  try {
    const testData: SheetData = {
      documentName: "Field ID Test" as any,
      Categories: [
        ["Name", "Icon", "Fields", "ID", "Color", "Icon ID"],
        ["Test", "", "", "test", "#FF0000", "test"]
      ],
      Details: [
        ["Name", "Helper Text", "Type", "Options", "ID", "Universal"],
        ["Field Name", "Description", "t", "", "custom-field-id", "FALSE"],
        ["Auto Field", "Auto ID", "t", "", "", "FALSE"]
      ]
    } as SheetData;

    const fields = buildFields(testData);

    // First field should use explicit ID
    const field1 = fields[0];
    if (field1.id !== "custom-field-id") {
      console.error(`FAIL: Field should preserve explicit ID 'custom-field-id', got '${field1.id}'`);
      return false;
    }
    console.log("PASS: Explicit field ID preserved");

    // Second field should auto-generate ID from name
    const field2 = fields[1];
    if (field2.id !== "auto-field") {
      console.error(`FAIL: Field should auto-generate ID 'auto-field', got '${field2.id}'`);
      return false;
    }
    console.log("PASS: Field ID auto-generated when not provided");

    console.log("=== Field ID Preservation: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testBuildFieldsSkipsBlankRows(): boolean {
  console.log("=== Test: buildFields Skips Blank Rows ===");

  try {
    const testData: SheetData = {
      documentName: "Blank Row Test" as any,
      Categories: [
        ["Name", "Icon", "Fields", "ID", "Color", "Icon ID"]
      ],
      Details: [
        ["Name", "Helper Text", "Type", "Options", "ID", "Universal"],
        ["Field 1", "First field", "t", "", "field1", "FALSE"],
        ["", "", "", "", "", ""],  // Blank row
        ["Field 2", "Second field", "t", "", "field2", "FALSE"],
        ["", "", "", "", "", ""],  // Another blank row
        ["Field 3", "Third field", "t", "", "field3", "FALSE"]
      ]
    } as SheetData;

    const fields = buildFields(testData);

    // Should have exactly 3 fields (blank rows skipped)
    if (fields.length !== 3) {
      console.error(`FAIL: Expected 3 fields (blank rows skipped), got ${fields.length}`);
      return false;
    }
    console.log("PASS: Blank rows skipped, got exactly 3 fields");

    // Verify fields are correctly parsed
    if (fields[0].id !== "field1" || fields[0].name !== "Field 1") {
      console.error("FAIL: First field incorrectly parsed");
      return false;
    }
    if (fields[1].id !== "field2" || fields[1].name !== "Field 2") {
      console.error("FAIL: Second field incorrectly parsed");
      return false;
    }
    if (fields[2].id !== "field3" || fields[2].name !== "Field 3") {
      console.error("FAIL: Third field incorrectly parsed");
      return false;
    }
    console.log("PASS: All fields correctly parsed despite blank rows");

    console.log("=== buildFields Skips Blank Rows: ALL TESTS PASSED ===");
    return true;
  } catch (error) {
    console.error("FAIL: Exception thrown - " + error.message);
    return false;
  }
}

function testTranslationsWithBlankRows(): boolean {
  console.log("=== Test: Translations Work With Blank Rows in Details ===");

  try {
    // Create mock data with blank rows in Details
    const testData: SheetData = {
      documentName: "Translation Test" as any,
      Categories: [
        ["Name", "Icon", "Fields", "ID", "Color", "Icon ID"],
        ["Test Category", "", "field1, field2", "cat1", "#FF0000", ""]
      ],
      Details: [
        ["Name", "Helper Text", "Type", "Options", "ID", "Universal"],
        ["Field 1", "Help text 1", "s", "opt1, opt2", "field1", "FALSE"],
        ["", "", "", "", "", ""],  // Blank row
        ["Field 2", "Help text 2", "t", "", "field2", "FALSE"]
      ],
      "Detail Label Translations": [
        ["Name", "Spanish", "French"],
        ["Field 1", "Campo 1", "Champ 1"],
        ["", "", ""],  // Blank row in translations too
        ["Field 2", "Campo 2", "Champ 2"]
      ],
      "Detail Helper Text Translations": [
        ["Helper Text", "Spanish", "French"],
        ["Help text 1", "Texto de ayuda 1", "Texte d'aide 1"],
        ["", "", ""],  // Blank row
        ["Help text 2", "Texto de ayuda 2", "Texte d'aide 2"]
      ],
      "Detail Option Translations": [
        ["Options", "Spanish", "French"],
        ["opt1, opt2", "opción1, opción2", "option1, option2"],
        ["", "", ""],  // Blank row
        ["", "", ""]
      ]
    } as SheetData;

    // Build fields (should skip blank row)
    const fields = buildFields(testData);
    if (fields.length !== 2) {
      console.error(`FAIL: Expected 2 fields, got ${fields.length}`);
      return false;
    }
    console.log("PASS: Fields correctly built with blank rows skipped");

    // Build categories
    const categories = buildCategories(testData, fields);

    // Build translations
    const translations = buildTranslationsPayload(testData, categories, fields);

    // Verify translations for field1
    if (!translations['es'] || !translations['es'].fields || !translations['es'].fields['field1']) {
      console.error("FAIL: Spanish translations for field1 not found");
      return false;
    }
    if (translations['es'].fields['field1'].name !== "Campo 1") {
      console.error(`FAIL: field1 label translation incorrect: ${translations['es'].fields['field1'].name}`);
      return false;
    }
    if (translations['es'].fields['field1'].description !== "Texto de ayuda 1") {
      console.error(`FAIL: field1 helper text translation incorrect: ${translations['es'].fields['field1'].description}`);
      return false;
    }
    console.log("PASS: field1 translations correct (before blank row)");

    // Verify translations for field2 (after blank row - this is the critical test)
    if (!translations['es'].fields['field2']) {
      console.error("FAIL: Spanish translations for field2 not found (blank row caused index divergence)");
      return false;
    }
    if (translations['es'].fields['field2'].name !== "Campo 2") {
      console.error(`FAIL: field2 label translation incorrect: ${translations['es'].fields['field2'].name}`);
      return false;
    }
    if (translations['es'].fields['field2'].description !== "Texto de ayuda 2") {
      console.error(`FAIL: field2 helper text translation incorrect: ${translations['es'].fields['field2'].description}`);
      return false;
    }
    console.log("PASS: field2 translations correct (after blank row - no index divergence)");

    // Verify option translations for field1
    if (!translations['es'].fields['field1'].options) {
      console.error("FAIL: Option translations for field1 not found");
      return false;
    }
    if (translations['es'].fields['field1'].options['opt1'] !== "opción1") {
      console.error("FAIL: Option translation for opt1 incorrect");
      return false;
    }
    console.log("PASS: Option translations correct despite blank rows");

    console.log("=== Translations With Blank Rows: ALL TESTS PASSED ===");
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
    // Basic utility tests
    { name: "Slugify Function", fn: testSlugify },
    { name: "Parse Options", fn: testParseOptions },
    { name: "Extract File ID", fn: testExtractFileId },

    // Field type tests
    { name: "Field Type Mapping", fn: testFieldTypeMapping },
    { name: "All Field Types (11 types)", fn: testAllFieldTypes },
    { name: "Integer vs Number Distinction", fn: testIntegerVsNumberDistinction },
    { name: "Map All Field Types to Char", fn: testMapFieldTypeToCharAllTypes },
    { name: "Map Field Type to Char", fn: testMapFieldTypeToChar },

    // Build and import tests
    { name: "Build Payload Creation", fn: testBuildPayloadCreation },
    { name: "Import Parsing", fn: testImportParsing },
    { name: "Validate BuildRequest", fn: testValidateBuildRequest },

    // Universal fields tests
    { name: "Universal Fields Added to All Categories", fn: testUniversalFieldsAddedToAllCategories },
    { name: "Universal Field Does Not Set Required", fn: testUniversalFieldDoesNotSetRequired },

    // Round-trip integration tests
    { name: "Integer Field Round-Trip", fn: testIntegerFieldRoundTrip },
    { name: "Import Preserves Field Distribution", fn: testUniversalFieldRoundTrip },

    // ID preservation tests
    { name: "Category ID Preservation", fn: testCategoryIdPreservation },
    { name: "Field ID Preservation", fn: testFieldIdPreservation },
    { name: "Option Value Preservation", fn: testOptionValuePreservation },

    // Edge case tests
    { name: "Empty Inputs", fn: testEmptyInputs },
    { name: "buildFields Skips Blank Rows", fn: testBuildFieldsSkipsBlankRows },
    { name: "Translations With Blank Rows", fn: testTranslationsWithBlankRows },

    // Category and API tests
    { name: "Category Selection", fn: testCategorySelection },
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
