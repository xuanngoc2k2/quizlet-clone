#!/bin/bash
# ai-preflight.sh — Kiểm tra môi trường trước khi AI bắt đầu code
# Chạy: ./scripts/ai-preflight.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

PASS=0
WARN=0
FAIL=0

echo ""
echo "🔍 AI Preflight Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Check codegraph installed
if command -v codegraph &> /dev/null; then
  echo -e "${GREEN}✅ codegraph: installed${RESET}"
  ((PASS++))
else
  echo -e "${RED}❌ codegraph: NOT installed${RESET}"
  echo "   → Cài đặt: npm install -g @colbymchenry/codegraph && codegraph init"
  ((FAIL++))
fi

# 2. Check .mcp.json exists (MCP config)
if [ -f ".mcp.json" ] || [ -f "mcp.json" ]; then
  echo -e "${GREEN}✅ MCP config: found${RESET}"
  ((PASS++))
else
  echo -e "${YELLOW}⚠️  MCP config (.mcp.json): not found${RESET}"
  echo "   → AI sẽ fallback sang ARCHITECTURE.md + file tree"
  ((WARN++))
fi

# 3. Check graph has been built
GRAPH_DIRS=(".codegraph" "context" ".crg")
GRAPH_FOUND=false
for dir in "${GRAPH_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    GRAPH_FOUND=true
    echo -e "${GREEN}✅ Graph data: found ($dir/)${RESET}"
    ((PASS++))
    break
  fi
done

if [ "$GRAPH_FOUND" = false ]; then
  if command -v codegraph &> /dev/null; then
    echo -e "${YELLOW}⚠️  Graph data: not built yet${RESET}"
    echo "   → Chạy: codegraph init"
    ((WARN++))
  else
    echo -e "${YELLOW}⚠️  Graph data: not available (codegraph chưa cài)${RESET}"
    ((WARN++))
  fi
fi

# 4. codegraph auto-sync status
if [ "$GRAPH_FOUND" = true ]; then
  echo -e "${GREEN}✅ Graph: auto-synced by codegraph file watcher${RESET}"
  ((PASS++))
fi

# 5. Check AGENTS.md exists
if [ -f "AGENTS.md" ]; then
  echo -e "${GREEN}✅ AGENTS.md: found${RESET}"
  ((PASS++))
else
  echo -e "${RED}❌ AGENTS.md: NOT found${RESET}"
  echo "   → Project không dùng AI template"
  ((FAIL++))
fi

# 6. Check .ai-context.md exists
if [ -f ".ai-context.md" ]; then
  echo -e "${GREEN}✅ .ai-context.md: found (compact rules for AI)${RESET}"
  ((PASS++))
else
  if [ -f ".ai-context.template.md" ]; then
    echo -e "${YELLOW}⚠️  .ai-context.md: not generated yet${RESET}"
    echo "   → Chạy: ./scripts/generate-ai-context.sh"
    ((WARN++))
  else
    echo -e "${YELLOW}⚠️  .ai-context.md: not available${RESET}"
    ((WARN++))
  fi
fi

# 7. Check lint config exists
if [ -f "eslint.config.mjs" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ]; then
  echo -e "${GREEN}✅ ESLint config: found${RESET}"
  ((PASS++))
else
  echo -e "${YELLOW}⚠️  ESLint config: not found${RESET}"
  echo "   → Sẽ được tạo trong Phase 0 từ configs/ templates"
  ((WARN++))
fi

if [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ] || [ -f "prettier.config.mjs" ]; then
  echo -e "${GREEN}✅ Prettier config: found${RESET}"
  ((PASS++))
else
  echo -e "${YELLOW}⚠️  Prettier config: not found${RESET}"
  ((WARN++))
fi

# 8. Check scaffolds available
if [ -d "scaffolds" ] && [ "$(ls scaffolds/*.tmpl 2>/dev/null | wc -l)" -gt 0 ]; then
  SCAFFOLD_COUNT=$(ls scaffolds/*.tmpl 2>/dev/null | wc -l | xargs)
  echo -e "${GREEN}✅ Scaffolds: ${SCAFFOLD_COUNT} templates available${RESET}"
  ((PASS++))
else
  echo -e "${YELLOW}⚠️  Scaffolds: not available${RESET}"
  ((WARN++))
fi

# 9. Check chrome-devtools-mcp (visual UI debugging)
if command -v chrome-devtools-mcp &> /dev/null; then
  echo -e "${GREEN}✅ chrome-devtools-mcp: installed (AI can screenshot & inspect browser)${RESET}"
  ((PASS++))
else
  echo -e "${YELLOW}⚠️  chrome-devtools-mcp: not installed${RESET}"
  echo "   → Cài để AI nhìn được UI: npm install -g chrome-devtools-mcp"
  ((WARN++))
fi

# ── Quick Context (AI reads this instead of opening 6+ files) ──
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Quick Context:"

# Current phase & layer
if [ -f "AGENTS.md" ]; then
  PHASE=$(grep -m1 '\*\*Current Phase:\*\*' AGENTS.md 2>/dev/null | sed 's/.*\*\*Current Phase:\*\* *//' || echo "?")
  LAYER=$(grep -m1 '\*\*Current Layer:\*\*' AGENTS.md 2>/dev/null | sed 's/.*\*\*Current Layer:\*\* *//' || echo "?")
  echo "  Phase: $PHASE"
  echo "  Layer: $LAYER"
fi

# Recent changes
echo "  Recent:"
git log -3 --oneline 2>/dev/null | sed 's/^/    /' || echo "    (no git history)"

# Codebase stats
if [ -d "src" ]; then
  TS_COUNT=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | xargs)
  echo "  Files: ${TS_COUNT} TypeScript files in src/"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ✅ Pass: $PASS  ⚠️  Warn: $WARN  ❌ Fail: $FAIL"

if [ $FAIL -gt 0 ]; then
  echo -e "  ${RED}→ NOT READY — fix errors above${RESET}"
  echo ""
  exit 1
else
  if [ $WARN -gt 0 ]; then
    echo -e "  ${YELLOW}→ READY with warnings${RESET}"
  else
    echo -e "  ${GREEN}→ ALL GOOD — ready to code${RESET}"
  fi
  echo ""
  exit 0
fi
