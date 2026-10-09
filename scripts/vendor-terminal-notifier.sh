#!/bin/sh
# Downloads the official terminal-notifier release and vendors it, verifying
# the archive against a pinned checksum. Run with --check to only verify that
# the vendored app is identical to the release, without changing anything.
set -eu

VERSION=3.0.0
SHA256=e804fd4727db2e146cd88edc9deb9f207a605744212c9ee386456b54f7a28dde
URL="https://github.com/julienXX/terminal-notifier/releases/download/$VERSION/terminal-notifier-$VERSION.zip"
TARGET="$(cd "$(dirname "$0")/.." && pwd)/vendor/mac.noindex/terminal-notifier.app"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

curl --proto =https --tlsv1.2 -fsSL -o "$tmp/release.zip" "$URL"
echo "$SHA256  $tmp/release.zip" | shasum -a 256 -c -
unzip -q "$tmp/release.zip" -d "$tmp"

if [ "${1:-}" = "--check" ]; then
  diff -r "$tmp/terminal-notifier.app" "$TARGET"
  echo "Vendored terminal-notifier.app matches the $VERSION release."
else
  rm -rf "$TARGET"
  cp -R "$tmp/terminal-notifier.app" "$TARGET"
  echo "Vendored terminal-notifier $VERSION."
fi
