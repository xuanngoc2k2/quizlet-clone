#!/bin/bash
# ai-review.sh — Post-code verification gate
# Chạy: ./scripts/ai-review.sh
# Kiểm tra: graph update, typecheck, lint, test, build
# Exit 0 = all pass, Exit 1 = có fail

set -o pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

PASS=0
FAIL=0
SKIP=0

echo ""
echo "🔍 AI Post-Code Review"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Helper: check if npm script exists
has_npm_script() {
  if [ -f "package.json" ]; then
    node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['$1'] ? 0 : 1)" 2>/dev/null
    return $?
  fi
  return 1
}

if command -v rtk &> /dev/null; then
  RTK="rtk "
  echo -e "  ${GREEN}✅ RTK detected — wrapping verbose commands${RESET}"
else
  RTK=""
fi

# 1. Update code-review-graph
echo ""
echo "📊 Step 1: Update Graph"
if command -v code-review-graph &> /dev/null; then
  if code-review-graph update 2>/dev/null; then
    echo -e "  ${GREEN}✅ Graph updated${RESET}"
    ((PASS++))
  else
    echo -e "  ${YELLOW}⚠️  Graph update failed (non-blocking)${RESET}"
    ((SKIP++))
  fi
else
  echo -e "  ${YELLOW}⏭️  Skipped — code-review-graph not installed${RESET}"
  ((SKIP++))
fi

# 2. TypeScript check
echo ""
echo "🔷 Step 2: TypeScript Check"
if [ -f "tsconfig.json" ]; then
  if ${RTK}npx tsc --noEmit 2>&1; then
    echo -e "  ${GREEN}✅ TypeScript: PASS${RESET}"
    ((PASS++))
  else
    echo -e "  ${RED}❌ TypeScript: FAIL${RESET}"
    ((FAIL++))
  fi
else
  echo -e "  ${YELLOW}⏭️  Skipped — no tsconfig.json${RESET}"
  ((SKIP++))
fi

# 3. Lint
echo ""
echo "🧹 Step 3: Lint"
if has_npm_script "lint"; then
  if ${RTK}npm run lint 2>&1; then
    echo -e "  ${GREEN}✅ Lint: PASS${RESET}"
    ((PASS++))
  else
    echo -e "  ${RED}❌ Lint: FAIL${RESET}"
    ((FAIL++))
  fi
else
  echo -e "  ${YELLOW}⏭️  Skipped — no lint script in package.json${RESET}"
  ((SKIP++))
fi

# 4. Tests
echo ""
echo "🧪 Step 4: Tests"
if has_npm_script "test"; then
  if ${RTK}npm test 2>&1; then
    echo -e "  ${GREEN}✅ Tests: PASS${RESET}"
    ((PASS++))
  else
    echo -e "  ${RED}❌ Tests: FAIL${RESET}"
    ((FAIL++))
  fi
elif has_npm_script "test:unit"; then
  if ${RTK}npm run test:unit 2>&1; then
    echo -e "  ${GREEN}✅ Unit Tests: PASS${RESET}"
    ((PASS++))
  else
    echo -e "  ${RED}❌ Unit Tests: FAIL${RESET}"
    ((FAIL++))
  fi
else
  echo -e "  ${YELLOW}⏭️  Skipped — no test script in package.json${RESET}"
  ((SKIP++))
fi

# 5. Build
echo ""
echo "🏗️  Step 5: Build"
if has_npm_script "build"; then
  if ${RTK}npm run build 2>&1; then
    echo -e "  ${GREEN}✅ Build: PASS${RESET}"
    ((PASS++))
  else
    echo -e "  ${RED}❌ Build: FAIL${RESET}"
    ((FAIL++))
  fi
else
  echo -e "  ${YELLOW}⏭️  Skipped — no build script in package.json${RESET}"
  ((SKIP++))
fi

# Helper: check if package exists in dependencies
has_package() {
  if [ -f "package.json" ]; then
    node -e "const p=require('./package.json'); process.exit((p.dependencies && p.dependencies['$1']) || (p.devDependencies && p.devDependencies['$1']) ? 0 : 1)" 2>/dev/null
    return $?
  fi
  return 1
}

# 6. React Doctor
echo ""
echo "🩺 Step 6: React Doctor"
if has_package "react"; then
  if ${RTK}npx --yes react-doctor 2>&1; then
    echo -e "  ${GREEN}✅ React Doctor: PASS${RESET}"
    ((PASS++))
  else
    echo -e "  ${RED}❌ React Doctor: FAIL${RESET}"
    ((FAIL++))
  fi
else
  echo -e "  ${YELLOW}⏭️  Skipped — not a React project${RESET}"
  ((SKIP++))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 REVIEW SUMMARY"
echo "  ✅ Pass: $PASS  ⏭️  Skip: $SKIP  ❌ Fail: $FAIL"

if [ $FAIL -gt 0 ]; then
  echo -e "  ${RED}→ REVIEW FAILED — fix errors above before committing${RESET}"
  echo ""
  exit 1
else
  echo -e "  ${GREEN}→ REVIEW PASSED — safe to commit${RESET}"
  echo ""
  exit 0
fi
