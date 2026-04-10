#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS_DIR="$ROOT_DIR/.tools/actionlint"
VERSION="1.7.8"
INSTALL_DIR="$TOOLS_DIR/$VERSION"
BIN_PATH="$INSTALL_DIR/actionlint"

if [ -x "$BIN_PATH" ]; then
  printf '%s\n' "$BIN_PATH"
  exit 0
fi

mkdir -p "$INSTALL_DIR"

os_name="$(uname -s)"
arch_name="$(uname -m)"

case "$os_name" in
  Darwin) asset_os="darwin" ;;
  Linux) asset_os="linux" ;;
  *)
    echo "Unsupported OS for actionlint bootstrap: $os_name" >&2
    exit 1
    ;;
esac

case "$arch_name" in
  arm64|aarch64) asset_arch="arm64" ;;
  x86_64|amd64) asset_arch="amd64" ;;
  *)
    echo "Unsupported architecture for actionlint bootstrap: $arch_name" >&2
    exit 1
    ;;
esac

archive_name="actionlint_${VERSION}_${asset_os}_${asset_arch}.tar.gz"
archive_path="$INSTALL_DIR/$archive_name"
download_url="https://github.com/rhysd/actionlint/releases/download/v${VERSION}/${archive_name}"

curl -L "$download_url" -o "$archive_path"
tar -xzf "$archive_path" -C "$INSTALL_DIR"
rm -f "$archive_path"

printf '%s\n' "$BIN_PATH"
