#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
actionlint_bin="$(bash "$ROOT_DIR/scripts/ensure-actionlint.sh")"

(
  cd "$ROOT_DIR"
  "$actionlint_bin" -color
)
