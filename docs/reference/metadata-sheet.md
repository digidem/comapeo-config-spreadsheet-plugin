# Metadata sheet

The Metadata sheet stores configuration-level settings and is auto-generated.

## Common keys

- `datasetId` - Unique ID for this configuration
- `name` - Configuration name
- `version` - Version number
- `primaryLanguage` - Primary language name

## Legacy compatibility

If present, the `legacyCompat` key preserves older `categoryId` behavior:

- `TRUE` enables legacy compatibility
- `FALSE` (or missing) uses current behavior

You can toggle this via **Debug Menu → Turn on legacy compatibility**.
