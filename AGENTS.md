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
1. Chạy `./scripts/ai-preflight.sh` → Quick Context (phase, layer, recent commits, stats)
2. `.ai-context.md` → Compact rules (40 dòng thay vì 388 dòng AGENTS.md)
3. `tasks/layer-N-todo.md` → Task đang/cần làm
4. `docs/knowledge/INDEX.md` → Lessons learned (chỉ entries liên quan task)

> 💡 **Token-saving:** Chỉ đọc AGENTS.md đầy đủ khi cần Phase 0, phase transition, hoặc architecture decisions.
> Cho regular tasks (feature, bugfix, test): `.ai-context.md` + preflight output là ĐỦ.

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

> Chi tiết đầy đủ: `docs/CODING_RULES.md`
> Compact version: `.ai-context.md`

**6 nguyên tắc cốt lõi:**
1. **Think Before Coding** — Không suy đoán. Hỏi nếu không rõ.
2. **Simplicity First** — Code tối thiểu. Không over-engineer.
3. **Surgical Changes** — Chỉ sửa những gì cần thiết.
4. **Goal-Driven** — Xác định tiêu chí thành công, verify trước khi claim done.
5. **Intellectual Honesty** — Nói thẳng khi sai. Không chiều theo.
6. **Component-First** — Tách nhỏ: Page = compose only, logic = hooks/services.

**3 luật sắt:**
- **Verification Iron Law:** KHÔNG claim "done/pass" nếu chưa CHẠY command + XEM raw output.
- **No Placeholder:** Tasks phải có exact file paths + actual code + exact commands.
- **Red Flags:** Nếu đang nghĩ "chắc pass rồi" hoặc "lần này ngoại lệ" → DỪNG LẠI.

---

## ⚙️ Task Execution Protocol (BẮT BUỘC)

> Chi tiết đầy đủ: `docs/HARD_GATES.md`

Flow: **Task → Pre-Code → Code → Post-Code → Commit**

**PRE-CODE** (trước khi viết code):
1. Graph Context — `get_minimal_context_tool` + `semantic_search_nodes_tool`
2. Impact Analysis — `get_impact_radius_tool` → Allowed/Forbidden/Risk files
3. Component Plan (UI tasks) — liệt kê components

**DURING-CODE:**
- Chỉ sửa Allowed files. Ngoài scope → DỪNG + giải thích.
- Component-First: JSX > 50 dòng → tách.

**POST-CODE** (trước khi báo done):
1. Spec Compliance — Thiếu gì? Thừa gì?
2. Impact Check — so sánh với pre-code analysis
3. Verification — chạy tsc/lint/test/build, **paste raw output**
4. Completion Report — evidence-based, không self-report

⛔ KHÔNG báo "done" nếu thiếu Completion Report hoặc raw evidence.

---
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
