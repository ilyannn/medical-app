# Contributing

This project is public open source. Keep all contributions safe to publish,
reproducible on another machine, and runnable from the repo's `just`
entrypoints.

## Public-safe repo rules

- Never commit personal medical data, real iCloud folder names, real
  filesystem paths, calendar IDs, contact IDs, Paperless credentials,
  AI keys, or private household notes.
- Keep examples, fixtures, screenshots, and tests based on synthetic demo data only.
- Prefer fake adapters over live services in tests, CI, and examples.
- Treat the local macOS bridge, document store, and MCP write tools as
  sensitive surfaces. Changes there should be narrow, reviewed, and tested.

## Local workflow

Simple local startup:

```bash
just start
```

Developer workflow:

```bash
just install
just setup-hooks
just check
just dev
```

What those do:

- `just install`: installs dependencies and creates `.env` from
  `.env.example` if missing.
- `just setup-hooks`: configures the local pre-push hook.
- `just check`: runs the required lint and test workflow.
- `just dev`: runs the frontend and API together.

## Required commands

Use `just` commands instead of ad hoc local workflows whenever possible.

- `just format`: Biome formatting for the repo.
- `just lint`: Biome linting, TypeScript typechecking, SyntaQLite SQL
  linting, and Markdown linting.
- `just test`: unit, integration, and Playwright E2E coverage.
- `just test-live`: optional live integration coverage.
- `just test-native`: local Swift bridge verification.
- `just screenshots-readme`: regenerates README screenshots from seeded demo data.

`just check` must stay green. If you change behavior that affects docs,
onboarding, screenshots, or developer workflow, update the relevant
documentation in the same change.

## Testing expectations

- Add tests for new API behavior and domain rules.
- Update Playwright coverage when shared UI flows or seeded workflows change.
- Keep tests deterministic. Avoid dependencies on personal machine state.
- Use seeded demo data and fake adapters by default.
- If a change only works with a real local service, isolate that coverage
  under `just test-live` or `just test-native`.

## SQL and schema rules

- SQLite is the primary system of record in v1.
- Keep schema changes in sync across Drizzle schema, migration SQL, and
  the SyntaQLite schema snapshot used for linting.
- When adding raw SQL, tag static statements so SyntaQLite can validate them.

## Secrets and security checks

- `just scan-secrets` validates tracked files for common secret patterns.
- `just setup-hooks` configures a local pre-push hook so `git push` runs
  the secret scan automatically.
- Use `git push --no-verify` only when you explicitly intend to bypass the local pre-push check.

## Pull requests

- Keep changes scoped and reviewable.
- Explain any tradeoffs around safety, testing, or native integration behavior.
- Update docs when developer-facing behavior changes.
- Avoid mixing personal environment tweaks with product code.

## Contributor notes

- The demo config uses `./var/medical-app.sqlite` and `./demo/icloud-root`.
- Biome is the default TypeScript formatter and linter.
- `just lint` includes SyntaQLite. If `syntaqlite` is not installed on
  your `PATH`, the repo bootstraps a local Python 3.12-based toolchain
  with `uv` under `.uv-python` and `.venv-sql`.
