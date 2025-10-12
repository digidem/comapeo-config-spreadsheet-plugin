/**
 * Converts a string to a slug format.
 * @param input The input string to be converted.
 * @returns The slugified string.
 */
function slugify(input: string | any): string {
  if (!input) return "";

  const str = typeof input === "string" ? input : String(input);
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Determines the field type based on the type string.
 * @param typeString The type string from the spreadsheet (e.g., "Text", "Number", "Multiple choice", "Select one").
 * @returns The CoMapeo field type.
 */
function getFieldType(typeString: string): "text" | "number" | "selectOne" | "selectMultiple" {
  const firstChar = typeString.charAt(0).toLowerCase();
  if (firstChar === "m") return "selectMultiple";
  if (firstChar === "n") return "number";
  if (firstChar === "t") return "text";
  return "selectOne";
}

/**
 * Parses field options from the options string.
 * @param typeString The type string to determine if options are needed.
 * @param optionsString The comma-separated options string.
 * @returns Array of option objects with label and value, or undefined for non-select fields.
 */
function getFieldOptions(
  typeString: string,
  optionsString: string,
): Array<{ label: string; value: string }> | undefined {
  const fieldType = getFieldType(typeString);
  if (fieldType === "number" || fieldType === "text") return undefined;
  return optionsString
    .split(",")
    .map((opt) => opt.trim())
    .filter((opt) => opt !== "")
    .map((opt) => ({ label: opt, value: slugify(opt) }));
}
