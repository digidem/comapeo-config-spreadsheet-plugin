# Documentation Index & Migration Plan

This page tracks the ongoing consolidation of historical context files into a single documentation tree. Use the table below to see the current location of each document, the target destination in the new structure, and open follow-ups required before/after moving.

## Target Top-Level Structure

- `docs/reference/` – enduring architectural knowledge, file-format specs, user guides
- `docs/process/` – team workflows, policies, review/issue playbooks
- `docs/implementation/` – sprint logs, feature deep-dives, in-flight plans
- `docs/historical/` – archived summaries and decision snapshots kept for posterity
- `docs/assets/` – supporting diagrams, exports, or supplemental attachments (TBD)

## Inventory & Migration Matrix

| Source Path | Destination Path | Status | Notes / Follow-ups |
| --- | --- | --- | --- |
| `docs/DEPENDENCIES.md` | `docs/process/dependencies.md` | ✅ moved 2025-10-31 | - [ ] Review dependency list for freshness (Owner: Luandro, Target: 2025-11-07) |
| `docs/implementation/sprint-1-critical.md` | `docs/implementation/sprint-01-critical.md` | ✅ moved 2025-10-31 | - [x] Added `last-reviewed` metadata block (2025-10-31) |
| `docs/implementation/sprint-2-quality.md` | `docs/implementation/sprint-02-quality.md` | ✅ moved 2025-10-31 | - [x] Added `last-reviewed` metadata block (2025-10-31) |
| `docs/implementation/sprint-3-security.md` | `docs/implementation/sprint-03-security.md` | ✅ moved 2025-10-31 | - [x] Added `last-reviewed` metadata block (2025-10-31) |
| `docs/implementation/sprint-4-polish.md` | `docs/implementation/sprint-04-polish.md` | ✅ moved 2025-10-31 | - [x] Added `last-reviewed` metadata block (2025-10-31) |
| `docs/issues/CRITICAL.md` | `docs/issues/critical.md` | ✅ moved 2025-10-31, relocated 2025-11-01 | - [x] Relocated to dedicated issues directory for better organization (Owner: Documentation, Target: 2025-11-01) |
| `docs/issues/HIGH.md` | `docs/issues/high.md` | ✅ moved 2025-10-31, relocated 2025-11-01 | - [x] Relocated to dedicated issues directory for better organization (Owner: Documentation, Target: 2025-11-01) |
| `docs/issues/LOW.md` | `docs/issues/low.md` | ✅ moved 2025-10-31, relocated 2025-11-01 | - [x] Relocated to dedicated issues directory for better organization (Owner: Documentation, Target: 2025-11-01) |
| `docs/issues/MEDIUM.md` | `docs/issues/medium.md` | ✅ moved 2025-10-31, relocated 2025-11-01 | - [x] Relocated to dedicated issues directory for better organization (Owner: Documentation, Target: 2025-11-01) |
| `docs/NAMING_CONVENTIONS.md` | `docs/process/naming-conventions.md` | ✅ moved 2025-10-31 | - [ ] Cross-check naming rules with lint configuration (Owner: Dev Tooling, Target: 2025-11-14) |
| `docs/REGRESSION-STRATEGY.md` | `docs/process/regression-strategy.md` | ✅ moved 2025-10-31 | - [x] Added owner + review cadence (2025-10-31) |
| `docs/reviews/README.md` | `docs/process/review-checklists.md` | ✅ moved 2025-10-31 | - [ ] Validate headings + intro after migration (Owner: Documentation, Target: 2025-11-05) |
| `docs/SVG_ERROR_DETECTION_REMAINING_WORK.md` | `docs/implementation/svg-error-detection.md` | ✅ moved 2025-10-31 | - [x] Added status banner (2025-10-31) |
| `CLAUDE.md` | `docs/process/assistant-guide.md` | ✅ moved 2025-10-31 | - [ ] Review assistant guide alongside tooling updates each release (Owner: AiOps, Cadence: Monthly) |
| `PERFORMANCE_IMPROVEMENTS.md` | `docs/implementation/performance-improvements.md` | ✅ moved 2025-10-31 | - [ ] Capture timing deltas after pending items (Owner: Luandro, Target: 2025-11-10) |
| `PRODUCTION_HARDENING_SUMMARY.md` | `docs/historical/production-hardening-2025-10-28.md` | ✅ moved 2025-10-31 | — |
| `PROGRESS.md` | `docs/historical/progress.md` | ✅ moved 2025-10-31 | - [ ] Update when new phases complete (Owner: Luandro, Trigger: Phase completion) |
| `context/ARCHITECTURE.md` | `docs/reference/architecture.md` | ✅ moved 2025-10-31 | Ensure internal anchors still work |
| `context/CAT_GEN.md` | `docs/reference/cat-generation.md` | ✅ moved 2025-10-31 | Verify code snippet paths |
| `context/COMAPEOCAT_FORMAT.md` | `docs/reference/comapeocat-format.md` | ✅ moved 2025-10-31 | None |
| `context/HTML_FIX_SUMMARY.md` | `docs/historical/html-fix-summary.md` | ✅ moved 2025-10-31 | Add deprecation notice |
| `context/HTML_VALIDATION.md` | `docs/reference/html-validation.md` | ✅ moved 2025-10-31 | Link from HTML fix summary |
| `context/IMPORT_CAT.md` | `docs/reference/import-cat.md` | ✅ moved 2025-10-31 | None |
| `context/PERFORMANCE_FIX_SUMMARY.md` | `docs/historical/performance-fix-summary.md` | ✅ moved 2025-10-31 | Summarize key pattern in architecture doc |
| `context/PNG_SPRITE_LIMITATIONS.md` | `docs/reference/png-sprite-limitations.md` | ✅ moved 2025-10-31 | None |
| `context/spreadsheet-format.md` | `docs/reference/spreadsheet-format.md` | ✅ moved 2025-10-31 | Backlink from user guide |
| `context/USER_GUIDE.md` | `docs/reference/user-guide.md` | ✅ moved 2025-10-31 | Consider quickstart excerpt |
| `context/README.md` | Superseded by this index | ✅ pointer 2025-10-31 | Leave redirect file until Q1 2026, then remove if no longer referenced |

## How to Use These Docs

- **Architecture** → Start with `docs/reference/architecture.md` for system topology, the 9-stage pipeline, and module responsibilities.
- **Category generation & export** → Consult `docs/reference/cat-generation.md` for pipeline phases, debugging strategies, and benchmarks before touching export logic.
- **Category import** → Use `docs/reference/import-cat.md` when working on import flows, archive extraction, or translation alignment.
- **File formats** → Keep `docs/reference/comapeocat-format.md` and `docs/reference/spreadsheet-format.md` handy for schema validation and data shape questions.
- **User workflows** → Reference `docs/reference/user-guide.md` for end-user steps, translations, and troubleshooting guidance.
- **Icon constraints** → Check `docs/reference/png-sprite-limitations.md` to understand the platform limits around sprites and icons.
- **Performance patterns** → Review `docs/historical/performance-fix-summary.md` for proven optimization approaches before re-inventing them.
- **HTML dialog validation** → Leverage `docs/reference/html-validation.md` to avoid regressions in dialog rendering.
- **Assistant onboarding** → Share `docs/process/assistant-guide.md` with any coding assistants so expectations stay aligned.

_Last updated: 2025-10-31_
