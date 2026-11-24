#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# build-layer.sh — downloads numpy + pandas built for the Python version in
# .python-version, for Lambda's Linux, into layers/data/python/.
#
# Your laptop's Python version doesn't matter: we tell pip which Python and
# which machine to download for, and it fetches ready-made files ("wheels").
# ---------------------------------------------------------------------------

# Stop on any error (-e), on missing variables (-u), and on failures in pipes.
set -euo pipefail

# Move to the project's main folder (one level above this script).
cd "$(dirname "$0")/.."

# Read the Python version, e.g. "3.8" — the single source of truth.
PY_VERSION="$(tr -d '[:space:]' < .python-version)"
echo "Building layer for Python ${PY_VERSION} ..."

# Lambda expects Python layers to have a "python" folder; it is placed at
# /opt/python and Python finds packages there automatically.
TARGET=layers/data/python

# Remove the old build so we start clean.
rm -rf "$TARGET"

# Download and unpack the packages:
#   --target                     put them in our layer folder
#   --platform manylinux2014_x86_64  build for Lambda's Linux on Intel/AMD (x86_64)
#   --python-version             build for the Python in .python-version
#   --implementation cp          for standard Python ("CPython")
#   --only-binary=:all:          only ready-made files, never compile on this laptop
#   --upgrade                    always fetch fresh copies
#   -r                           read the package list from requirements.txt
python3 -m pip install \
  --target "$TARGET" \
  --platform manylinux2014_x86_64 \
  --python-version "$PY_VERSION" \
  --implementation cp \
  --only-binary=:all: \
  --upgrade \
  --quiet \
  -r layers/data/requirements.txt

# Proof of which Python the machine code is for: look for "cpython-38" in file names.
echo "Compiled files are for:"
find "$TARGET/numpy" -name "*.so" | head -1
# Show the size; Lambda allows at most 250 MB unzipped for functions + layers.
du -sh "$TARGET"
