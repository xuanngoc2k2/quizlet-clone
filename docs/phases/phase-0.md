# Phase 0: Planning

> **Goal:** Design rõ ràng, spec được approve, phases + tasks sẵn sàng trước khi code.
> **Output:** Design doc trong `docs/specs/` + phases + tasks
> **Status:** ⬜ Todo

---

## Definition of Done
- [ ] Có ít nhất 1 file trong `docs/specs/`
- [ ] `docs/IMPLEMENTATION_PLAN.md` đã viết (plan tổng)
- [ ] `AGENTS.md` đã điền Stack + Folder Structure
- [ ] `tasks/layer-0-todo.md` có tasks cho Layer 0
- [ ] User đã approve spec (ghi rõ trong commit message)

---

<HARD-GATE>
KHÔNG viết code, KHÔNG scaffold, KHÔNG implement cho đến khi:
1. Design spec đã viết vào docs/specs/
2. User đã approve spec
3. Phases + tasks đã tạo
</HARD-GATE>

---

## Checklist (làm theo thứ tự)

- [ ] 1. Đọc `docs/BRIEF.md` — nắm ý tưởng ban đầu
- [ ] 1b. Nếu có `docs/SPECIFICATIONS.md` → đọc chi tiết requirements
- [ ] 2. Clarify requirements (hỏi từng câu, ưu tiên multiple choice)
- [ ] 3. Propose 2-3 approaches + recommend 1 + trade-offs
- [ ] 4. User chọn approach
- [ ] 5. Present design từng section → confirm từng phần:
  - Architecture → Components → Data Flow → Error Handling → Testing
- [ ] 6. Viết design spec → `docs/specs/YYYY-MM-DD-[topic]-design.md`
- [ ] 7. Tạo ADRs cho key decisions → `docs/decisions/`
- [ ] 8. Tự review spec:
  - Placeholder còn sót? (TBD, TODO, [...])
  - Mâu thuẫn giữa sections?
  - Scope quá lớn? → chia nhỏ
  - Requirement mơ hồ? → làm rõ
- [ ] 9. Hỏi user review + approve
- [ ] 10. Viết `docs/IMPLEMENTATION_PLAN.md` — plan tổng tất cả phases + status
- [ ] 11. Chia phases phù hợp project → `docs/phases/phase-1..N.md`
- [ ] 12. Phân tích dependency Phase 1 → chia Layers (xem `docs/SCOPE_BREAKDOWN.md`)
- [ ] 13. Tạo `tasks/layer-0-todo.md`, `layer-1-todo.md`, ... cho Phase 1
- [ ] 14. Update `AGENTS.md`:
  - Điền Stack
  - Điền Folder Structure
  - Current Phase = 1, Current Layer = 0
- [ ] 15. Update `docs/ARCHITECTURE.md` — điền đầy đủ
- [ ] 16. Commit: `docs: complete Phase 0 planning`

---

## Phase Template (dùng cho Phase 1-N)

Khi tạo phases mới, dùng format này:

```markdown
# Phase [N]: [Tên Phase]

> **Goal:** [Mục tiêu cụ thể]
> **Status:** ⬜ Todo | 🔄 In Progress | ✅ Done

## Definition of Done
- [ ] [Criteria cụ thể]
- [ ] Tests pass

## Tasks
| ID | Task | Status | Commit |
|----|------|--------|--------|
| N.1 | [task] | ⬜ | - |
| N.2 | [task] | ⬜ | - |

## Dependencies
- [Phase trước phải hoàn thành]

## Notes
[Ghi chú kỹ thuật]
```

---

## Key Rules

- Hỏi **từng câu một** — không hỏi nhiều cùng lúc
- Ưu tiên **multiple choice** khi có thể
- **2-3 approaches** trước khi chốt
- Confirm **từng section** trước khi tiếp
- **KHÔNG code** cho đến khi spec approved
- Số phases **tuỳ project** — không cứng
