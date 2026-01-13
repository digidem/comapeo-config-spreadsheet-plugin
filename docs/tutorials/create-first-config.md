# Create your first config

This tutorial walks you through creating a working `.comapeocat` configuration from scratch.

## Step 1: Set your primary language

1. Open the **Categories** sheet.
2. Click cell **A1**.
3. Enter your primary language name.
   - English or native names are accepted (e.g., `Portuguese` or `Português`).
   - Case does not matter.

If the language is not recognized, see [Translation sheets](../reference/translation-sheets.md).

## Step 2: Define your categories

1. In **Categories**, starting at row 2, enter category names in column A.
2. Keep other columns empty for now.

Example:
| Name |
| --- |
| River |
| Building |
| Forest |
| Wildlife sighting |

See [Add categories](../how-to/add-categories.md) for more detail.

## Step 3: Define your fields

1. In **Details**, starting at row 2, add all fields you need.
2. Set the field type and options.

Example:
| Name | Helper Text | Type | Options | | Universal |
| --- | --- | --- | --- | --- | --- |
| Name | What is the name? | t | | | FALSE |
| Width | What is the width in meters? | n | | | FALSE |
| Condition | What is the current condition? | | Excellent, Good, Fair, Poor | | FALSE |

See [Add fields](../how-to/add-fields.md) for more detail.

## Step 4: Link fields to categories

1. Return to **Categories**.
2. In the **Fields** column (C), list the fields each category uses.

Example:
| Name | Fields |
| --- | --- |
| River | Name, Width, Condition |
| Building | Name, Condition |

See [Link fields to categories](../how-to/link-fields-to-categories.md) for more detail.

## Step 5: Set Applies values (required)

At least one category must include `track` or generation will fail.

1. In **Applies** (column D), set where each category is used.
2. Valid values: `observation`, `track`, or `observation, track`.
3. Abbreviations `o` and `t` are also accepted.

Do not put hex color codes in this column. Colors are set via the Name cell background.

Example:

| Name | Applies |
| --- | --- |
| River | observation |
| Trail | track |

## Step 6: Add icons

See [Add icons](../how-to/add-icons.md).

## Step 7: Set category colors

See [Set category colors](../how-to/set-category-colors.md).

## Step 8: Add translations (optional)

See [Manage languages](../how-to/manage-languages.md).

## Step 9: Validate your data

See [Run linting](../how-to/run-linting.md).

## Step 10: Generate the config

See [Generate a config](../how-to/generate-config.md).

## Step 11: Share and import in CoMapeo

See [Share and load a config](../how-to/share-and-load.md).
If you need to edit an existing configuration, see [Import and edit](import-and-edit.md).
