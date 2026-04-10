#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="$ROOT_DIR/.cache/uv"
PYTHON_INSTALL_DIR="$ROOT_DIR/.uv-python"
VENV_DIR="$ROOT_DIR/.venv-lint"
PYTHON_VERSION="3.12"

mkdir -p "$CACHE_DIR" "$PYTHON_INSTALL_DIR"

python_bin="$(find "$PYTHON_INSTALL_DIR" -path "*/bin/python${PYTHON_VERSION}" | head -n 1)"
if [ -z "${python_bin}" ]; then
  UV_CACHE_DIR="$CACHE_DIR" \
    uv python install "$PYTHON_VERSION" --install-dir "$PYTHON_INSTALL_DIR"
  python_bin="$(find "$PYTHON_INSTALL_DIR" -path "*/bin/python${PYTHON_VERSION}" | head -n 1)"
fi

if [ ! -x "$VENV_DIR/bin/python" ]; then
  UV_CACHE_DIR="$CACHE_DIR" uv venv "$VENV_DIR" --python "$python_bin"
fi

if [ ! -x "$VENV_DIR/bin/shellcheck" ] || [ ! -x "$VENV_DIR/bin/yamllint" ]; then
  UV_CACHE_DIR="$CACHE_DIR" \
    uv pip install --python "$VENV_DIR/bin/python" \
      "shellcheck-py==0.11.0.1" \
      "yamllint==1.38.0"
fi
