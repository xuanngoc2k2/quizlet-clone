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

### [R-02] — TOPIK Set Test Generator (Phase A)

**Type:** Feature
**Description:** Tạo đề kiểm tra TOPIK-style từ một Set (FlashcardSet): tổng câu = số item, 4 part (MC ≥5 / chia từ ≥5 / đồng nghĩa ≥2 / dịch ≥1 scaled theo tổng), mọi item xuất hiện ≥1 lần, cover cả vocabulary + grammar, difficulty 20/50/30, không hiển thị nghĩa trước submit, chấm AI Part 4, anti-duplicate với các đề cũ, lưu lịch sử theo setId. Phase B: weakness/오답 복습/thích ứng difficulty.
**Acceptance Criteria:**
- DB: TestHistory thêm `source`, `setId`, `contextHashes`, `questionItemMap` + migration
- `set-test.generate` trả 4 part, validate coverage (missing → regenerate ≤3 lần)
- Tab "Set Test" trên /test, chọn Set → generate → làm/dấểu → chấm → review
- Nút "TOPIK Set Test" trên trang /set/[id]
- Review có breakdown theo part + type (vocab/grammar) + giải thích đúng/sai
- Typecheck + lint + unit tests pass (distribution, gemini parse)
**Status:** ✅ Done (Phase A + B) — Phase B: weakness tracking, difficulty adaptation, 오답 복습 (Ôn câu sai)
**Commit:** -

### [R-03] — Floating Dictionary Assistant (Phase 1: Core lookup + panel)

**Type:** Feature
**Description:** Từ điển nổi Hàn↔Việt trên mọi trang: nút floating bottom-right, panel chatbot 400px (mobile bottom-sheet), tra từ/cụm/câu/ngữ pháp, AI fallback (Gemini strict JSON) có DB cache (`DictionaryEntry`), text-selection action ("Tra cứu"), lịch sử localStorage, kéo-thả panel (localStorage vị trí), minimize + badge unread, ESC/Enter, lazy-load UI.
**Acceptance Criteria:**
- DB: model `DictionaryEntry` (cacheKey unique, text, from, to, result JSON) + migration
- `dictionary.lookup({ text, from, to })`: DB cache hit → trả ngay; miss → Gemini → Zod validate → upsert cache → trả
- Panel mở từ nút nổi (z-index cao), conversation giữ nguyên khi đóng/mở và khi chuyển trang
- Bôi đen text bất kỳ → action "Tra cứu" (không hiện khi chọn bên trong panel; không gọi API khi chỉ mở nút)
- Kiểm tra hướng: có Hangul → ko→vi, ngược lại vi→ko; lịch sử 20 items localStorage
- Lazy-load: chỉ tải panel khi mở; FloatingButton không gọi tRPC
- Typecheck + lint + unit tests pass (dictionary lib), build pass
**Status:** ✅ Done (Phase 1 + Phase 2) — Phase 2: Add-to-Set + Add-Flashcard (dedupe theo term, chọn/tạo set, editable card). Phase 3 (pending): Mini Practice
**Commit:** -

### [R-04] — Sửa lỗi nút chức năng trên header từ điển bị kéo thả chiếm quyền

**Type:** Bug
**Description:** Khi click vào các nút chức năng trên thanh header của Từ điển (đổi chiều ngôn ngữ, thu gọn, xóa lịch sử, đóng panel), hành động click bị chiếm quyền do sự kiện kéo thả panel. Cần thêm `onPointerDown={(e) => e.stopPropagation()}` để các nút này nhận sự kiện click độc lập và hoạt động bình thường.
**Acceptance Criteria:**
- Người dùng có thể click vào toàn bộ các nút trên header bình thường.
- Chức năng kéo thả vẫn hoạt động mượt mà khi nhấn giữ vào phần tiêu đề "Từ điển" hoặc icon grip.
- Typecheck + lint + tests pass sạch.
**Status:** ✅ Done
**Commit:** fix: prevent drag interference on dictionary header buttons

### [R-05] — Tích hợp Text-to-Speech (TTS) miễn phí qua Google Translate TTS

**Type:** Feature
**Description:** Tích hợp giọng phát âm tiếng Hàn/Việt chất lượng cao thông qua Google Translate TTS API miễn phí, kết hợp cơ chế cache trong database (model `TtsCache`). Thay thế hoàn toàn Web Speech API không ổn định bằng server-side proxy `/api/tts`. Cập nhật `SpeakerButton`, Flashcard, Spell mode và Từ điển nổi.
**Acceptance Criteria:**
- API Route `/api/tts` hoạt động: fetch audio từ Google TTS, cache vào DB, trả stream `audio/mpeg`
- `SpeakerButton` dùng API mới thay vì Web Speech API
- Spell mode tự động phát âm term tiếng Hàn khi bắt đầu mỗi câu hỏi + nút "Nghe lại"
- Typecheck + lint + tests pass sạch
**Status:** ✅ Done
**Commit:** feat: integrate free Google Translate TTS with database caching

### [R-06] — Xuất đề thi TOPIK ra định dạng PDF

**Type:** Feature
**Description:** Sử dụng `@react-pdf/renderer` để tạo tính năng xuất đề thi TOPIK sang file PDF. Hỗ trợ đầy đủ font chữ tiếng Hàn và tiếng Việt (Noto Sans KR). Tính năng này cho phép người dùng tải đề thi về máy để in hoặc làm offline. Nút "Tải PDF" được tích hợp trên trang lịch sử thi.
**Acceptance Criteria:**
- Component `TopikPdfDocument` render PDF với font chữ chuẩn (không bị lỗi "tofu").
- Component `PdfDownloadButton` xử lý đúng quá trình generate phía client-side để tránh lỗi SSR của Next.js.
- Nút "Tải PDF" hoạt động đúng trên trang `/test/history/[id]`.
- Typecheck + lint + tests pass sạch.
**Status:** ✅ Done
**Commit:** feat: implement TOPIK test PDF export using react-pdf
