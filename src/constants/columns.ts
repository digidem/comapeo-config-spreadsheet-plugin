/** Column indices for Categories sheet (0-based)
 * Expected headers (current implementation): Name | Icon | Fields | Applies | Category ID | Icon ID
 */
const CATEGORY_COL = {
  NAME: 0,
  ICON: 1,
  FIELDS: 2,
  APPLIES: 3,
  CATEGORY_ID: 4,
  ICON_ID: 5,
  COLOR_BACKGROUND: 0, // fallback when no explicit color column
} as const;

/** Column indices for Details sheet (0-based)
 * Expected headers (current implementation): Name/Label | Helper Text | Type | Options | ID | Universal
 */
const DETAILS_COL = {
  NAME: 0,
  HELPER_TEXT: 1,
  TYPE: 2,
  OPTIONS: 3,
  ID: 4,
  UNIVERSAL: 5,
} as const;

/** Column indices for translation sheets (0-based) */
const TRANSLATION_COL = {
  SOURCE_TEXT: 0,
  FIRST_LANGUAGE: 1,
} as const;
