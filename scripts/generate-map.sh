#!/bin/bash

# ============================================================
# generate-map.sh — Build/Update Code Knowledge Graph
# Uses codegraph (colbymchenry/codegraph)
# ============================================================

set -e

echo "🗺️ Building Code Knowledge Graph..."

# Check if codegraph is installed
if command -v codegraph &> /dev/null; then
  # Check if graph already exists → incremental update
  if [ -d ".codegraph" ]; then
    echo "📡 Incremental update (only changed files)..."
    codegraph init -i
  else
    echo "🔨 First build (full parse)..."
    codegraph init -i
  fi

  echo ""
  echo "✅ Knowledge Graph updated: .codegraph/"
  echo "📊 Stats:"
  codegraph status 2>/dev/null || true
  echo ""
  echo "AI sẽ tự động dùng graph qua MCP tools."

else
  echo "⚠️ codegraph chưa cài đặt!"
  echo "Cài đặt ngay: npm install -g @colbymchenry/codegraph && codegraph init -i"
  exit 1
fi

