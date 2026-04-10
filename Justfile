set shell := ["bash", "-uc"]

default:
  @just --list

install:
  bun install
  test -f .env || cp .env.example .env

start: install dev

dev:
  bunx concurrently -k -n web,api -c cyan,green "just dev-web" "just dev-server"

dev-web:
  bunx vite --host 127.0.0.1 --port 4173

dev-server:
  bun --hot src/server/index.ts

build: build-web build-server

build-web:
  bunx vite build

build-server:
  bun build src/server/index.ts --target bun --outdir dist/server && bun build src/mcp/index.ts --target bun --outdir dist/mcp

format:
  bunx @biomejs/biome format --write .

check: lint test

lint: lint-ts lint-sql lint-md lint-sh lint-yaml lint-actions

lint-ts:
  bunx @biomejs/biome check . && bunx typescript --noEmit

lint-sql:
  bash ./scripts/lint-sql.sh

lint-md:
  bunx markdownlint-cli2

lint-sh:
  bash ./scripts/lint-shell.sh

lint-yaml:
  bash ./scripts/lint-yaml.sh

lint-actions:
  bash ./scripts/lint-actions.sh

lint-native:
  swift format lint --recursive --strict native/macos-bridge/Sources
  swift format lint --strict native/macos-bridge/Package.swift

scan-secrets:
  bash ./scripts/scan-secrets.sh

screenshots-readme:
  bun scripts/capture-readme-screenshots.mjs

test: test-unit test-e2e

test-unit:
  just test-unit-node test-unit-web

test-unit-node:
  bunx vitest run --exclude "src/test/web/**/*.{test,spec}.{ts,tsx}"

test-unit-web:
  bunx vitest run src/test/web --environment jsdom

test-live:
  bunx vitest run src/test/live --passWithNoTests

test-native:
  swift build --package-path native/macos-bridge && bunx vitest run src/test/native --passWithNoTests

test-e2e:
  env -u NO_COLOR FORCE_COLOR=0 bunx playwright test

setup-hooks:
  bash ./scripts/setup-git-hooks.sh
