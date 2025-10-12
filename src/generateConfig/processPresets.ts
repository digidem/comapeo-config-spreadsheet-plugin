/**
 * Processes preset data from spreadsheet
 *
 * @param data - Spreadsheet data object
 * @param categoriesSheet - Categories sheet reference (passed to avoid uncached access)
 * @returns Array of CoMapeo preset objects
 */
function processPresets(data, categoriesSheet: GoogleAppsScript.Spreadsheet.Sheet) {
  const categories = data["Categories"].slice(1);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate all categories first
  categories.forEach((category, index) => {
    const validation = validateCategoryDefinition(category, index + 2); // +2 for header row and 0-index
    if (!validation.valid && validation.error) {
      errors.push(validation.error);
    }
    if (validation.warnings) {
      warnings.push(...validation.warnings);
    }
  });

  // If there are validation errors, throw with details
  if (errors.length > 0) {
    throw new Error(
      `Category validation failed with ${errors.length} error(s) in Categories sheet:\n${errors.join("\n")}`,
    );
  }

  // Log warnings if any
  if (warnings.length > 0) {
    console.warn(
      `Category validation warnings (${warnings.length}):\n${warnings.join("\n")}`,
    );
  }

  const backgroundColors = categoriesSheet
    .getRange(2, 1, categories.length, 1)
    .getBackgrounds();
  return categories.map((category, index) => {
    console.log(index, category[0]);
    const fields = category[2]
      ? category[2].split(",").map((field) => slugify(field.trim()))
      : [];

    const terms = [
      category[0],
      ...fields.map((field) => field.replace(/-/g, " ")),
    ];
    return {
      icon: slugify(category[0]),
      color: backgroundColors[index][0] || "#0000FF",
      fields,
      geometry: ["point", "line", "area"],
      tags: { [slugify(category[0])]: "yes" },
      name: category[0],
      sort: index + 1,
      terms,
    };
  });
}
