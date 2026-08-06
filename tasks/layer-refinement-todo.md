# Layer Refinement — Post-Completion

> Sau khi hoàn thành tất cả layers (Layer 0 → N), user check lại và báo bug hoặc feature mới.
> File này track những thay đổi sau khi hệ thống đã "xong".

---

## Workflow

1. **User báo** → Bug hoặc feature mới
2. **AI brainstorm** → Clarify + propose 2-3 approaches
3. **User approve** → Confirm phương án
4. **Tạo task** → Thêm vào bảng bên dưới
5. **Pick + implement** → Như các layer khác

---

## Tasks

<!-- 
Khi user báo bug/feature, thêm task theo format:

### [ID] — [Title]

**Type:** Bug | Feature
**Description:** [Mô tả vấn đề/yêu cầu]
**Acceptance Criteria:** [Tiêu chí hoàn thành]
**Status:** ⬜ Todo | 🔄 In Progress | ✅ Done
**Commit:** -
-->

### [R-01] — Import cards từ file JSON/CSV

**Type:** Feature
**Description:** Thêm nút Import trong SetForm (dùng chung Create/Edit) cho phép append cards từ file JSON (mảng `{term, definition}`) hoặc CSV (`term,definition[,type]`). Kèm example files để tải trên UI.
**Acceptance Criteria:**
- Import append vào cards hiện có, bỏ trùng, bỏ dòng thiếu term/definition
- JSON + CSV đều parse được; quy chuẩn `type` → vocabulary/grammar
- Đường link download sample .csv & .json trên UI
- Unit test cho parser trong `src/lib/set-import.test.ts` pass; lint + typecheck clean
**Status:** ✅ Done
**Commit:** -
