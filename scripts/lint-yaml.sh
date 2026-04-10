#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

bash "$ROOT_DIR/scripts/ensure-python-lint-tools.sh"

yamllint_bin="$ROOT_DIR/.venv-lint/bin/yamllint"
targets=()

while IFS= read -r file; do
  targets+=("$file")
done < <(
  cd "$ROOT_DIR" &&
    find .github -type f \( -name '*.yml' -o -name '*.yaml' \) | sort
)

targets+=(".yamllint.yml")

(
  cd "$ROOT_DIR"
  "$yamllint_bin" "${targets[@]}"
)
