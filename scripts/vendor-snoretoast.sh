#!/bin/sh
# Downloads KDE's official SnoreToast x64 build (KDE Craft, built from the
# snoretoast-v$VERSION.tar.bz2 release on download.kde.org) and vendors it,
# verifying the archive against a pinned checksum. Run with --check to only
# verify that the vendored exe is identical to the build, without changing
# anything. KDE does not publish an x86 build, so snoretoast-x86.exe stays on
# the signed 0.7.0 release.
set -eu

VERSION=0.9.1
SHA256=693e4c24fb19717dfa70b29ba59c02e7af147f644dd3d1b20d1e6f536bbc6a4c
URL="https://files.kde.org/craft/Qt6/26.05/windows/cl/msvc2022/x86_64/RelWithDebInfo/dev-utils/snoretoast/snoretoast-$VERSION-89-20260525T150325-windows-cl-msvc2022-x86_64.7z"
TARGET="$(cd "$(dirname "$0")/.." && pwd)/vendor/snoreToast/snoretoast-x64.exe"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

curl --proto =https --tlsv1.2 -fsSL -o "$tmp/build.7z" "$URL"
echo "$SHA256  $tmp/build.7z" | shasum -a 256 -c -
if command -v bsdtar >/dev/null 2>&1; then
  bsdtar -xf "$tmp/build.7z" -C "$tmp" bin/snoretoast.exe
else
  7z x -o"$tmp" "$tmp/build.7z" bin/snoretoast.exe >/dev/null
fi

if [ "${1:-}" = "--check" ]; then
  cmp "$tmp/bin/snoretoast.exe" "$TARGET"
  echo "Vendored snoretoast-x64.exe matches the KDE $VERSION build."
else
  cp "$tmp/bin/snoretoast.exe" "$TARGET"
  chmod +x "$TARGET"
  echo "Vendored SnoreToast $VERSION (x64)."
fi
