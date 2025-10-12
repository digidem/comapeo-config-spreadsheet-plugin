/**
 * Processes preset data from spreadsheet
 *
 * @param data - Spreadsheet data object
 * @param categoriesSheet - Categories sheet reference (passed to avoid uncached access)
 * @returns Array of CoMapeo preset objects
 */
function processPresets(data, categoriesSheet: GoogleAppsScript.Spreadsheet.Sheet) {
  const categories = data["Categories"].slice(1);
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
