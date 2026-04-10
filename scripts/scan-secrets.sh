#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"

PATTERNS=(
  'sk-[A-Za-z0-9_-]{20,}'
  'AKIA[0-9A-Z]{16}'
  'ghp_[A-Za-z0-9]{36,}'
  'xox[baprs]-[A-Za-z0-9-]{10,}'
  'AIza[0-9A-Za-z_-]{35}'
  '(?i)(openai|paperless)[-_]?(api[_-]?)?token\\s*[:=]\\s*[^\\s\\\"]+'
  '(?i)(password|secret[_-]?key|api[_-]?key|private[_-]?key)\\s*[:=]\\s*[^\\s]+'
  '(?i)BEGIN [A-Z ]*PRIVATE KEY'
  'eyJ[a-zA-Z0-9_-]{20,}\\.[a-zA-Z0-9_-]{20,}\\.[a-zA-Z0-9_-]{20,}'
)

matches=""

if command -v rg >/dev/null 2>&1; then
  while IFS= read -r pattern; do
    hit="$(
      git -C "$ROOT_DIR" ls-files -z \
        | xargs -0 rg --line-number --pcre2 --hidden --no-ignore-vcs -e "$pattern" \
        || true
    )"
    if [ -n "$hit" ]; then
      matches="${matches}${matches:+$'\n'}${hit}"
    fi
  done <<<"$(printf '%s\n' "${PATTERNS[@]}")"
elif command -v python3 >/dev/null 2>&1; then
  scan_output="$(
    printf '%s\n' "${PATTERNS[@]}" |
      python3 - "$ROOT_DIR" <<'PY'
import os
import re
import subprocess
import sys


root = sys.argv[1]
patterns = [line.rstrip("\n") for line in sys.stdin if line.strip()]
compiled_patterns = [re.compile(pattern) for pattern in patterns]

files_blob = subprocess.check_output(["git", "-C", root, "ls-files", "-z"])
for file_path_bytes in files_blob.split(b"\0"):
    if not file_path_bytes:
        continue
    relative_path = file_path_bytes.decode("utf-8", errors="replace")
    absolute_path = os.path.join(root, relative_path)
    try:
        with open(absolute_path, "r", encoding="utf-8", errors="ignore") as handle:
            for line_number, line in enumerate(handle, start=1):
                for expression in compiled_patterns:
                    if expression.search(line):
                        print(f"{relative_path}:{line_number}:{line.rstrip()}")
                        break
    except OSError:
        continue
PY
  )"
  if [ -n "$scan_output" ]; then
    matches="$scan_output"
  fi
else
  echo "Error: neither ripgrep (rg) nor python3 is available for secret scanning." >&2
  exit 1
fi

if [ -n "$matches" ]; then
  echo "Potential secrets found. Refuse to push until they are removed." >&2
  echo "$matches" >&2
  exit 1
fi

echo "No obvious secrets detected in tracked files."
