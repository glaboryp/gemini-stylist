#!/usr/bin/env bash
set -euo pipefail

site="${1:?usage: smoke-frontend.sh <site-url> <api-url>}"
api="${2:?usage: smoke-frontend.sh <site-url> <api-url>}"
site="${site%/}"
api="${api%/}"

html="$(curl -fsS --retry 5 --retry-delay 5 -m 30 "$site/")"
grep -q 'id="app"' <<< "$html" || { echo "::error::The site did not return the app shell"; exit 1; }

asset="$(grep -o '/assets/index-[^"]*\.js' <<< "$html" | head -1 || true)"
[ -n "$asset" ] || { echo "::error::No JavaScript bundle found in the page"; exit 1; }

curl -fsS --retry 3 --retry-delay 5 -m 60 "$site$asset" | grep -qF "$api" \
  || { echo "::error::The published bundle does not point to $api"; exit 1; }

echo "frontend ok: $site serves $asset pointing to $api"
