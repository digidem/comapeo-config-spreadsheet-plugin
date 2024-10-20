/**
 * Converts a string to a slug format.
 * @param input The input string to be converted.
 * @returns The slugified string.
 */
function slugify(input) {
  const str = typeof input === 'string' ? input : String(input);
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getFieldType(typeString) {
  const firstChar = typeString.charAt(0).toLowerCase();
  if (firstChar === 'm') return 'select_multiple';
  if (firstChar === 'n') return 'number';
  if (firstChar === 't') return 'text';
  return 'select_one';
}

function getFieldOptions(typeString, optionsString) {
  const fieldType = getFieldType(typeString);
  if (fieldType === 'number' || fieldType === 'text') return undefined;
  return optionsString.split(',').map(opt => ({ label: opt.trim(), value: slugify(opt.trim()) }));
}
