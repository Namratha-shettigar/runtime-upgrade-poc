#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# build-layer.sh — fills layers/sass/nodejs/node_modules with node-sass,
# compiled for the Node version written in .nvmrc (NOT your laptop's Node).
#
# Why: native packages must match the Lambda runtime exactly. Your laptop
# has Node 22, but the Lambda runs Node 18, so we temporarily download
# Node 18 just for this install.
# ---------------------------------------------------------------------------

# Stop immediately if any command fails (-e), if a variable is missing (-u),
# or if any part of a piped command fails (-o pipefail).
set -euo pipefail

# Go to the project's main folder (one level up from this script's folder),
# so the script works no matter where you run it from.
cd "$(dirname "$0")/.."

# Read the Node version from .nvmrc (e.g. "18") — the single source of truth.
NODE_VERSION="$(tr -d '[:space:]' < .nvmrc)"
echo "Building layer for Node ${NODE_VERSION} ..."

# Go into the layer's folder. Lambda expects Node layers to contain a
# "nodejs/node_modules" folder, which ends up at /opt/nodejs/node_modules.
cd layers/sass/nodejs

# Delete any old build so we start clean.
rm -rf node_modules package-lock.json

# The trick: "npx -p node@18" temporarily downloads Node 18 and puts it first
# on the PATH. So the "npm install" after "--" runs under Node 18, and
# node-sass downloads its Node 18 (ABI 108), Linux machine-code file.
#   --omit=dev     = skip developer-only packages
#   --no-audit / --no-fund = skip extra messages
npx --yes -p "node@${NODE_VERSION}" -- npm install --omit=dev --no-audit --no-fund

# Show which compiled file was downloaded (proof of which Node it is for).
echo "Native binary installed:"
ls node_modules/node-sass/vendor/
