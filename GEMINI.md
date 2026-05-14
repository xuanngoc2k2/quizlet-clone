# Gemini CLI / Antigravity Instructions

> **Regular tasks:** Chạy `./scripts/ai-preflight.sh` → đọc `.ai-context.md` → bắt đầu.
> **Phase 0 / architecture:** Đọc `AGENTS.md` đầy đủ.
> File này chỉ chứa Gemini-specific notes.

## How To Start
1. Chạy `./scripts/ai-preflight.sh` → Quick Context
2. Đọc `.ai-context.md` → Compact rules (51 dòng)
3. Đọc `tasks/layer-N-todo.md` → Task hiện tại
4. Nếu Phase 0 hoặc architecture → đọc thêm `AGENTS.md`

## Gemini-Specific Notes
- **Skills Priority:** Template skills (`skills/`) BẮT BUỘC ưu tiên hơn Global skills (`~/.gemini/antigravity/skills/`). Luôn check `skills/` trong project trước.
- **Planning Mode:** Sử dụng `implementation_plan.md` artifact khi task yêu cầu architecture changes, research rộng, hoặc cần approval từ user. Với regular tasks (bugfix, add component), KHÔNG cần planning mode, làm luôn.
- **Artifacts:** Sử dụng tính năng Artifacts của Gemini để render markdown (tables, diffs, diagram) thay vì in thẳng ra chat nếu kết quả quá dài.
- **Model Selection:** Dùng Pro (High) cho regular tasks. Dùng Pro (Thinking) cho những task lú lẫn, debugging sâu, hoặc design hệ thống.
- **Commit message:** `feat/fix/test/chore: [mô tả ngắn]`
