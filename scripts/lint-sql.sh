#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="$ROOT_DIR/.cache/uv"
PYTHON_INSTALL_DIR="$ROOT_DIR/.uv-python"
VENV_DIR="$ROOT_DIR/.venv-sql"
SCHEMA_FILE="$ROOT_DIR/schema/app-schema.sql"

run_syntaqlite() {
  if command -v syntaqlite >/dev/null 2>&1; then
    syntaqlite "$@"
    return
  fi

  if [ -x "$VENV_DIR/bin/syntaqlite" ]; then
    "$VENV_DIR/bin/syntaqlite" "$@"
    return
  fi

  if ! command -v uv >/dev/null 2>&1; then
    echo "syntaqlite is required for SQL linting. Install uv or syntaqlite first." >&2
    exit 1
  fi

  mkdir -p "$CACHE_DIR" "$PYTHON_INSTALL_DIR"

  local python_bin
  python_bin="$(find "$PYTHON_INSTALL_DIR" -path '*/bin/python3.12' | head -n 1)"
  if [ -z "$python_bin" ]; then
    UV_CACHE_DIR="$CACHE_DIR" \
      uv python install 3.12 --install-dir "$PYTHON_INSTALL_DIR"
    python_bin="$(find "$PYTHON_INSTALL_DIR" -path '*/bin/python3.12' | head -n 1)"
  fi

  if [ ! -x "$VENV_DIR/bin/python" ]; then
    UV_CACHE_DIR="$CACHE_DIR" uv venv "$VENV_DIR" --python "$python_bin"
  fi

  if [ ! -x "$VENV_DIR/bin/syntaqlite" ]; then
    UV_CACHE_DIR="$CACHE_DIR" \
      uv pip install --python "$VENV_DIR/bin/python" "syntaqlite==0.3.0"
  fi

  "$VENV_DIR/bin/syntaqlite" "$@"
}

run_syntaqlite fmt --check "drizzle/**/*.sql" "schema/**/*.sql"
run_syntaqlite validate "drizzle/**/*.sql" "schema/**/*.sql"

sql_host_files=()
if command -v rg >/dev/null 2>&1; then
  while IFS= read -r file; do
    sql_host_files+=("$file")
  done < <(
    cd "$ROOT_DIR" &&
      rg -l 'sql`' src/server src/mcp --glob '*.ts'
  )
else
  while IFS= read -r -d '' file; do
    sql_host_files+=("$file")
  done < <(
    cd "$ROOT_DIR" &&
      git grep -l -z --fixed-strings 'sql`' -- src/server src/mcp -- '*.ts'
  )
fi

if [ "${#sql_host_files[@]}" -gt 0 ]; then
  (
    cd "$ROOT_DIR"
    run_syntaqlite validate \
      --schema "$SCHEMA_FILE" \
      --experimental-lang typescript \
      "${sql_host_files[@]}"
  )
fi
