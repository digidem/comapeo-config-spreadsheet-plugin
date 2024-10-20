function processPresets(data) {
  const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  const categories = data['Categories'].slice(1);
  const backgroundColors = categoriesSheet.getRange(2, 1, categories.length, 1).getBackgrounds();

  return categories.map((category, index) => ({
    icon: slugify(category[0]),
    color: backgroundColors[index][0] || '#0000FF',
    fields: category[3] ? category[3].split(',').map(f => slugify(f.trim())) : [],
    geometry: ['point', 'line', 'area'],
    tags: { [slugify(category[0])]: 'yes' },
    name: category[0],
    sort: index + 1
  }));
}
