# CoMapeo Config Spreadsheet Plugin - Documentation

Welcome to the documentation for the CoMapeo Configuration Spreadsheet Plugin.

## 📚 User Documentation

*   **[User Guide](../USER_GUIDE.md)**: The primary manual for end-users. Covers setup, creating configurations, managing translations, and exporting.
*   **[Linting Guide](LINTING_GUIDE.md)**: Detailed reference for validation rules, color codes, and troubleshooting common errors.

## 🛠️ Developer Reference

Technical documentation for contributors, maintainers, and AI assistants.

### Architecture & Implementation
*   **[System Architecture](reference/architecture.md)**: High-level overview of the system topology, pipeline, and module responsibilities.
*   **[Category Generation](reference/cat-generation.md)**: Deep dive into the export pipeline (`.comapeocat` generation).
*   **[Category Import](reference/import-cat.md)**: Details on the reverse-engineering process for importing files.

### File Formats & Specs
*   **[Spreadsheet Structure](reference/spreadsheet-format.md)**: Specifications for the Categories and Details sheets.
*   **[CoMapeo Catalog Format](reference/comapeocat-format.md)**: Specification for the `.comapeocat` file structure.
*   **[PNG Sprite Limitations](reference/png-sprite-limitations.md)**: Context on why we use individual PNGs/SVGs instead of sprites in Apps Script.
*   **[HTML Validation](reference/html-validation.md)**: Strategy for preventing malformed HTML in dialogs.

## 📝 Process & Workflow

Team standards, AI guidelines, and testing procedures.

*   **[Assistant Guide](../AGENTS.md)**: Context and rules for AI assistants (Claude, Copilot, etc.) working on this codebase.
*   **[Naming Conventions](process/naming-conventions.md)**: Code style and naming standards.
*   **[Dependencies](process/dependencies.md)**: List of external libraries and APIs.
*   **[Regression Testing](process/regression-testing-guide.md)**: Strategy for preventing regressions.
*   **[Review Checklists](process/review-checklists.md)**: Guides for code review.

## 🏛️ Archives & Logs

*   **[Implementation Logs](implementation/)**: Sprint logs, feature deep-dives, and in-flight plans.
*   **[Historical Context](historical/)**: Archived summaries and decision records.
*   **[Known Issues](issues/)**: Categorized issue tracking (Critical, High, etc.).