/// <reference path="./types.ts" />

/**
 * Validation utilities for user inputs and sheet data
 *
 * This module provides validation functions for:
 * - Language codes and names
 * - Field types and configurations
 * - Category data
 * - Configuration schemas
 */

/**
 * Valid CoMapeo field types
 */
const VALID_FIELD_TYPES = ["text", "number", "selectOne", "selectMultiple"] as const;
type FieldType = typeof VALID_FIELD_TYPES[number];

/**
 * Valid geometry types for CoMapeo presets
 */
const VALID_GEOMETRY_TYPES = ["point", "line", "area"] as const;

/**
 * Validation result interface
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Validates a language code against supported languages
 *
 * @param languageCode - The language code to validate (e.g., "en", "es")
 * @param supportedLanguages - Map of supported language codes to names
 * @returns Validation result
 *
 * @example
 * validateLanguageCode("en", getAllLanguages()) // { valid: true }
 * validateLanguageCode("xyz", getAllLanguages()) // { valid: false, error: "..." }
 */
function validateLanguageCode(
  languageCode: string,
  supportedLanguages: LanguageMap,
): ValidationResult {
  if (!languageCode || languageCode.trim() === "") {
    return {
      valid: false,
      error: "Language code cannot be empty",
    };
  }

  const normalizedCode = languageCode.trim().toLowerCase();

  if (!supportedLanguages[normalizedCode]) {
    return {
      valid: false,
      error: `Unsupported language code: "${languageCode}". Please use a valid ISO 639-1 language code.`,
    };
  }

  return { valid: true };
}

/**
 * Validates a language name against supported languages
 *
 * @param languageName - The language name to validate (e.g., "English", "Spanish")
 * @param supportedLanguages - Map of supported language codes to names
 * @returns Validation result with the matched language code if valid
 *
 * @example
 * validateLanguageName("English", getAllLanguages()) // { valid: true, code: "en" }
 */
function validateLanguageName(
  languageName: string,
  supportedLanguages: LanguageMap,
): ValidationResult & { code?: string } {
  if (!languageName || languageName.trim() === "") {
    return {
      valid: false,
      error: "Language name cannot be empty",
    };
  }

  const normalizedName = languageName.trim();

  // Find matching language code
  const matchedEntry = Object.entries(supportedLanguages).find(
    ([_, name]) => name === normalizedName,
  );

  if (!matchedEntry) {
    return {
      valid: false,
      error: `Unsupported language: "${languageName}". Please use a valid language name from the supported list.`,
    };
  }

  return {
    valid: true,
    code: matchedEntry[0],
  };
}

/**
 * Validates the primary language from cell A1
 *
 * @param primaryLanguage - The primary language from cell A1
 * @param supportedLanguages - Map of supported language codes to names
 * @returns Validation result
 */
function validatePrimaryLanguage(
  primaryLanguage: string,
  supportedLanguages: LanguageMap,
): ValidationResult {
  const result = validateLanguageName(primaryLanguage, supportedLanguages);

  if (!result.valid) {
    return {
      valid: false,
      error: `Invalid primary language in cell A1: ${result.error}`,
    };
  }

  return { valid: true };
}

/**
 * Validates a field type string from the spreadsheet
 *
 * @param typeString - The type string from the spreadsheet
 * @returns Validation result
 *
 * @example
 * validateFieldType("Text") // { valid: true }
 * validateFieldType("Invalid") // { valid: false, error: "..." }
 */
function validateFieldType(typeString: string): ValidationResult {
  if (!typeString || typeString.trim() === "") {
    return {
      valid: false,
      error: "Field type cannot be empty",
    };
  }

  const firstChar = typeString.charAt(0).toLowerCase();
  const validFirstChars = ["t", "n", "s", "m"]; // text, number, select one, multiple choice

  if (!validFirstChars.includes(firstChar)) {
    return {
      valid: false,
      error: `Invalid field type: "${typeString}". Must start with T(ext), N(umber), S(elect one), or M(ultiple choice)`,
    };
  }

  return { valid: true };
}

/**
 * Validates field options for select fields
 *
 * @param fieldType - The field type
 * @param optionsString - The options string from the spreadsheet
 * @returns Validation result
 */
function validateFieldOptions(
  fieldType: string,
  optionsString: string,
): ValidationResult {
  const type = getFieldType(fieldType);

  // Text and number fields don't need options
  if (type === "text" || type === "number") {
    return { valid: true };
  }

  // Select fields require options
  if (!optionsString || optionsString.trim() === "") {
    return {
      valid: false,
      error: `Field type "${fieldType}" requires options, but none provided`,
    };
  }

  const options = optionsString
    .split(",")
    .map((opt) => opt.trim())
    .filter((opt) => opt !== "");

  if (options.length === 0) {
    return {
      valid: false,
      error: `Field type "${fieldType}" requires at least one option`,
    };
  }

  return { valid: true };
}

/**
 * Validates a complete field definition
 *
 * @param fieldData - Array representing a field row from the Details sheet
 * @param rowIndex - The row index for error reporting
 * @returns Validation result
 */
function validateFieldDefinition(
  fieldData: any[],
  rowIndex: number,
): ValidationResult {
  const warnings: string[] = [];

  // Validate field name (column A)
  if (!fieldData[0] || String(fieldData[0]).trim() === "") {
    return {
      valid: false,
      error: `Row ${rowIndex}: Field name (column A) cannot be empty`,
    };
  }

  // Validate field type (column C)
  const typeValidation = validateFieldType(fieldData[2]);
  if (!typeValidation.valid) {
    return {
      valid: false,
      error: `Row ${rowIndex}: ${typeValidation.error}`,
    };
  }

  // Validate options for select fields (column D)
  const optionsValidation = validateFieldOptions(fieldData[2], fieldData[3]);
  if (!optionsValidation.valid) {
    return {
      valid: false,
      error: `Row ${rowIndex}: ${optionsValidation.error}`,
    };
  }

  // Warning if helper text is empty
  if (!fieldData[1] || String(fieldData[1]).trim() === "") {
    warnings.push(
      `Row ${rowIndex}: Helper text (column B) is empty - consider adding guidance for users`,
    );
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validates a category name
 *
 * @param categoryName - The category name to validate
 * @param rowIndex - The row index for error reporting
 * @returns Validation result
 */
function validateCategoryName(
  categoryName: string,
  rowIndex: number,
): ValidationResult {
  if (!categoryName || String(categoryName).trim() === "") {
    return {
      valid: false,
      error: `Row ${rowIndex}: Category name cannot be empty`,
    };
  }

  return { valid: true };
}

/**
 * Validates a complete category definition
 *
 * @param categoryData - Array representing a category row from the Categories sheet
 * @param rowIndex - The row index for error reporting
 * @returns Validation result
 */
function validateCategoryDefinition(
  categoryData: any[],
  rowIndex: number,
): ValidationResult {
  const warnings: string[] = [];

  // Validate category name (column A)
  const nameValidation = validateCategoryName(categoryData[0], rowIndex);
  if (!nameValidation.valid) {
    return nameValidation;
  }

  // Warning if icon is not specified
  if (!categoryData[1] || String(categoryData[1]).trim() === "") {
    warnings.push(
      `Row ${rowIndex}: Icon (column B) is empty - a default icon will be used`,
    );
  }

  // Warning if no fields specified
  if (!categoryData[2] || String(categoryData[2]).trim() === "") {
    warnings.push(
      `Row ${rowIndex}: No fields specified (column C) - category will have no custom fields`,
    );
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validates the entire sheet data before processing
 *
 * @param data - The SheetData object
 * @returns Validation result with all errors and warnings
 */
function validateSheetData(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate Categories sheet
  if (!data.Categories || data.Categories.length < 2) {
    errors.push("Categories sheet is empty or has no data rows");
  } else {
    // Skip header row, validate data rows
    data.Categories.slice(1).forEach((category: any[], index: number) => {
      const result = validateCategoryDefinition(category, index + 2); // +2 for header and 0-index
      if (!result.valid && result.error) {
        errors.push(result.error);
      }
      if (result.warnings) {
        warnings.push(...result.warnings);
      }
    });
  }

  // Validate Details sheet
  if (!data.Details || data.Details.length < 2) {
    errors.push("Details sheet is empty or has no data rows");
  } else {
    // Skip header row, validate data rows
    data.Details.slice(1).forEach((field: any[], index: number) => {
      const result = validateFieldDefinition(field, index + 2); // +2 for header and 0-index
      if (!result.valid && result.error) {
        errors.push(result.error);
      }
      if (result.warnings) {
        warnings.push(...result.warnings);
      }
    });
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: `Validation failed with ${errors.length} error(s):\n${errors.join("\n")}`,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validates configuration data schema
 *
 * @param config - The CoMapeoConfig object
 * @returns Validation result
 */
function validateConfigSchema(config: any): ValidationResult {
  const errors: string[] = [];

  // Validate required top-level properties
  if (!config.metadata) {
    errors.push("Configuration missing 'metadata' property");
  }

  if (!config.fields || !Array.isArray(config.fields)) {
    errors.push("Configuration missing 'fields' array");
  }

  if (!config.presets || !Array.isArray(config.presets)) {
    errors.push("Configuration missing 'presets' array");
  }

  if (!config.icons || typeof config.icons !== "object") {
    errors.push("Configuration missing 'icons' object");
  }

  if (!config.translations || typeof config.translations !== "object") {
    errors.push("Configuration missing 'translations' object");
  }

  // Validate metadata structure
  if (config.metadata) {
    if (!config.metadata.dataset_id) {
      errors.push("Metadata missing 'dataset_id'");
    }
    if (!config.metadata.name) {
      errors.push("Metadata missing 'name'");
    }
    if (!config.metadata.version) {
      errors.push("Metadata missing 'version'");
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: `Schema validation failed:\n${errors.join("\n")}`,
    };
  }

  return { valid: true };
}
