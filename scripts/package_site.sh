#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/public"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE_NAME="tripdotdot-ui-refresh-${TIMESTAMP}.zip"
OUTPUT_PATH="$DIST_DIR/$ARCHIVE_NAME"

mkdir -p "$DIST_DIR"
rm -f "$DIST_DIR"/tripdotdot-ui-refresh-*.zip

cd "$ROOT_DIR"
zip -r "$OUTPUT_PATH" \
  index.html \
  en/index.html \
  ja/index.html \
  th/index.html \
  assets \
  i18n \
  privacy_ko.html \
  privacy_en.html \
  privacy_ja.html \
  privacy_th.html \
  favicon-16x16.png \
  favicon-32x32.png \
  favicon-48x48.png \
  favicon-64x64.png \
  favicon-128x128.png \
  favicon-180x180.png \
  favicon-192x192.png \
  favicon-256.png \
  favicon-256x256.png \
  favicon-512.png \
  favicon-512x512.png \
  favicon.ico \
  favicon.svg \
  apple-icon.png \
  CNAME \
  robots.txt \
  sitemap.xml \
  thumbnail.jpg >/dev/null

echo "패키징 완료: $OUTPUT_PATH"
