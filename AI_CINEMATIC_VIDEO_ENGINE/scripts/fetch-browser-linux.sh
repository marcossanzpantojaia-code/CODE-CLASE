#!/usr/bin/env bash
# Descarga Chrome Headless Shell (la versión con la que Remotion 4.0.537 está
# probado) dentro del proyecto, en .cache/. Solo hace falta en Linux con glibc
# reciente cuando remotion.media no es accesible: Remotion intentaría descargarlo
# de allí. En Windows y macOS Remotion lo descarga solo desde storage.googleapis.com.
set -euo pipefail

VERSION="157.0.8080.0"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/.cache/chrome-headless-shell/$VERSION"
BIN="$DEST/chrome-headless-shell-linux64/chrome-headless-shell"

if [ -x "$BIN" ]; then
  echo "$BIN"
  exit 0
fi

mkdir -p "$DEST"
URL="https://storage.googleapis.com/chrome-for-testing-public/$VERSION/linux64/chrome-headless-shell-linux64.zip"
curl -fsSL "$URL" -o "$DEST/chs.zip"
unzip -q "$DEST/chs.zip" -d "$DEST"
rm "$DEST/chs.zip"
"$BIN" --version >&2
echo "$BIN"
