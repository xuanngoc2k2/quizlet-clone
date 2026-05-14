#!/bin/bash
# generate-ai-context.sh — Generate compact .ai-context.md from AGENTS.md
# Chạy: ./scripts/generate-ai-context.sh
# Khi nào chạy: Sau Phase 0, hoặc khi update AGENTS.md

set -e

SOURCE="AGENTS.md"
OUTPUT=".ai-context.md"
TEMPLATE=".ai-context.template.md"

if [ ! -f "$SOURCE" ]; then
  echo "❌ $SOURCE not found"
  exit 1
fi

if [ ! -f "$TEMPLATE" ]; then
  echo "❌ $TEMPLATE not found"
  exit 1
fi

echo "📝 Generating $OUTPUT from $SOURCE..."

# Copy template
cp "$TEMPLATE" "$OUTPUT"

# Extract Stack (lines between ## Stack and next ##)
STACK=$(sed -n '/^## Stack$/,/^## /{/^## Stack$/d;/^## /d;p;}' "$SOURCE" | head -20)
if [ -z "$STACK" ]; then
  STACK="[Chưa điền — chạy Phase 0 trước]"
fi

# Extract Folder Structure (lines between ## Folder Structure and ---)
FOLDER=$(sed -n '/^## Folder Structure$/,/^---/{/^## Folder Structure$/d;/^---/d;p;}' "$SOURCE" | head -40)
if [ -z "$FOLDER" ]; then
  FOLDER="[Chưa điền — chạy Phase 0 trước]"
fi

# Extract Current Phase (matches: - **Current Phase:** Phase 0 — Planning)
PHASE=$(grep -m1 '\*\*Current Phase:\*\*' "$SOURCE" | sed 's/.*\*\*Current Phase:\*\* *//' || echo "[Unknown]")

# Extract Current Layer (matches: - **Current Layer:** Layer 0 — Foundation)
LAYER=$(grep -m1 '\*\*Current Layer:\*\*' "$SOURCE" | sed 's/.*\*\*Current Layer:\*\* *//' || echo "[Unknown]")

# Extract Learned Rules
LEARNED=$(sed -n '/^## Learned Rules$/,/^---/{/^## Learned Rules$/d;/^---/d;/^<!--/d;/^-->/d;p;}' "$SOURCE")
if [ -z "$(echo "$LEARNED" | tr -d '[:space:]')" ]; then
  LEARNED="[Chưa có]"
fi

# Replace placeholders (macOS compatible)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS sed requires different handling for multiline
  python3 -c "
import sys
content = open('$OUTPUT').read()
content = content.replace('[STACK_PLACEHOLDER]', '''$STACK''')
content = content.replace('[FOLDER_STRUCTURE_PLACEHOLDER]', '''$FOLDER''')
content = content.replace('[PHASE_PLACEHOLDER]', '''$PHASE''')
content = content.replace('[LAYER_PLACEHOLDER]', '''$LAYER''')
content = content.replace('[LEARNED_RULES_PLACEHOLDER]', '''$LEARNED''')
open('$OUTPUT', 'w').write(content)
"
else
  python3 -c "
import sys
content = open('$OUTPUT').read()
content = content.replace('[STACK_PLACEHOLDER]', '''$STACK''')
content = content.replace('[FOLDER_STRUCTURE_PLACEHOLDER]', '''$FOLDER''')
content = content.replace('[PHASE_PLACEHOLDER]', '''$PHASE''')
content = content.replace('[LAYER_PLACEHOLDER]', '''$LAYER''')
content = content.replace('[LEARNED_RULES_PLACEHOLDER]', '''$LEARNED''')
open('$OUTPUT', 'w').write(content)
"
fi

LINES=$(wc -l < "$OUTPUT" | xargs)
echo "✅ Generated $OUTPUT ($LINES lines — vs $(wc -l < "$SOURCE" | xargs) lines in $SOURCE)"
