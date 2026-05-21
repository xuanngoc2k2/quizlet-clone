#!/bin/bash

# ============================================================
# start-project.sh — Kick off a new project from this template
# Usage: ./scripts/start-project.sh
# Compatible: macOS + Linux
# ============================================================

set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   🚀 Universal AI Project Starter        ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${RESET}"
echo ""

# ── Prereqs check ────────────────────────────────────────────
if ! command -v git &> /dev/null; then
  echo -e "${RED}❌ git not found. Please install git first.${RESET}"
  exit 1
fi

# ── Step 1: Project name ────────────────────────────────────
echo -e "${CYAN}Step 1/5: Project name${RESET}"
read -p "  Tên project: " PROJECT_NAME

if [ -z "$PROJECT_NAME" ]; then
  echo -e "${RED}❌ Tên project không được để trống.${RESET}"
  exit 1
fi

# ── Step 2: Brain dump ──────────────────────────────────────
echo ""
echo -e "${CYAN}Step 2/5: Brain dump ý tưởng${RESET}"
echo -e "  ${YELLOW}Mô tả ngắn gọn về project (không cần chuẩn):${RESET}"
echo -e "  ${YELLOW}App làm gì, user là ai, tính năng chính, stack muốn dùng...${RESET}"
echo -e "  ${YELLOW}(Nhấn Enter 2 lần để xong, hoặc Enter ngay để skip)${RESET}"
echo ""

BRIEF=""
while IFS= read -r line; do
  # Empty line = done (Enter để kết thúc)
  if [ -z "$line" ]; then
    break
  fi
  if [ -n "$BRIEF" ]; then
    BRIEF="${BRIEF}
${line}"
  else
    BRIEF="${line}"
  fi
done

if [ -z "$(echo "$BRIEF" | tr -d '[:space:]')" ]; then
  BRIEF="(Chưa có mô tả — AI sẽ hỏi thêm trong Phase 0)"
fi

# ── Step 3: Specifications file ──────────────────────────────────────
echo ""
echo -e "${CYAN}Step 3/5: File mô tả chức năng (optional)${RESET}"
echo -e "  ${YELLOW}Bạn có file mô tả chức năng sẵn không? (y/n)${RESET}"
read -p "  Có file spec? (y/n): " HAS_SPEC

if [[ "$HAS_SPEC" =~ ^[Yy]$ ]]; then
  read -p "  Đường dẫn file: " SPEC_PATH
  if [ -f "$SPEC_PATH" ]; then
    # Read spec content and replace placeholder
    SPEC_CONTENT=$(cat "$SPEC_PATH")
    python3 -c "
import sys
content = open('docs/SPECIFICATIONS.md').read()
content = content.replace('[SPECIFICATIONS_CONTENT]', sys.argv[1])
open('docs/SPECIFICATIONS.md', 'w').write(content)
" "$SPEC_CONTENT" 2>/dev/null || {
      # Fallback: overwrite with original content
      cp "$SPEC_PATH" docs/SPECIFICATIONS.md
    }
    echo -e "  ${GREEN}✅ Specifications → docs/SPECIFICATIONS.md${RESET}"
  else
    echo -e "  ${RED}⚠️  File không tồn tại: $SPEC_PATH — bỏ qua${RESET}"
  fi
else
  echo -e "  ⏭️  Bỏ qua — AI sẽ hỏi thêm trong Phase 0"
fi

# ── Step 4: AI tools selection ──────────────────────────────────────
echo ""
echo -e "${CYAN}Step 4/5: Chọn AI tools sử dụng${RESET}"
echo -e "  ${YELLOW}Nhập số (cách nhau bởi space), Enter để chọn tất cả:${RESET}"
echo "  1) Claude Code / Opencode"
echo "  2) Cursor"
echo "  3) Windsurf"
echo "  4) GitHub Copilot"
echo "  5) Codex (AGENTS.md — luôn có)"
echo ""
read -p "  Chọn (ví dụ: 1 2 4): " TOOL_SELECTION

# Default: all tools
if [ -z "$TOOL_SELECTION" ]; then
  TOOL_SELECTION="1 2 3 4 5"
fi

# ── Step 5: Setup files ───────────────────────────────────────────
echo ""
echo -e "${CYAN}Step 5/5: Đang setup files...${RESET}"

TODAY=$(date +%Y-%m-%d)

# Replace [PROJECT_NAME] in all markdown files (macOS compatible)
find . -name "*.md" -not -path "./.git/*" -print0 | while IFS= read -r -d '' file; do
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/\[PROJECT_NAME\]/$PROJECT_NAME/g" "$file" 2>/dev/null || true
    sed -i '' "s/\[DATE\]/$TODAY/g" "$file" 2>/dev/null || true
  else
    sed -i "s/\[PROJECT_NAME\]/$PROJECT_NAME/g" "$file" 2>/dev/null || true
    sed -i "s/\[DATE\]/$TODAY/g" "$file" 2>/dev/null || true
  fi
done

# Write brain dump to docs/BRIEF.md (safe multiline replace)
python3 -c "
import sys
content = open('docs/BRIEF.md').read()
content = content.replace('[BRIEF_CONTENT]', sys.argv[1])
open('docs/BRIEF.md', 'w').write(content)
" "$BRIEF" 2>/dev/null || {
  # Fallback: single-line sed if python3 not available
  BRIEF_ONELINE=$(echo "$BRIEF" | tr '\n' ' ')
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|\[BRIEF_CONTENT\]|${BRIEF_ONELINE}|" docs/BRIEF.md 2>/dev/null || true
  else
    sed -i "s|\[BRIEF_CONTENT\]|${BRIEF_ONELINE}|" docs/BRIEF.md 2>/dev/null || true
  fi
}

echo -e "  ${GREEN}✅ Placeholders replaced${RESET}"
echo -e "  ${GREEN}✅ Brain dump → docs/BRIEF.md${RESET}"

# Remove unselected AI tool adapter files
if [[ ! "$TOOL_SELECTION" =~ "1" ]]; then
  rm -f CLAUDE.md
  echo -e "  ⏭️  Skipped: CLAUDE.md"
fi
if [[ ! "$TOOL_SELECTION" =~ "2" ]]; then
  rm -f .cursorrules
  echo -e "  ⏭️  Skipped: .cursorrules"
fi
if [[ ! "$TOOL_SELECTION" =~ "3" ]]; then
  rm -f .windsurfrules
  echo -e "  ⏭️  Skipped: .windsurfrules"
fi
if [[ ! "$TOOL_SELECTION" =~ "4" ]]; then
  rm -f .github/copilot-instructions.md
  echo -e "  ⏭️  Skipped: copilot-instructions.md"
fi

echo -e "  ${GREEN}✅ AI adapter files configured${RESET}"

# Create project folders
mkdir -p src tests/unit tests/integration tests/e2e context memory
echo -e "  ${GREEN}✅ Folders created: src/, tests/, context/, memory/${RESET}"

# Copy lint config templates
if [ -d "configs" ]; then
  cp configs/eslint.config.template.mjs eslint.config.mjs 2>/dev/null && \
    echo -e "  ${GREEN}✅ ESLint config → eslint.config.mjs${RESET}" || true
  cp configs/.prettierrc.template.json .prettierrc.json 2>/dev/null && \
    echo -e "  ${GREEN}✅ Prettier config → .prettierrc.json${RESET}" || true
fi

# Generate .ai-context.md
if [ -f ".ai-context.template.md" ]; then
  if [ -x "scripts/generate-ai-context.sh" ]; then
    bash scripts/generate-ai-context.sh 2>/dev/null && \
      echo -e "  ${GREEN}✅ .ai-context.md generated (compact rules for AI)${RESET}" || \
      echo -e "  ${YELLOW}⚠️  .ai-context.md generation failed — can run later${RESET}"
  else
    cp .ai-context.template.md .ai-context.md
    echo -e "  ${GREEN}✅ .ai-context.md copied from template${RESET}"
  fi
fi

# ── Git init + Hooks ────────────────────────────────────────
rm -rf .git
git init -b main > /dev/null 2>&1

# Setup git hooks
mkdir -p .git/hooks

# Pre-commit: lint gate (block commit on lint failure)
cat << 'PREHOOK' > .git/hooks/pre-commit
#!/bin/bash
# Block commit if lint or typecheck fails
if [ -f "package.json" ]; then
  # TypeScript check
  if [ -f "tsconfig.json" ]; then
    npx tsc --noEmit --quiet 2>/dev/null
    if [ $? -ne 0 ]; then
      echo "❌ TypeScript check failed — fix errors before commit"
      exit 1
    fi
  fi
  # Lint check
  if node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['lint'] ? 0 : 1)" 2>/dev/null; then
    npm run lint --silent 2>/dev/null
    if [ $? -ne 0 ]; then
      echo "❌ Lint failed — fix errors before commit"
      exit 1
    fi
  fi
fi
PREHOOK
chmod +x .git/hooks/pre-commit

# Post-commit: auto-update code knowledge graph
cat << 'POSTHOOK' > .git/hooks/post-commit
#!/bin/bash
# Auto-update code knowledge graph after each commit
# codegraph uses native file watcher (FSEvents/inotify) for auto-sync.
# No manual update needed — graph stays fresh automatically.
if command -v codegraph &> /dev/null && [ ! -d ".codegraph" ]; then
  codegraph init > /dev/null 2>&1 &
fi

# Auto-regenerate .ai-context.md if template exists
if [ -f ".ai-context.template.md" ] && [ -x "scripts/generate-ai-context.sh" ]; then
  bash scripts/generate-ai-context.sh > /dev/null 2>&1 &
fi
POSTHOOK
chmod +x .git/hooks/post-commit

git add .
git commit -m "feat: init $PROJECT_NAME project" -q
echo -e "  ${GREEN}✅ Fresh git repo initialized with auto-context hook${RESET}"

# ── Suggest codegraph ───────────────────────────────────────
if ! command -v codegraph &> /dev/null; then
  echo ""
  echo -e "  ${YELLOW}💡 Gợi ý: Cài codegraph để AI navigate code thông minh hơn.${RESET}"
  read -p "     Bạn có muốn cài đặt codegraph ngay bây giờ không? (y/n): " INSTALL_CRG
  if [[ "$INSTALL_CRG" =~ ^[Yy]$ ]]; then
    echo -e "     ${CYAN}Đang cài đặt codegraph...${RESET}"
    npm install -g @colbymchenry/codegraph
    
    if command -v codegraph &> /dev/null; then
        echo -e "     ${CYAN}Đang build knowledge graph...${RESET}"
        codegraph init
        echo -e "     ${GREEN}✅ codegraph đã được cài đặt và build thành công.${RESET}"
    else
        echo -e "     ${RED}❌ Lỗi cài đặt codegraph. Vui lòng cài đặt thủ công: npm install -g @colbymchenry/codegraph && codegraph init${RESET}"
    fi
  else
    echo -e "     ${YELLOW}⏭️  Bỏ qua cài đặt codegraph. Bạn có thể cài sau bằng lệnh: npm install -g @colbymchenry/codegraph && codegraph init${RESET}"
  fi
fi

# ── Suggest RTK ───────────────────────────────
if ! command -v rtk &> /dev/null; then
  echo ""
  echo -e "  ${YELLOW}💡 Gợi ý: Cài RTK (Reduce Token Kit) để nén Terminal output, giảm 60-90% token rác cho AI.${RESET}"
  read -p "     Bạn có muốn cài đặt RTK ngay bây giờ không? (y/n): " INSTALL_RTK
  if [[ "$INSTALL_RTK" =~ ^[Yy]$ ]]; then
    echo -e "     ${CYAN}Đang cài đặt RTK...${RESET}"
    if command -v brew &> /dev/null; then
        brew install rtk
    elif command -v cargo &> /dev/null; then
        cargo install --git https://github.com/rtk-ai/rtk
    else
        curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
    fi
    echo -e "     ${GREEN}✅ RTK đã được cài đặt.${RESET}"
  else
    echo -e "     ${YELLOW}⏭️  Bỏ qua cài đặt RTK. Bạn có thể cài sau bằng Homebrew hoặc Cargo.${RESET}"
  fi
fi

# ── Suggest chrome-devtools-mcp ─────────────────────────────
if ! command -v chrome-devtools-mcp &> /dev/null; then
  echo ""
  echo -e "  ${YELLOW}💡 Gợi ý: Cài chrome-devtools-mcp để AI có thể nhìn và debug UI trên trình duyệt.${RESET}"
  echo -e "  ${YELLOW}   (Screenshot, Console logs, DOM inspect, Lighthouse audit — tất cả qua MCP)${RESET}"
  read -p "     Bạn có muốn cài đặt chrome-devtools-mcp ngay bây giờ không? (y/n): " INSTALL_CDT
  if [[ "$INSTALL_CDT" =~ ^[Yy]$ ]]; then
    echo -e "     ${CYAN}Đang cài đặt chrome-devtools-mcp...${RESET}"
    npm install -g chrome-devtools-mcp
    if command -v chrome-devtools-mcp &> /dev/null; then
        echo -e "     ${GREEN}✅ chrome-devtools-mcp đã được cài đặt.${RESET}"
        echo -e "     ${CYAN}📝 Thêm vào MCP config (.mcp.json) để AI tool kết nối:${RESET}"
        echo -e "     ${CYAN}   {\"mcpServers\":{\"chrome-devtools\":{\"command\":\"chrome-devtools-mcp\"}}}${RESET}"
    else
        echo -e "     ${RED}❌ Lỗi cài đặt. Cài thủ công: npm install -g chrome-devtools-mcp${RESET}"
    fi
  else
    echo -e "     ${YELLOW}⏭️  Bỏ qua. Cài sau: npm install -g chrome-devtools-mcp${RESET}"
  fi
fi

# ── Done ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  ✅ Project sẵn sàng!${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  📁 ${YELLOW}$(pwd)${RESET}"
echo ""
echo -e "  Bước tiếp theo:"
echo -e "  ${CYAN}1. Mở folder này bằng AI tool bất kỳ${RESET}"
echo -e "  ${CYAN}2. Nói: \"bắt đầu\"${RESET}"
echo -e "  ${CYAN}3. AI tự chạy Phase 0 → plan → code 🚀${RESET}"
echo ""
echo -e "${GREEN}${BOLD}Happy building! 🎉${RESET}"
echo ""
