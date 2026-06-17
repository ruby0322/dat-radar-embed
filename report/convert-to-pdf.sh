#!/usr/bin/env bash
set -euo pipefail

INPUT_FILE="${1:-report.md}"
OUTPUT_FILE="${2:-r14725076.pdf}"
TEMPLATE="template.tex"

if [ ! -f "$INPUT_FILE" ]; then
  echo "Error: Input file '$INPUT_FILE' not found."
  exit 1
fi

if ! command -v pandoc >/dev/null 2>&1; then
  echo "Error: pandoc is required but not found."
  exit 1
fi

if ! command -v xelatex >/dev/null 2>&1; then
  echo "Error: xelatex is required but not found."
  echo "Install a LaTeX distribution with XeLaTeX (e.g. MacTeX, TeX Live)."
  exit 1
fi

TEMP_TEX="${OUTPUT_FILE%.pdf}.temp.tex"

echo "Converting $INPUT_FILE to $OUTPUT_FILE using $TEMPLATE..."

pandoc "$INPUT_FILE" \
  --from=markdown+grid_tables+multiline_tables \
  --template="$TEMPLATE" \
  -o "$TEMP_TEX"

echo "Running xelatex (first pass)..."
if ! xelatex -interaction=nonstopmode -output-directory=. "$TEMP_TEX" >/dev/null 2>&1; then
  echo "First XeLaTeX pass failed. Retrying with verbose output:"
  xelatex -interaction=nonstopmode -output-directory=. "$TEMP_TEX"
  rm -f "${TEMP_TEX%.tex}.aux" "${TEMP_TEX%.tex}.log" "${TEMP_TEX%.tex}.toc" "$TEMP_TEX"
  exit 1
fi

echo "Running xelatex (second pass for TOC)..."
if ! xelatex -interaction=nonstopmode -output-directory=. "$TEMP_TEX" >/dev/null 2>&1; then
  echo "Second XeLaTeX pass failed. Retrying with verbose output:"
  xelatex -interaction=nonstopmode -output-directory=. "$TEMP_TEX"
  rm -f "${TEMP_TEX%.tex}.aux" "${TEMP_TEX%.tex}.log" "${TEMP_TEX%.tex}.toc" "$TEMP_TEX"
  exit 1
fi

rm -f "${TEMP_TEX%.tex}.aux" "${TEMP_TEX%.tex}.log" "${TEMP_TEX%.tex}.toc" "$TEMP_TEX"

if [ -f "${TEMP_TEX%.tex}.pdf" ]; then
  mv "${TEMP_TEX%.tex}.pdf" "$OUTPUT_FILE"
  echo "Generated $OUTPUT_FILE"
else
  echo "Conversion failed — PDF not generated."
  exit 1
fi
