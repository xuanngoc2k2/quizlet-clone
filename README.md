# 🚀 Universal AI Coding OS (Template)

> Production-ready template biến mọi project thành một **Hệ điều hành cho AI (AI Coding OS)** cực kỳ kỷ luật.
> Hoạt động hoàn hảo với: Antigravity, Claude Code, Cursor, Windsurf, Copilot.

---

## ✨ AI OS Capabilities

Hệ thống này không chỉ là cấu trúc thư mục, mà là một **bộ quy tắc (protocol)** ép AI phải code như một Senior Engineer:

- 📉 **Token Optimization (Giảm 80% rác)**: Tách `AGENTS.md` thành `.ai-context.md` cực nhẹ. Tích hợp sẵn [RTK](https://github.com/rtk-ai/rtk) để nén output Terminal trước khi cho AI đọc.
- 🛡️ **Iron Law Verification**: Áp dụng triết lý *Superpowers* — Cấm AI tự ý báo "pass". Bắt buộc phải có Raw Evidence. Tích hợp sẵn `react-doctor` để audit chất lượng UI Component.
- 🗺️ **Code Navigation (MCP)**: Ép AI dùng `code-review-graph` thay vì mò mẫm bằng `grep`/`find`, đảm bảo không sửa nhầm file.
- 🧱 **Bite-Sized TDD**: Cấu trúc Task template chia nhỏ công việc thành TDD steps (Fail → Implement → Pass), cấm AI gộp bước.
- 🚫 **Anti-Rationalization**: Bảng *Red Flags* chặn đứng các thói quen xấu của AI (Lười, Xin lỗi, Hard-code bí mật, Viết placeholder).

---

## 📋 Yêu Cầu Hệ Thống

- `git`
- `bash` (macOS / Linux / WSL)
- **(Khuyên dùng)** `code-review-graph`: Để AI vẽ bản đồ codebase.
- **(Khuyên dùng)** `rtk`: Nén log terminal, tiết kiệm token LLM.

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
Script sẽ giúp bạn:
- Khởi tạo repo git sạch.
- Cài đặt `code-review-graph` và `rtk` (nếu bạn muốn).
- Generate file context tự động.

### 3. Gọi AI vào làm việc
Mở terminal bằng AI CLI (Antigravity/Claude Code) hoặc mở editor (Cursor/Windsurf) và chat:
> **"Bắt đầu"**

AI sẽ tự động đọc state, khởi chạy Phase 0 (Planning), hỏi bạn ý tưởng, viết Spec, chia Task và tiến hành code. Mọi thứ tự động.

---

## 🗂️ Cấu Trúc Hệ Điều Hành

```
my-project/
│
├── AGENTS.md                    ← 🧠 AI đọc khi Planning / Architecture
├── .ai-context.md               ← ⚡ Short Context (Regenerated after commit)
├── CLAUDE.md                    ← 🔗 Adapter: Claude Code
├── GEMINI.md                    ← 🔗 Adapter: Gemini CLI / Antigravity
├── .cursorrules                 ← 🔗 Adapter: Cursor
│
├── docs/
│   ├── CODING_RULES.md          ← 6 Nguyên tắc code + Red flags
│   ├── HARD_GATES.md            ← Quy trình ép buộc (Pre-code, Post-code)
│   ├── knowledge/               ← 📚 Shared learnings (Tags-based)
│   └── phases/                  ← Các phase của dự án
│
├── memory/                      ← 📝 Private session logs (gitignored)
├── tasks/                       ← Task board (layer-based) + TASK_TEMPLATE.md
├── scaffolds/                   ← CLI Boilerplates (UI, API, Test, Hook)
├── scripts/                     ← Automation (ai-preflight.sh, ai-review.sh)
│
├── src/                         ← Source code của bạn
└── tests/                       ← Unit / Integration / E2E
```

---

## 🤖 AI Workflow (Bắt buộc cho mỗi Task)

AI phải đi qua các *Hard Gates* này. Nếu làm sai sẽ bị chặn ở Hook:

1. **Pre-Code Gate (`scripts/ai-preflight.sh`)**: Phân tích Impact Radius (ảnh hưởng file nào). Cấm sửa file ngoài scope.
2. **During-Code**: Không quá 50 dòng/component. Bắt buộc dùng `scaffolds`.
3. **Post-Code Gate (`scripts/ai-review.sh`)**: Tự động bọc lệnh bằng `rtk` để chạy Lint, TSC, Test. Chạy `npx react-doctor` cho UI.
4. **Completion**: AI phải in ra Completion Report với raw evidence.

---

## 🧠 Project Brain (Quản lý Kiến thức)

Hệ thống sử dụng **Knowledge Tags** để quản lý bài học, tránh AI lặp lại lỗi cũ:

```
Fix bug / Tối ưu
  → Tạo file: docs/knowledge/YYYY-MM-DD-[topic].md
  → Gắn tag: #ui, #api, #config
  → AI tự tìm kiếm tag liên quan trước khi nhận task mới.
```

---

## 🤖 AI Tools Supported

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
