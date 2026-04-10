#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

bash "$ROOT_DIR/scripts/ensure-python-lint-tools.sh"

shellcheck_bin="$ROOT_DIR/.venv-lint/bin/shellcheck"
targets=()

while IFS= read -r file; do
  targets+=("$file")
done < <(
  cd "$ROOT_DIR" &&
    find .githooks scripts -type f \( -name '*.sh' -o -path '.githooks/pre-push' \) \
      | sort
)

if [ "${#targets[@]}" -eq 0 ]; then
  exit 0
fi

(
  cd "$ROOT_DIR"
  "$shellcheck_bin" "${targets[@]}"
)
