# 🚀 Universal AI Coding OS (Template)

> Production-ready template biến mọi project thành một **Hệ điều hành cho AI (AI Coding OS)** cực kỳ kỷ luật.
> Hoạt động hoàn hảo với: Antigravity, Claude Code, Cursor, Windsurf, Copilot.

---

## ✨ AI OS Capabilities

Hệ thống này không chỉ là cấu trúc thư mục, mà là một **bộ quy tắc (protocol)** ép AI phải code như một Senior Engineer:

- 📉 **Token Optimization**: Giảm 80% rác nhờ `.ai-context.md`. Tích hợp sẵn [RTK](https://github.com/rtk-ai/rtk) để nén output Terminal (giảm 60-90% log rác).
- 🛡️ **Iron Law Verification**: Cấm AI tự ý báo "pass". Bắt buộc có Raw Evidence. Chạy tự động `react-doctor` để audit UI.
- 🗺️ **Code Navigation**: Ép AI dùng `code-review-graph` (MCP) thay vì `grep`/`find` mù quáng.
- 🚫 **Anti-Rationalization**: Bảng *Red Flags* chặn các thói quen xấu của AI (Lười, Xin lỗi, Hard-code, Placeholder).

---

## 🏁 Bắt Đầu (Chỉ 3 bước)

### 1. Clone template
```bash
git clone https://github.com/hkien2310/template-ai.git my-project
cd my-project
```

### 2. Chạy script khởi tạo
```bash
./scripts/start-project.sh
```
Script sẽ giúp bạn: tạo repo mới, cài đặt `code-review-graph`, gợi ý cài đặt `rtk`, và setup cấu trúc cơ bản.

### 3. Mở bằng AI tool, nói "bắt đầu"
Mở terminal bằng AI CLI (Antigravity/Claude Code) hoặc editor (Cursor/Windsurf) và chat:
> **"bắt đầu"**

AI sẽ tự đọc state, khởi chạy Phase 0 (Planning), hỏi bạn ý tưởng, viết Spec, chia Task và tiến hành code. Tự động 100%.

---

## 🗂️ Cấu Trúc Dự Án

Hệ thống thư mục được thiết kế để AI tự quản lý context mà không cần bạn can thiệp:

```text
my-project/
│
├── AGENTS.md                    ← 🧠 AI đọc khi Planning / Architecture
├── .ai-context.md               ← ⚡ Short Context (Tự generate sau mỗi commit)
├── GEMINI.md / CLAUDE.md        ← 🔗 Adapter cho từng AI CLI
│
├── docs/
│   ├── CODING_RULES.md          ← 6 Nguyên tắc code + Red flags
│   ├── HARD_GATES.md            ← Quy trình ép buộc (Pre-code, Post-code)
│   ├── knowledge/               ← 📚 Shared learnings (Tags-based)
│   ├── specs/                   ← Design docs & ADRs
│   └── phases/                  ← Các phase của dự án
│
├── memory/                      ← 📝 Private session logs (gitignored)
├── tasks/                       ← Task board (layer-based) + TASK_TEMPLATE.md
├── scaffolds/                   ← CLI Boilerplates (UI, API, Test, Hook)
├── scripts/                     ← Automation (ai-preflight.sh, ai-review.sh)
│
├── src/                         ← Source code của bạn
├── tests/                       ← Unit / Integration / E2E
└── .github/workflows/           ← CI/CD pipeline
```

---

## 🔄 Workflow Hoạt Động (Thực Tế)

Dự án vận hành qua các Phase rõ ràng, AI sẽ tự động update trạng thái:

```text
./scripts/start-project.sh → Nhập tên + ý tưởng
      ↓
Mở bằng AI tool → nói "bắt đầu"
      ↓
┌─── PHASE 0: PLANNING (auto) ─────────────────┐
│  AI đọc BRIEF → hỏi clarify                  │
│  Propose approaches → user chọn              │
│  Viết design spec + kiến trúc                │
│  Tạo phases (tuỳ project) + tasks            │
│  User approve → bắt đầu code                 │
└──────────────────────────────────────────────┘
      ↓
┌─── PHASE 1-N: DEVELOPMENT ───────────────────┐
│  Pick task từ Layer hiện tại → code → test   │
│  Update layer-N-todo.md → move sang done.md  │
│  Tạo Layer N+1 khi Layer N xong 100%         │
│  Lặp lại cho đến khi xong features           │
└──────────────────────────────────────────────┘
      ↓
┌─── FINAL PHASE: RELEASE ─────────────────────┐
│  Refinement bugs → E2E test → deploy 🚀      │
└──────────────────────────────────────────────┘
```

---

## 🤖 AI Coding Flow (Per Task)

Đối với **mỗi một task nhỏ**, AI bị ép phải đi qua 7 bước. Không được skip:

```text
1. ./scripts/ai-preflight.sh      → Bắt buộc chạy để verify Graph MCP
2. Graph Context Summary          → Tìm file liên quan (Dùng code-review-graph)
3. Impact Analysis                → Khai báo files sẽ sửa + files CẤM đụng
4. Component Plan                 → Tách UI/logic, chuẩn bị Scaffolds
5. Code                           → Phẫu thuật chính xác các file đã allowed
6. ./scripts/ai-review.sh         → Bọc bằng RTK: Lint, TSC, Test, React-Doctor
7. Completion Report & Commit     → Trình Raw Evidence → 1 Task = 1 Commit
```

---

## 🧠 Project Brain & Knowledge

Không lưu rác vào context chung. AI tự quản lý bài học qua các luồng sau:

### Phân Loại Bộ Nhớ
| Loại | Thư mục | Mục đích |
|-----------|--------|----------|
| **Shared** | `docs/knowledge/` | Lessons learned, bug fixes (Committed to Git) |
| **Decisions** | `docs/specs/` | Tại sao chọn tech/approach này |
| **Private** | `memory/` | Session logs cá nhân của AI (Gitignored) |

### Knowledge Promotion Flow
Để tránh bị lặp lại lỗi, AI vận hành vòng lặp tri thức với **Tags**:
```text
Fix bug / Phát hiện Best Practice
  → Tạo docs/knowledge/YYYY-MM-DD-[topic].md
  → Gắn các tag: #ui, #api, #config
  → Lần sau gặp task liên quan, AI grep tag tương ứng để đọc lại bài học.
```

---

## 🤖 Hỗ Trợ Mọi AI Tools

Hệ thống không phụ thuộc (vendor-lock) vào một AI nào. Chuyển tool thoải mái:

| Tool | Config File | Tối ưu? |
|------|------------|--------|
| **Gemini CLI (Antigravity)** | `GEMINI.md` | ✅ Native |
| **Claude Code / Opencode** | `CLAUDE.md` | ✅ Native |
| **Cursor** | `.cursorrules` | ✅ Native |
| **Windsurf** | `.windsurfrules` | ✅ Native |
| **GitHub Copilot** | `.github/copilot-instructions.md` | ✅ Hỗ trợ |

---

## 📜 License

MIT
