# 🚀 Universal AI Project Template

> Production-ready template cho bất kỳ project nào.
> Hoạt động với **MỌI** AI coding tool: Antigravity, Claude Code, Cursor, Codex, Windsurf, Copilot.

---

## ✨ Tại Sao Dùng Template Này?

- **Zero-friction start** — nói "bắt đầu" là AI tự chạy
- **Universal** — không lock vào 1 AI tool, chuyển tool bất kỳ lúc nào
- **Shared knowledge** — learnings + decisions committed, team đọc được
- **Private memory** — session logs riêng tư, không làm rác git
- **Auto-detect state** — AI tự biết project đang ở đâu
- **Onboarding nhanh** — người mới productive trong 30 phút

---

## 📋 Yêu Cầu

- `git` đã cài
- `bash` (macOS / Linux / WSL)
- AI coding tool bất kỳ (Antigravity, Claude Code, Cursor, Codex, Windsurf, Copilot)

---

## 🏁 Bắt Đầu (3 bước)

### 1. Clone template
```bash
git clone https://github.com/hkien2310/template-ai.git my-project
cd my-project
```

### 2. Chạy script khởi tạo
```bash
./scripts/start-project.sh
```

Script hỏi:
- Tên project
- Brain dump ý tưởng (tùy chọn)
- AI tools sử dụng (chọn nhiều)

### 3. Mở bằng AI tool bất kỳ, nói "bắt đầu"

```
AI tự đọc AGENTS.md → detect state → tự chạy Phase 0 Planning → hỏi mày clarify → viết spec → tạo tasks → bắt đầu code 🚀
```

**Không cần biết template hoạt động thế nào. Chỉ cần nói "bắt đầu".**

---

## 🗂️ Cấu Trúc

```
my-project/
│
├── AGENTS.md                    ← 🧠 AI đọc đầu tiên (universal)
├── CLAUDE.md                    ← 🔗 Adapter: Claude Code
├── .cursorrules                 ← 🔗 Adapter: Cursor
├── .windsurfrules               ← 🔗 Adapter: Windsurf
│
├── docs/
│   ├── ONBOARDING.md            ← 📖 Human đọc đầu tiên
│   ├── BRIEF.md                 ← Brain dump ban đầu
│   ├── ARCHITECTURE.md          ← Kiến trúc hệ thống
│   ├── knowledge/               ← 📚 Shared learnings
│   ├── decisions/               ← 🏛️ Architecture Decision Records
│   ├── specs/                   ← Design docs
│   └── phases/                  ← Phase definitions
│
├── memory/                      ← 📝 Private session logs (gitignored)
├── context/                     ← 🔍 Code Knowledge Graph (code-review-graph)
├── tasks/                       ← Task board (layer-based)
├── src/                         ← Source code
├── tests/                       ← Unit / Integration / E2E
├── .github/workflows/           ← CI/CD pipeline
├── skills/                      ← Custom project skills
└── scripts/                     ← Init + utility scripts
```

---

## 🔄 Workflow

```
./scripts/start-project.sh → Nhập tên + brain dump
      ↓
Mở bằng AI tool → nói "bắt đầu"
      ↓
┌─── PHASE 0: PLANNING (auto) ─────────────────┐
│  AI đọc BRIEF → hỏi clarify                  │
│  Propose approaches → user chọn              │
│  Viết design spec + ADRs                     │
│  Tạo phases (tuỳ project) + tasks            │
│  User approve → bắt đầu code                │
└───────────────────────────────────────────────┘
      ↓
┌─── PHASE 1-N: DEVELOPMENT ───────────────────┐
│  Pick task từ Layer hiện tại → code → test   │
│  Update layer-N-todo.md → move sang done.md  │
│  Tạo Layer N+1 khi Layer N xong 100%         │
│  Lặp lại cho đến khi xong features           │
└───────────────────────────────────────────────┘
      ↓
┌─── FINAL PHASE: RELEASE ─────────────────────┐
│  Refinement bugs → E2E test → deploy 🚀      │
└───────────────────────────────────────────────┘
```

---

## 🤖 AI Coding Flow (Per Task)

> Mỗi task AI phải đi qua 7 bước. Xem chi tiết trong `AGENTS.md` → Task Execution Protocol.

```
1. ./scripts/ai-preflight.sh     → Kiểm tra môi trường (graph, MCP)
2. Graph Context Summary          → Hiểu code liên quan (dùng code-review-graph)
3. Impact Analysis                → Khai báo files sẽ sửa + files cấm đụng
4. Component Plan                 → Tách UI/logic (nếu là UI task)
5. Code                          → Chỉ sửa allowed files
6. ./scripts/ai-review.sh        → Verification (typecheck, lint, test, build)
7. Commit                        → Sau khi pass — 1 task = 1 commit
```

---

## 🧠 Project Brain

### Shared (committed to git)
| Hệ thống | Folder | Mục đích |
|-----------|--------|----------|
| **Knowledge** | `docs/knowledge/` | Lessons learned, tránh lỗi cũ |
| **Decisions** | `docs/decisions/` | Tại sao chọn tech/approach này |
| **Specs** | `docs/specs/` | Design documents |

### Private (gitignored)
| Hệ thống | Folder | Mục đích |
|-----------|--------|----------|
| **Memory** | `memory/` | Session logs cá nhân |

### Knowledge Promotion Flow
```
Fix bug / discover pattern
  → Tạo docs/knowledge/YYYY-MM-DD-[topic].md (Draft)
  → Gặp lại 2+ lần → Validated
  → Rất quan trọng → Promoted → thêm vào AGENTS.md rules
```

---

## 🚦 CI/CD Pipeline

Template bao gồm 3 workflows (`.github/workflows/`):

1. **CI Gate (`ci.yml`)** — Chạy khi push/PR: Lint, Typecheck, Test, Build.
2. **Preview Build (`preview-build.yml`)** — Chạy khi push `develop`: Upload artifact cho QA/Review.
3. **Production Build (`production-build.yml`)** — Manual trigger từ `main` với environment approval.

---

## 📊 Monitoring

Xem hướng dẫn tại `docs/MONITORING.md`:
- Setup **Sentry** (Error tracking) cho Node.js / React
- Setup **Prometheus + Grafana** qua Docker Compose (Optional)

---

## 🤖 AI Tools Supported

| Tool | Config File | Status |
|------|------------|--------|
| **Claude Code / Opencode** | `CLAUDE.md` | ✅ |
| **Cursor** | `.cursorrules` | ✅ |
| **Windsurf** | `.windsurfrules` | ✅ |
| **GitHub Copilot** | `.github/copilot-instructions.md` | ✅ |
| **OpenAI Codex** | `AGENTS.md` (native) | ✅ |
| **Antigravity** | `AGENTS.md` | ✅ |
| **Bất kỳ AI khác** | Prompt: "đọc AGENTS.md" | ✅ |

---

## 📌 Rules Vàng

| Rule | Lý do |
|------|-------|
| Plan trước khi code | Tránh build sai thứ |
| Nói "bắt đầu" là đủ | AI tự detect state |
| `AGENTS.md` là source of truth | AI nào cũng đọc |
| 1 task = 1 commit | Rollback dễ |
| Test viết ngay | Tránh bug chồng bug |
| Ghi knowledge khi fix bug | Tránh lỗi cũ |
| Đọc knowledge trước khi code | Học từ quá khứ |

---

## 📜 License

MIT
