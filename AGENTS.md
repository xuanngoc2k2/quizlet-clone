# Project: [PROJECT_NAME]

> 🧠 File này là source of truth cho MỌI AI coding agent.
> Human developers: đọc `docs/ONBOARDING.md` trước.

---

## ▶ AUTO-START — Đọc section này TRƯỚC

> **🚨 MANDATORY NAVIGATION RULE:**
> 1. KHÔNG BAO GIỜ được tự ý đoán mò file hoặc grep lùng sục lung tung.
> 2. Dùng **code-review-graph MCP tools** để navigate codebase:
>    - `get_minimal_context_tool` — Lấy đúng files cần thiết cho task hiện tại
>    - `get_impact_radius_tool` — Khi sửa file, biết files nào bị ảnh hưởng
>    - `get_architecture_overview_tool` — Hiểu kiến trúc tổng quan
>    - `semantic_search_nodes_tool` — Tìm function/class theo tên
> 3. Nếu MCP tools không khả dụng (chưa cài code-review-graph):
>    → Đọc `docs/ARCHITECTURE.md` + Folder Structure trong file này
>    → Dùng file tree để navigate
>    → Gợi ý user cài: `pip install code-review-graph && code-review-graph build`

### Session Resume (BẮT BUỘC mỗi session mới)
Khi bắt đầu session mới hoặc đổi AI tool, PHẢI đọc theo thứ tự:
1. `AGENTS.md` → Current Phase + Layer + Stack + Folder Structure
2. `docs/IMPLEMENTATION_PLAN.md` → Big picture, tất cả phases + status
3. `tasks/layer-N-todo.md` → Layer hiện tại, task nào đang/cần làm
4. `tasks/done.md` → Task nào đã xong (tránh làm lại)
5. `docs/knowledge/INDEX.md` → Lessons learned
6. `git log -5 --oneline` → 5 commits gần nhất (biết đang ở đâu)
7. Chạy `./scripts/ai-preflight.sh` → Kiểm tra code-review-graph + MCP sẵn sàng

Khi user nói bất kỳ thứ gì ("bắt đầu", "start", "tiếp tục", hoặc bất kỳ prompt nào),
hãy tự detect trạng thái project và hành động:

### State Detection:

1. Kiểm tra `docs/specs/` — có file nào (ngoài .gitkeep) không?
   - **KHÔNG** → Project chưa plan → **Chạy Phase 0** (xem `docs/phases/phase-0.md`)
   - **CÓ** → Tiếp bước 2

2. Kiểm tra `tasks/layer-N-todo.md` hiện tại — có task "🔄 In Progress" không?
   - **CÓ** → **Tiếp tục task đó**
   - **KHÔNG** → Tiếp bước 3

3. Kiểm tra tất cả tasks trong layer hiện tại đã Done chưa?
   - **CÓ** → **Chạy Layer Transition:**
     a. Move completed tasks → `tasks/done.md` (section Phase X > Layer N)
     b. Tạo `tasks/layer-N+1-todo.md` (phân tích dependency, xem `docs/SCOPE_BREAKDOWN.md`)
     c. Update "Current Layer" trong file này
   - **KHÔNG** → Pick task tiếp theo trong layer

4. Nếu tất cả layers trong phase hiện tại đã Done → **Chạy Phase Transition:**
   a. Move tất cả tasks → `tasks/done.md` (section Phase X)
   b. Update `docs/IMPLEMENTATION_PLAN.md` → Phase X status = ✅
   c. Đọc `docs/phases/phase-N+1.md` → tạo layer files mới (overwrite `layer-0-todo.md`, ...)
   d. Update "Current Phase" + "Current Layer = 0" trong file này

5. Nếu tất cả phases đã Done → check `tasks/layer-refinement-todo.md`

6. Đọc `docs/knowledge/INDEX.md` trước khi code — tránh lỗi cũ.

### Phase 0 Auto-Flow:
Nếu project chưa plan, TỰ ĐỘNG bắt đầu:
1. Đọc `docs/BRIEF.md` + `docs/SPECIFICATIONS.md` (nếu có)
2. Hỏi clarify từng câu (ưu tiên multiple choice)
3. Propose 2-3 approaches + recommend
4. Viết spec → `docs/specs/YYYY-MM-DD-design.md`
5. Tạo ADRs → `docs/decisions/`
6. Viết `docs/IMPLEMENTATION_PLAN.md` — plan tổng tất cả phases
7. Chia phases phù hợp project → `docs/phases/phase-1..N.md`
8. Phân tích dependency Phase 1 → chia layers (xem `docs/SCOPE_BREAKDOWN.md`)
9. Tạo `tasks/layer-0-todo.md`, `layer-1-todo.md`, ... cho Phase 1
10. Update file này (Stack, Folder Structure, Current Phase + Layer)
11. Hỏi user approve

KHÔNG cần user ra lệnh cụ thể. Chỉ cần nói "bắt đầu".

<HARD-GATE>
KHÔNG viết code, KHÔNG scaffold, KHÔNG implement cho đến khi có file spec trong docs/specs/ và user đã approve.
</HARD-GATE>

---

## Project Context

Đọc theo thứ tự để hiểu project:
1. `docs/BRIEF.md` — Project overview + ý tưởng ban đầu
2. `docs/SPECIFICATIONS.md` — Chi tiết requirements (nếu có)
3. `docs/IMPLEMENTATION_PLAN.md` — Plan tổng, tất cả phases + status
4. `docs/ARCHITECTURE.md` — Kiến trúc hệ thống
5. `docs/decisions/` — Tại sao chọn tech stack này
6. `docs/knowledge/INDEX.md` — Lessons learned, tránh lỗi cũ

---

## Stack
[Điền sau Phase 0]

## Folder Structure
[Điền sau Phase 0]

---

## Coding Principles (BẮT BUỘC)

> Dựa trên triết lý Andrej Karpathy. Mọi AI agent PHẢI tuân theo.

### 1. Think Before Coding
**Không tự suy đoán. Không giấu sự nhầm lẫn. Đưa ra các đánh đổi.**
- Nêu rõ giả định. Nếu không chắc chắn → **hỏi**.
- Nếu có nhiều cách hiểu → trình bày chúng, **không âm thầm tự chọn**.
- Nếu có cách đơn giản hơn → nói ra. Push back nếu cần.
- Nếu điều gì đó không rõ ràng → **DỪNG LẠI**. Nói rõ điểm gây lú. Hỏi.

### 2. Simplicity First
**Viết số lượng code tối thiểu để giải quyết vấn đề. Không suy đoán tương lai.**
- Không thêm tính năng ngoài yêu cầu.
- Không tạo abstraction cho code chỉ dùng 1 lần.
- Không thêm "flexibility" hoặc "configurability" nếu không được yêu cầu.
- Nếu viết 200 dòng mà có thể 50 dòng → viết lại.
- **Test:** Senior Engineer có thấy cái này quá phức tạp không? Nếu có → simplify.

### 3. Surgical Changes
**Chỉ chạm vào những gì bắt buộc. Chỉ dọn dẹp đống lộn xộn do chính mình tạo ra.**
- Không "cải thiện" code, comment, format ở vùng lân cận.
- Không refactor những thứ không hỏng.
- Tuân theo style hiện tại của project, dù muốn làm khác.
- Nếu thay đổi tạo code thừa → xóa import/variable/function do **chính mình** làm vô dụng. Không xóa dead code có từ trước.
- **Test:** Mọi dòng bị thay đổi phải trace trực tiếp về yêu cầu của user.

### 4. Goal-Driven Execution
**Xác định tiêu chí thành công. Lặp lại cho đến khi verified.**
- Biến task thành mục tiêu verifiable: "Fix bug" → "Viết test tái hiện bug → sửa cho test pass".
- Đối với task nhiều bước → nêu plan ngắn gọn: `[Step] → verify: [check]`.
- Criteria mạnh, tự verify được — không cần user làm rõ liên tục.

### 5. Intellectual Honesty (No Sycophancy)
**Không chiều theo. Nói thẳng khi thấy sai.**
- Nếu user sai → cảnh báo **RISK**, không đồng ý hùa theo.
- Không flip-flop ý kiến chỉ vì user đổi ý. Chỉ đổi khi có evidence mới.
- Nếu request là anti-pattern → từ chối rõ ràng + đề xuất cách tốt hơn.
- **Test:** Nếu sắp đồng ý nhưng biết là sai → DỪNG LẠI và nói sự thật.

### 6. Component-First Architecture
**Tách nhỏ, tái sử dụng, dễ đọc cho cả AI lẫn người.**

**Frontend (React/Vue/Svelte):**
- Page/Screen file chỉ **compose** components — KHÔNG chứa logic/state/fetch
- UI block > 50 dòng JSX → **PHẢI** tách thành component riêng
- Logic reusable → custom hook (`hooks/useXxx.ts`)
- API/business logic → service (`services/xxx.service.ts`)
- Types → `types.ts` trong feature folder

**Backend (Node/Express/Fastify):**
- Route handler chỉ parse request + gọi service — KHÔNG chứa business logic
- Business logic → service layer
- Database queries → repository layer
- Validation → middleware hoặc schema (Zod/Joi)

**Feature folder structure:**
```
src/features/[feature-name]/
  components/     ← UI components
  hooks/          ← Custom hooks
  services/       ← API/business logic
  types.ts        ← TypeScript types
  utils.ts        ← Helper functions
  index.ts        ← Public API (re-exports)
```
- **Test:** Nếu component/file quá lớn để đọc trong 30 giây → tách.

---

### Operational Rules
- Test viết ngay sau mỗi task — không để cuối
- 1 commit = 1 task — message: `feat/fix/test/chore: [mô tả]`
- Error handling cho mọi async function
- Không sửa files ngoài danh sách cho phép trong task
- Đọc `docs/knowledge/INDEX.md` trước khi code feature liên quan
- Khi gặp git merge conflict → **KHÔNG tự resolve** → báo user quyết định
- Secrets trong `.env` — KHÔNG hard-code key, url, password vào code

---

## ⚙️ Task Execution Protocol (BẮT BUỘC)

> Mỗi task PHẢI đi qua 3 gate. Không được skip. Không được rút gọn.
> Flow: **Task → Pre-Code → Code → Post-Code → Commit**

<HARD-GATE: PRE-CODE>
Trước khi viết BẤT KỲ dòng code nào, PHẢI hoàn thành:

**1. Graph Context Summary**
- Gọi `get_minimal_context_tool(task_description)` → liệt kê files liên quan
- Gọi `semantic_search_nodes_tool(keyword)` → tìm component/hook/service đã tồn tại
- Nếu MCP tools không khả dụng → đọc `docs/ARCHITECTURE.md` + dùng file tree
- ⚠️ **PHẢI ghi rõ trong output:** "📊 Graph Context: [danh sách files liên quan]"
- ⚠️ **Nếu đã có component/hook/service tương tự → TÁI SỬ DỤNG, không tạo mới**

**2. Impact Analysis**
- Gọi `get_impact_radius_tool(file)` cho MỖI file định sửa
- OUTPUT BẮT BUỘC (ghi rõ trong response):
  ```
  ✅ Allowed files: [files sẽ create/modify — chỉ sửa những file này]
  ⛔ Forbidden files: [files KHÔNG được đụng]
  ⚠️ Risk files: [shared/infra files — cần giải thích nếu sửa]
  🧪 Tests affected: [test files cần chạy lại]
  ```

**3. Component Plan (cho UI tasks)**
- Liệt kê components sẽ tạo/sửa (theo Component-First Rule #6)
- Page file chỉ compose — KHÔNG chứa logic/state/fetch
- UI block > 50 dòng JSX → tách component

Nếu THIẾU bất kỳ output nào ở trên → KHÔNG ĐƯỢC bắt đầu code.
</HARD-GATE>

<HARD-GATE: DURING-CODE>
Trong khi code, PHẢI tuân theo:

1. **Chỉ sửa files trong "Allowed files"** đã khai báo ở Pre-Code
2. Nếu cần sửa file ngoài scope → **DỪNG LẠI**, update Impact Analysis, giải thích lý do
3. **Component-First**: Không nhét >50 dòng JSX vào 1 component
4. Mỗi file mới phải đúng vị trí trong folder structure
5. **Verify graph usage**: Khi không chắc file nào bị ảnh hưởng → gọi `get_impact_radius_tool` NGAY, không đoán
</HARD-GATE>

<HARD-GATE: POST-CODE>
Sau khi code xong, PHẢI hoàn thành TRƯỚC KHI báo done:

**1. Post-Code Impact Check**
- Gọi `get_impact_radius_tool` cho các files ĐÃ SỬA
- So sánh với Impact Analysis ban đầu
- Nếu có file bị ảnh hưởng ngoài dự kiến → kiểm tra + sửa

**2. Verification** (chạy `./scripts/ai-review.sh` hoặc thủ công)
- TypeScript: `npx tsc --noEmit`
- Lint: `npm run lint` (nếu có)
- Test: `npm test` (nếu có)
- Build: `npm run build` (nếu có)
- Nếu bất kỳ lệnh nào fail → SỬA cho đến khi pass

**3. Completion Report** (ghi rõ trong response)
```
📋 COMPLETION REPORT
- Files created: [danh sách]
- Files modified: [danh sách]
- Files deleted: [danh sách]
- Graph tools used: ✅/❌ (liệt kê tools đã gọi)
- Tests: pass/fail/skip (lý do skip)
- Build: pass/fail/skip
- Impact ngoài dự kiến: có/không
```

KHÔNG ĐƯỢC báo "done" nếu chưa hoàn thành Completion Report.
</HARD-GATE>

## Skills (AI Auto-Activate)

> **Quy tắc ưu tiên:** `skills/` (template) > `~/.gemini/antigravity/skills/` (global)
> Nếu cùng 1 skill có ở cả 2 nơi → **BẮT BUỘC dùng bản template**.

Đọc `skills/[tên-skill]/SKILL.md` trước khi thực hiện task thuộc danh mục tương ứng:

| Trigger | Skill | File |
|---------|-------|------|
| Trước khi code feature mới | `brainstorming` | `skills/brainstorming/SKILL.md` |
| Khi user yêu cầu plan/checklist | `concise-planning` | `skills/concise-planning/SKILL.md` |
| Khi viết async, API, DB code | `error-handling-patterns` | `skills/error-handling-patterns/SKILL.md` |
| Khi viết tests | `testing-patterns` | `skills/testing-patterns/SKILL.md` |
| Khi viết README, docs | `documentation-templates` | `skills/documentation-templates/SKILL.md` |
| Khi build UI/UX | `ui-ux-pro-max` | `skills/ui-ux-pro-max/SKILL.md` |
| Khi commit, branch, PR | `git-workflow` | `skills/git-workflow/SKILL.md` |
| Khi viết auth, CORS, validation | `security-best-practices` | `skills/security-best-practices/SKILL.md` |
| Khi thiết kế API endpoints | `api-design` | `skills/api-design/SKILL.md` |
| Khi thiết kế schema, chọn DB | `database-design` | `skills/database-design/SKILL.md` |

## Learned Rules
<!-- AI tự thêm rules đã promote từ docs/knowledge/ vào đây -->
[Chưa có — sẽ được thêm khi knowledge được promote]

---

## Phase & Task

- **Current Phase:** Phase 0 — Planning (chưa bắt đầu)
- **Current Layer:** Layer 0 — Foundation (chưa bắt đầu)
- **Implementation Plan:** xem `docs/IMPLEMENTATION_PLAN.md`
- **Phase details:** xem `docs/phases/phase-0.md`
- **Tasks:** xem `tasks/layer-0-todo.md`
- **Scope breakdown:** xem `docs/SCOPE_BREAKDOWN.md`

### Hierarchy: Plan → Phase → Layer → Task

```
docs/IMPLEMENTATION_PLAN.md          ← Plan TỔNG (permanent, chỉ update status)
  └── docs/phases/phase-N.md         ← Plan chi tiết từng phase (permanent)
       └── tasks/layer-X-todo.md     ← Tasks phase HIỆN TẠI (overwrite khi đổi phase)
            └── tasks/done.md        ← Archive (Phase > Layer > Tasks)
```

### Task Files — Dependency-Driven Layers

Dùng **Dependency-Driven approach** (xem `docs/SCOPE_BREAKDOWN.md`):
- `tasks/layer-0-todo.md` — Foundation (no dependency)
- `tasks/layer-1-todo.md` — Depends on Layer 0 (tạo khi cần)
- `tasks/layer-2-todo.md` — Depends on Layer 1 (tạo khi cần)
- ... (thêm layer tùy scope)
- `tasks/layer-refinement-todo.md` — Post-completion bugs/features
- `tasks/done.md` — Completed tasks (chia section: Phase > Layer)

**Quy tắc:**
- Số layer phụ thuộc vào dependency analysis — không cố định
- Mỗi layer chứa nhiều task **độc lập** (có thể parallel)
- Layer N xong **100%** → mới bắt đầu Layer N+1
- KHÔNG được nhảy cóc layer
- Khi **chuyển phase** → overwrite `layer-X-todo.md`, move tasks cũ vào `done.md`

---

## 🔄 After Completion — Layer Refinement

Sau khi hoàn thành **tất cả phases**, user check lại và báo bug/feature mới.

**Workflow:**
1. User báo → Bug hoặc feature mới
2. AI brainstorm → Clarify + propose 2-3 approaches
3. User approve → Confirm phương án
4. Tạo task → Thêm vào `tasks/layer-refinement-todo.md`
5. Pick + implement → Như các layer khác
6. Update `docs/IMPLEMENTATION_PLAN.md` status nếu cần

---

## Memory & Knowledge

### Memory (riêng tư — gitignored)
Sau mỗi session, ghi notes vào `memory/YYYY-MM-DD.md`:
- Tasks completed + AI tool used
- Issues encountered
- Key files changed
- Next steps

### Knowledge (shared — committed)
Khi phát hiện bug/pattern đáng nhớ:
1. Tạo `docs/knowledge/YYYY-MM-DD-[topic].md` (dùng `docs/knowledge/TEMPLATE.md`)
2. Update `docs/knowledge/INDEX.md`
3. Nếu pattern cực quan trọng → thêm vào mục "Learned Rules" ở trên

### Decisions (shared — committed)
Khi có architecture/tech decision quan trọng:
- Tạo `docs/decisions/NNN-[topic].md` (dùng `docs/decisions/TEMPLATE.md`)

---

## Codebase Navigation

### Primary: Code-Review-Graph (MCP — tự động)
```bash
# Cài đặt (1 lần — dùng pipx để tránh conflict Python)
pipx install code-review-graph && code-review-graph install
# hoặc: uv tool install code-review-graph

# Build lần đầu (chạy trong root project)
code-review-graph build

# Update (tự động qua git hook, hoặc thủ công)
code-review-graph update
```

### Pre-Code / Post-Code Scripts
```bash
# Trước khi code: kiểm tra môi trường
./scripts/ai-preflight.sh

# Sau khi code: chạy verification
./scripts/ai-review.sh
```

Sau khi build, AI tự động dùng MCP tools để navigate — không cần đọc file thủ công.

### Verify AI Đang Dùng Graph
Nếu user muốn kiểm tra AI có thực sự dùng code-review-graph:
- Hỏi AI: "List các tool MCP bạn đang có"
- Kiểm tra Completion Report có dòng "Graph tools used: ✅" không
- Trong Cursor: Settings → MCP Servers → kiểm tra chấm xanh
- Trong Claude Code: gõ `/mcp` để xem danh sách servers
