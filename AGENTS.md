# Repository Guidelines

## Project Structure & Modules
- `src/`: Core Google Apps Script logic (e.g., `apiService.ts`, `importService.ts`, `dialog.ts`, `utils.ts`).
- `index.ts`: Menu wiring; calls into generate/import/translate flows.
- `scripts/`: Helper scripts (`generate-fixture.ts`, `update-version.cjs`).
- `appsscript.json`: Apps Script manifest; keep scopes in sync with deployed code.
- Generated artifacts (`.clasp*`, `dist/`, `sample.comapeocat`, `fixture.json`) are ignored—do not commit.

## Build, Test, and Development Commands
- `bunx biome lint --write --unsafe .` — format + lint TypeScript/JSON. Run before pushing.
- `bun run scripts/generate-fixture.ts` — regenerate fixture data for manual checks.
- `npm run push` (or `bun run push`) — `clasp push` current code to Apps Script (runs version:update first).
- `npm run dev` — `clasp push --watch`; keep batches small to avoid quota hits.
- `npm run push:all` — pushes all clasp files (use sparingly; overwrites remote state).

## Coding Style & Naming Conventions
- TypeScript, ES modules, 2-space indent; prefer const/let, no implicit any.
- Use descriptive function names (verbNoun), camelCase variables, PascalCase types/interfaces.
- Keep Apps Script logging via `getScopedLogger` where available; avoid `Logger.log`.
- Prefer pure helpers in `src/utils.ts` and keep spreadsheet column constants in `types.ts` / enums where present.

## Testing Guidelines
- No automated test suite is currently wired; rely on manual spreadsheet flows plus the lightweight tests in `src/test/`.
- When changing field/category parsing, validate with a throwaway spreadsheet: run “Generate CoMapeo Category,” then re-import the produced `.comapeocat` to ensure round-trip for Fields/Details and icons.
- Add targeted assertions inside scripts when practical (fail fast on invalid sheet shapes).

## Commit & Pull Request Guidelines
- Commit messages: short imperative line (e.g., “Handle category field arrays and icons”).
- Scope commits narrowly (parsing, lint, deploy) to simplify rollbacks.
- PRs should include: summary of behavior change, manual test notes (spreadsheet steps + results), and any scope changes to `appsscript.json`.
- Link related tickets/issues; include screenshots only when UI dialogs change.

## Security & Configuration Tips
- Apps Script runs with editor creds—minimize added scopes; review `appsscript.json` before push.
- Icons from Drive now inline SVG; ensure Drive access is acceptable and sanitized SVG is expected.
- API config: `src/config.ts` holds `API_BASE_URL` for v2 JSON endpoint; consider Script Properties for deploy-specific values.
- Keep secrets out of the repo; prefer Script Properties for runtime config.

## v2-specific Notes
- Generation uses the JSON-only v2 API (no ZIP workflow). Categories sheet expected headers: `Name | Icon | Fields | Applies`; IDs/iconIds derive from slugified names; color derives from column A background.
- Import is v2-aware and round-trips `.comapeocat` JSON; translations are opt-in via the Translate menu, not auto-run on generate.
- Version info is auto-updated via `scripts/update-version.cjs` before pushes.
