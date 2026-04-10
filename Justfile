set shell := ["bash", "-uc"]

default:
  @just check

dev:
  bun run dev

format:
  bun run format

lint:
  bun run lint

test:
  bun run test

check:
  just lint
  just test

test-live:
  bun run test:live

test-native:
  bun run test:native
