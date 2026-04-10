#!/usr/bin/env bash

set -euo pipefail

git config core.hooksPath .githooks
echo "Configured .githooks as the local Git hooks directory."
