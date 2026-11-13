#!/bin/sh
# Render public/favicon.svg into the favicon and PWA icons. Needs ImageMagick.
set -e
cd "$(dirname "$0")/.."
src=public/favicon.svg
png() { magick -background none -density 384 "$src" -resize "$1x$1" -depth 8 "$2"; }
png 512 public/assets/pwa-512x512.png
png 512 public/assets/pwa-maskable-512x512.png
png 192 public/assets/pwa-192x192.png
png 180 public/assets/apple-touch-icon.png
png 32 public/favicon.png
magick -background none -density 384 "$src" -depth 8 -define icon:auto-resize=48,32,16 public/favicon.ico
