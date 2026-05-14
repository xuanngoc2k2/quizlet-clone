# Claude Code / Opencode Instructions

> **Regular tasks:** Chạy `./scripts/ai-preflight.sh` → đọc `.ai-context.md` → bắt đầu.
> **Phase 0 / architecture:** Đọc `AGENTS.md` đầy đủ.
> File này chỉ chứa Claude-specific notes.

## How To Start
1. Chạy `./scripts/ai-preflight.sh` → Quick Context
2. Đọc `.ai-context.md` → Compact rules (51 dòng)
3. Đọc `tasks/layer-N-todo.md` → Task hiện tại
4. Nếu Phase 0 hoặc architecture → đọc thêm `AGENTS.md`

## Claude-Specific Notes
- Ưu tiên Sonnet cho regular tasks (feature, bugfix, test)
- Dùng Opus cho architecture decisions, complex refactors (>5 files)
- Dùng `ultrathink` hoặc extended thinking khi cần reasoning sâu
- Sub-directory `CLAUDE.md` cho rules cụ thể từng folder nếu cần
- Commit message: `feat/fix/test/chore: [mô tả ngắn]`
