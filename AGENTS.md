# Project: [PROJECT_NAME]

> 🧠 File này là source of truth cho MỌI AI coding agent.
> Human developers: đọc `docs/ONBOARDING.md` trước.

---

## ▶ AUTO-START — Đọc section này TRƯỚC

> **🚨 MANDATORY NAVIGATION RULE:**
> 1. KHÔNG BAO GIỜ được tự ý đoán mò file hoặc grep lùng sục lung tung.
> 2. Dùng **codegraph MCP tools** để navigate codebase:
>    - `codegraph_context` — Lấy đúng files cần thiết + kiến trúc tổng quan
>    - `codegraph_explore` — Khi sửa file, biết files nào bị ảnh hưởng (impact radius)
>    - `codegraph_search` — Tìm function/class theo tên (full-text search)
> 3. Nếu MCP tools không khả dụng (chưa cài codegraph):
>    → Đọc `docs/ARCHITECTURE.md` + Folder Structure trong file này
>    → Dùng file tree để navigate
>    → Gợi ý user cài: `npm install -g @colbymchenry/codegraph && codegraph init`

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
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS
- **Database:** SQLite (dev) / PostgreSQL (prod) via Prisma
- **API:** tRPC
- **Animation:** Framer Motion
- **PWA:** @serwist/next
- **Client State:** React Query (tRPC React)
- **Test:** Vitest + Playwright
- **Lint:** ESLint + Prettier

## Folder Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx            # Home — browse sets
│   ├── set/
│   │   ├── [id]/
│   │   │   ├── page.tsx    # View set
│   │   │   ├── study/page.tsx
│   │   │   └── edit/page.tsx
│   │   └── new/page.tsx    # Create set
│   └── search/page.tsx
├── components/
│   ├── ui/                 # Base UI (Button, Input, Card, Modal)
│   ├── layout/             # Header, BottomNav, Shell
│   ├── set/                # SetCard, SetList, SetForm
│   └── study/              # FlashcardView, QuizView, MatchGame, etc.
├── server/
│   ├── db.ts               # Prisma client singleton
│   ├── trpc.ts             # tRPC context + router
│   └── routers/            # sets.ts, cards.ts
├── lib/
│   ├── local-storage.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── styles/
    └── globals.css
```

---

## Coding Principles (BẮT BUỘC)

> Chi tiết đầy đủ: `docs/CODING_RULES.md`
> Hướng dẫn thiết kế giao diện động (Magic & Aceternity): `docs/UI_UX_GUIDELINES.md`
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

## 🤖 Multi-Agent Collaboration Protocol (BẮT BUỘC)

Khi người dùng giao tiếp với **Agent Tổng** (Main Agent), Agent Tổng sẽ tự động phân tích và ủy quyền cho các **Subagents chuyên biệt** để xử lý các phần việc phù hợp:

1. **Tự động Nhận diện & Giao việc:**
   - **Tác vụ UI/UX, Frontend:** Gọi `UI_UX_Frontend_Agent` (tích hợp `ui-ux-pro-max` skill).
   - **Tác vụ API, Database, Backend:** Gọi `Backend_Architect_Agent` (tích hợp `api-design`, `database-design` skills).
   - **Tác vụ Viết Test, Kiểm thử, Debug:** Gọi `QA_Tester_Agent` (tích hợp `testing-patterns`, `error-handling-patterns` skills).
2. **Quy trình hoạt động:**
   - Agent Tổng phân tách công việc lớn thành các sub-tasks.
   - Dùng `invoke_subagent` để gọi Subagent xử lý song song hoặc tuần tự.
   - Nhận kết quả từ Subagent, tự mình chạy kiểm thử/đánh giá chất lượng cuối cùng.
   - Báo cáo kết quả gọn gàng cho người dùng.

---

## ⚙️ Task Execution Protocol (BẮT BUỘC)

> Chi tiết đầy đủ: `docs/HARD_GATES.md`

Flow: **Task → Pre-Code → Code → Post-Code → Commit**

**PRE-CODE** (trước khi viết code):
1. Graph Context — `codegraph_context` + `codegraph_search`
2. Impact Analysis — `codegraph_explore` → Allowed/Forbidden/Risk files
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

Đọc `skills/[tên-skill]/SKILL.md` trước khi thực hiện task thuộc danh mục tương ứng.
**⚠️ Task Type=ui → PHẢI đọc UI/UX Guidelines và các UI skills TRƯỚC khi viết code. Không skip.**

| Trigger | Skill | BẮT BUỘC? |
|---------|-------|-----------|
| **Task Type=ui** | `ui-ux-pro-max` (palette, typo, layout) | ✅ BẮT BUỘC |
| **Task Type=ui** | `docs/UI_UX_GUIDELINES.md` (Hiệu ứng hoạt họa Magic/Aceternity) | ✅ BẮT BUỘC |
| **Task Type=ui + animation** | `skills/gsap/SKILL.md` (Hoạt họa GSAP chuẩn hiệu năng, React useGSAP) | ✅ BẮT BUỘC |
| **Task Type=ui** | `frontend-dev-guidelines` (component arch) | ✅ BẮT BUỘC |
| **Task Type=ui + React** | `react-best-practices` (perf, patterns) | ✅ BẮT BUỘC |
| **Task Type=ui + React** | `react-ui-patterns` (loading, error, fetch) | ✅ BẮT BUỘC |
| Trước khi code feature mới | `brainstorming` | Recommended |
| Khi user yêu cầu plan | `concise-planning` | Recommended |
| Khi viết async, API, DB code | `error-handling-patterns` | Recommended |
| Khi viết tests | `testing-patterns` | Recommended |
| Khi viết README, docs | `documentation-templates` | Recommended |
| Khi thiết kế API endpoints | `api-design` | Recommended |
| Khi thiết kế schema, chọn DB | `database-design` | Recommended |

## Learned Rules
<!-- AI tự thêm rules đã promote từ docs/knowledge/ vào đây -->
[Chưa có — sẽ được thêm khi knowledge được promote]

---

## Phase & Task

- **Current Phase:** Phase 1 — Core Platform
- **Current Layer:** Layer 0 — Foundation
- **Implementation Plan:** xem `docs/IMPLEMENTATION_PLAN.md`
- **Phase details:** xem `docs/phases/phase-1.md`
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

### Primary: Codegraph (MCP — tự động)
```bash
# Cài đặt (1 lần)
npm install -g @colbymchenry/codegraph && codegraph init

# Graph tự động sync qua file watcher (FSEvents/inotify)
# Không cần chạy update thủ công.
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
Nếu user muốn kiểm tra AI có thực sự dùng codegraph:
- Hỏi AI: "List các tool MCP bạn đang có"
- Kiểm tra Completion Report có dòng "Graph tools used: ✅" không
- Trong Cursor: Settings → MCP Servers → kiểm tra chấm xanh
- Trong Claude Code: gõ `/mcp` để xem danh sách servers
