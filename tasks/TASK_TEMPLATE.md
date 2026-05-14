## Task [ID]: [Title]

> Copy template này khi tạo task mới trong `layer-N-todo.md`.
> Xóa template này sau khi project bắt đầu.

### Goal
[Mô tả ngắn gọn mục tiêu — 1-2 câu]

### Type
<!-- Chọn 1: ui | api | service | test | config | fix -->
[TYPE]

### Scope
- **Files:** [exact paths — tạo/sửa/xóa]
- **Scaffold:** [scaffolds/*.tmpl nào sử dụng]
- **Forbidden:** [files KHÔNG được đụng]

### Pre-Code Checklist
- [ ] Đọc `.ai-context.md`
- [ ] Check existing patterns (đã có component/hook/service tương tự?)
- [ ] Impact Analysis (allowed/forbidden/risk files)
- [ ] Component Plan (UI tasks — liệt kê components)

### Steps (bite-sized — mỗi step 2-5 phút)
<!-- 
Mỗi step phải có: exact file path + actual code + command + expected output.
KHÔNG dùng: "TBD", "TODO", "similar to step N", "add appropriate handling".
-->

- [ ] **Step 1: Write failing test**
  - File: `tests/unit/[exact-path].test.ts`
  - Code: [actual test code hoặc scaffold ref]
  - Run: `npm test -- [test-file]`
  - Expected: FAIL

- [ ] **Step 2: Verify test fails**
  - Run test → confirm FAIL message
  - Nếu test PASS → test viết sai, sửa test trước

- [ ] **Step 3: Implement minimal code**
  - File: `src/[exact-path]`
  - Code: [actual implementation hoặc scaffold ref]
  - KHÔNG code thêm ngoài scope

- [ ] **Step 4: Verify test passes**
  - Run: `npm test -- [test-file]`
  - Expected: PASS (paste raw output)
  - Run: `npx tsc --noEmit` → 0 errors

- [ ] **Step 5: Commit**
  - `git add [files]`
  - `git commit -m "feat/fix: [mô tả]"`

<!-- Lặp lại Step 1-5 nếu task có nhiều sub-features -->

### Applicable Rules (theo Type)
<!-- Chỉ uncomment block tương ứng với Task Type -->

<!-- Type=ui -->
<!-- ⚠️ PHẢI đọc skills TRƯỚC KHI code (không skip): -->
<!-- - Đọc `ui-ux-pro-max/SKILL.md` → palette, typography, layout patterns -->
<!-- - Đọc `frontend-dev-guidelines/SKILL.md` → component architecture -->
<!-- - Nếu React: đọc `react-best-practices/SKILL.md` + `react-ui-patterns/SKILL.md` -->
<!-- Rules: -->
<!-- - Page = compose only. KHÔNG logic/state/fetch -->
<!-- - JSX > 50 dòng → tách component -->
<!-- - Logic → hooks/useXxx.ts | Fetch → services/xxx.service.ts -->
<!-- - Scaffold: scaffolds/component.tsx.tmpl -->

<!-- Type=api -->
<!-- - Route = parse request + call service. KHÔNG business logic -->
<!-- - Validation = Zod schema | Error = try/catch -->
<!-- - Scaffold: scaffolds/api-route.ts.tmpl -->

<!-- Type=service -->
<!-- - Pure business logic. Không framework imports -->
<!-- - Scaffold: scaffolds/service.ts.tmpl -->

<!-- Type=test -->
<!-- - AAA: Arrange-Act-Assert -->
<!-- - Scaffold: scaffolds/test.ts.tmpl -->

### Verification (Iron Law — evidence before claims)
- [ ] Spec compliance: implementation matches requirements? Thiếu gì? Thừa gì?
- [ ] `npx tsc --noEmit` → [paste exit code]
- [ ] `npm run lint` → [paste error count hoặc skip + lý do]
- [ ] `npm test` → [paste X/Y passed hoặc skip + lý do]
- [ ] Post-code impact check (không có side effects ngoài dự kiến)

### Completion Notes
<!-- AI ghi lại sau khi xong — PHẢI có raw evidence:
- Files created/modified/deleted
- Spec compliance: ✅ match / ⚠️ gaps
- Verification evidence: [paste raw output]
- Scaffold used: ✅/❌
- Commit hash
-->
