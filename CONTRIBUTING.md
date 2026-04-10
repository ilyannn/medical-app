# Contributing

## Ground rules

- Keep the repository public-safe. Do not commit personal medical data, iCloud paths, Paperless credentials, calendar IDs, or contact identifiers.
- Use `just` commands for local work.
- Keep feature work covered by tests. New API behavior should come with unit or integration tests, and UI changes that affect flows should update Playwright coverage where practical.
- Keep `just setup-hooks` configured and fix any findings from `just scan-secrets` before pushing.

## Local workflow

```bash
bun install
cp .env.example .env
just check
just dev
```

`just lint` includes SyntaQLite. If you do not have `syntaqlite` on your `PATH`, keep `uv` installed and the repo will provision a local Python 3.12-based SQL lint environment automatically.

## Pull requests

- Keep changes scoped and reviewable
- Update docs when developer-facing behavior changes
- Prefer fake adapters and fixtures in tests over real service dependencies
