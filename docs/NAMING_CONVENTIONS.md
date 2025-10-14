# Naming Conventions

This reference explains how identifiers are generated throughout the CoMapeo configuration pipeline. It supports **HIGH-024: Standardize Naming Conventions** by documenting the rules implemented in `src/utils.ts`.

## Field Keys

- Source: `Details` sheet, column A (field name).
- Transformation: `createFieldTagKey(name, index)`.
- Pattern: slugified field name (lowercase, `-` separators). If the slug is empty, the fallback is `field-{position}` (1-based).

## Preset / Category Slugs

- Source: `Categories` sheet, column A (category name).
- Transformation: `createPresetSlug(name, index)`.
- Pattern: slugified category name. Empty slugs fall back to `category-{position}`.

## Option Values

- Source: `Details` sheet, column D (comma-separated options).
- Transformation: `createOptionValue(label, fieldKey, index)`.
- Pattern: slugified option label. If the slug is empty, the fallback is `{fieldKey}-{position}`; when the field key is not yet available, it defaults to `option-{position}`.

## Dataset & Folder Names

- Dataset ID defaults follow `comapeo-{slugified spreadsheet name}` (see `processMetadata.ts`).
- Drive folder names use the spreadsheet name slug (`driveService.ts`, `icons.ts`).

## Icon Slugs

- Default icon names are slugified from the requested name (`iconProcessor.ts`).
- PNG/SVG extraction retains the original slug unless normalization removes illegal characters, in which case `normalizeIconSlug` applies the same fallback pattern.

## Enforcement

1. Helper functions (`createFieldTagKey`, `createPresetSlug`, `createOptionValue`) provide the canonical behaviour.
2. `getFieldOptions` now delegates to `createOptionValue`, preventing inconsistent option IDs.
3. `processFields.ts`, `processPresets.ts`, and import/format detection flows call the helpers so that naming is stable across exports and imports.

When adding new identifiers, prefer the helpers and update this document if additional patterns are required.
