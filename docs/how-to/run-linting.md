# Run linting

Linting checks your spreadsheet for missing data, invalid references, and translation mismatches.

## Steps

1. Open **CoMapeo Tools → Lint Sheets**.
2. Wait for validation to finish (usually 5-15 seconds).
3. Fix highlighted cells.
4. Run **Lint Sheets** again to confirm all issues are resolved.

Fix bright red (critical) errors before generating.

## Priority order

1. Bright red background + white text (critical)
2. Light red background (invalid/duplicate values)
3. Yellow (missing required data or warnings)
4. Red text (invalid references or URLs)
5. Orange text (HTTP warning)

## Learn the color rules

- [Linting rules](../reference/linting-rules.md)
- [Troubleshooting](../troubleshooting/index.md)
