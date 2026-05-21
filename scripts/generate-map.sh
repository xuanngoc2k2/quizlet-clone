#!/bin/bash

# ============================================================
# generate-map.sh — Initialize CodeGraph Knowledge Graph
# Uses codegraph (colbymchenry/codegraph)
# codegraph auto-syncs via native file watcher after init.
# ============================================================

set -e

echo "🗺️ Initializing Code Knowledge Graph..."

# Check if codegraph is installed
if command -v codegraph &> /dev/null; then
  if [ -d ".codegraph" ]; then
    echo "✅ Graph already initialized. Auto-syncing via file watcher."
    echo "📊 Stats:"
    codegraph status 2>/dev/null || true
  else
    echo "🔨 First-time init..."
    codegraph init
    echo ""
    echo "✅ Knowledge Graph initialized: .codegraph/"
    echo "📊 Stats:"
    codegraph status 2>/dev/null || true
  fi
  echo ""
  echo "AI sẽ tự động dùng graph qua MCP tools."
  echo "Graph tự cập nhật khi bạn code (file watcher)."

else
  echo "⚠️ codegraph chưa cài đặt!"
  echo "Cài đặt ngay: npm install -g @colbymchenry/codegraph && codegraph init"
  exit 1
fi
