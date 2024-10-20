/**
 * Converts a string to a slug format.
 * @param input The input string to be converted.
 * @returns The slugified string.
 */
export function slugify(input: any): string {
  const str = typeof input === 'string' ? input : String(input);
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getFieldType(typeString: string): string {
  const firstChar = typeString.charAt(0).toLowerCase();
  if (firstChar === 'm') return 'select_multiple';
  if (firstChar === 'n') return 'number';
  if (firstChar === 't') return 'text';
  return 'select_one';
}

export function getFieldOptions(typeString: string, optionsString: string): Array<{ label: string; value: string }> | undefined {
  const fieldType = getFieldType(typeString);
  if (fieldType === 'number' || fieldType === 'text') return undefined;
  return optionsString.split(',').map(opt => ({ label: opt.trim(), value: slugify(opt.trim()) }));
}
