# Implementation Plan: [PROJECT_NAME]

> Bản đồ TỔNG của project. Tạo trong Phase 0, **KHÔNG BAO GIỜ XÓA**.
> Chỉ update status khi hoàn thành phase/layer.

---

## Project Overview

**Objective:** [Mô tả ngắn gọn mục tiêu project]
**Stack:** [Điền sau khi chọn approach]
**Timeline:** [Ước tính]

---

## Phases

<!-- 
Status: ⬜ Todo | 🔄 In Progress | ✅ Done
Update status khi bắt đầu/kết thúc phase.
-->

### Phase 0 — Planning ⬜
- Output: Design spec, ADRs, phases, tasks
- Details: `docs/phases/phase-0.md`

### Phase 1 — [Tên Phase] ⬜
- Scope: [Mô tả ngắn]
- Layers: [Số layer dự kiến]
- Definition of Done: [Tiêu chí hoàn thành]
- Details: `docs/phases/phase-1.md`

<!-- Thêm phases theo scope project:

### Phase 2 — [Tên Phase] ⬜
- Scope: [Mô tả]
- Layers: [Số layer]
- Definition of Done: [Tiêu chí]
- Details: `docs/phases/phase-2.md`

### Phase 3 — [Tên Phase] ⬜
...
-->

---

## Layer Overview (Phase hiện tại)

> Section này được **overwrite** mỗi khi chuyển phase.
> Xem chi tiết layer tại `tasks/layer-N-todo.md`.

| Layer | Mô tả | Status |
|-------|--------|--------|
| Layer 0 | Foundation | ⬜ |
| Layer 1 | [Tùy scope] | ⬜ |

---

## Key Decisions

| # | Decision | Rationale | ADR |
|---|----------|-----------|-----|
| 1 | [Quyết định] | [Lý do] | `docs/decisions/001-xxx.md` |

---

## Risks & Assumptions

- **Risk:** [Mô tả risk] → **Mitigation:** [Cách giảm thiểu]
- **Assumption:** [Giả định đang dùng]

---

> ℹ️ File này là **bản đồ tổng** — luôn giữ nguyên, chỉ update status.
> Chi tiết từng phase → `docs/phases/phase-N.md`
> Tasks đang làm → `tasks/layer-N-todo.md`
> Lịch sử → `tasks/done.md`
