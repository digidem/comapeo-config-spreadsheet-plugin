# Repository Guidelines

## Project Structure & Modules
- `src/`: Core Google Apps Script logic (e.g., `apiService.ts`, `importService.ts`, `dialog.ts`).
- `index.ts`: Entry wiring for Apps Script UI/menu hooks.
- `scripts/`: Helper scripts like `generate-fixture.ts` for local fixtures.
- `appsscript.json`: Apps Script manifest; keep in sync with deployed scopes.
- Generated artifacts (e.g., `.clasp*`, `dist/`, `sample.comapeocat`) are ignored—do not commit.

## Build, Test, and Development Commands
- `bunx biome lint --write --unsafe .` — format + lint TypeScript/JSON. Run before pushing.
- `bun run scripts/generate-fixture.ts` — regenerate fixture data used for manual checks.
- `npm run push` (or `bun run push`) — `clasp push` current code to Apps Script.
- `npm run dev` — `clasp push --watch` for live development; keep a small change batch to avoid quota hits.
- `npm run push:all` — pushes all clasp files (use sparingly; overwrites remote state).

## Coding Style & Naming Conventions
- TypeScript, ES modules, 2-space indent; prefer const/let, no implicit any.
- Use descriptive function names (verbNoun), camelCase variables, PascalCase types/interfaces.
- Keep Apps Script logging via `getScopedLogger` where available; avoid `Logger.log`.
- Prefer pure helpers in `src/utils.ts` and keep spreadsheet column constants in `types.ts` / enums where present.

## Testing Guidelines
- No automated test suite is currently wired; rely on manual spreadsheet flows.
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
- Keep secrets out of the repo; prefer Script Properties for runtime config.
