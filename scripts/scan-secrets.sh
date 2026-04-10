#!/usr/bin/env bash

set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "Error: ripgrep (rg) is required for secret scanning." >&2
  exit 1
fi

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
while IFS= read -r pattern; do
  hit="$(
    git ls-files -z \
      | xargs -0 rg --line-number --pcre2 --hidden --no-ignore-vcs -e "$pattern" \
      || true
  )"
  if [ -n "$hit" ]; then
    matches="${matches}${matches:+$'\n'}${hit}"
  fi
done <<<"$(printf '%s\n' "${PATTERNS[@]}")"

if [ -n "$matches" ]; then
  echo "Potential secrets found. Refuse to push until they are removed." >&2
  echo "$matches" >&2
  exit 1
fi

echo "No obvious secrets detected in tracked files."
