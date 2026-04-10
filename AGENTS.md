# AGENTS

This file gives repo-specific instructions to coding agents working in
this repository.

## First read

- Read [CONTRIBUTING.md](CONTRIBUTING.md)
  before making non-trivial changes.
- Follow the public-safe repo rules there. They apply to code, docs,
  fixtures, screenshots, tests, and examples.

## Repo workflow

- Prefer `just` commands over ad hoc command sequences.
- Use `just install` for first-run setup.
- Use `just check` before considering work complete.
- Use `just screenshots-readme` when README screenshots need to be
  regenerated.

## Safety constraints

- Do not introduce real personal data, real medical notes, real contact
  details, real calendar identifiers, real iCloud folder names, or real
  credentials anywhere in the repo.
- Keep examples and tests on synthetic fixtures only.
- Treat macOS bridge code, MCP write paths, filesystem mutation logic,
  and import flows as sensitive.

## Implementation expectations

- Keep changes consistent with the current stack: Bun, React, Hono,
  SQLite, Drizzle, Tailwind, Headless UI, Biome, and Just.
- Preserve SQLite as the primary store. Do not add Elasticsearch-style infrastructure as a replacement.
- Keep raw SQL statically lintable where practical so SyntaQLite can validate it.
- Favor fake adapters in tests and CI. Real-service coverage belongs in the opt-in local workflows.

## Docs expectations

- Update `README.md` when user-facing onboarding or screenshots change.
- Update `CONTRIBUTING.md` when contributor workflow, safety policy, or
  review expectations change.
- Update `SECURITY.md` when the threat model or sensitive integration surfaces change.
