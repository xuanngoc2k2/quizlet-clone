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

### [R-07] — Spaced Repetition System (SRS) Integration (Anki Stage 1)

**Type:** Feature
**Description:** Tích hợp thuật toán lặp lại ngắt quãng (FSRS/SM-2) để tối ưu hoá việc học. Thay đổi schema Flashcard/CardProgress để lưu các thông số SRS (interval, ease, dueDate, lapses). Thay đổi giao diện Study Mode để có 4 nút đánh giá: Again, Hard, Good, Easy với dự báo khoảng thời gian hiển thị trên nút.
**Acceptance Criteria:**
- DB Schema được cập nhật với các trường phục vụ thuật toán lặp lại ngắt quãng.
- Hàm tính toán SRS (FSRS hoặc SM-2) được implement.
- Giao diện Study Mode hiển thị 4 nút: Again (Quên), Hard (Khó), Good (Tốt), Easy (Dễ) với logic update tương ứng.
**Status:** ✅ Done
**Commit:** feat: implement spaced repetition system (SRS) with SM-2 algorithm

### [R-08] — Daily Review Dashboard (Anki Stage 2)

**Type:** Feature
**Description:** Xây dựng màn hình "Daily Review" để tổng hợp các thẻ (từ nhiều Set khác nhau) đến hạn ôn tập trong ngày.
**Acceptance Criteria:**
- Query được danh sách các thẻ có `dueDate <= now` từ tất cả các Set của user.
- UI hiển thị số lượng thẻ cần học hôm nay.
- Flow học tập liên tục cho phép người dùng ôn tập toàn bộ thẻ "Due Today" trong một session duy nhất, bất kể chúng thuộc Set nào.
**Status:** ✅ Done
**Commit:** feat: implement Daily Review Dashboard (R-08, Anki Stage 2)

### [R-09] — Thẻ Điền Khuyết - Cloze Deletion (Anki Stage 3)

**Type:** Feature
**Description:** Hỗ trợ định dạng thẻ điền khuyết (Cloze deletion), ví dụ "Tôi ăn {{c1::táo}}". Tính năng này đặc biệt hữu ích cho học ngữ pháp.
**Acceptance Criteria:**
- Cho phép tạo và chỉnh sửa flashcard với syntax `{{c1::từ}}`.
- Study Mode nhận diện thẻ cloze và ẩn phần text điền khuyết thành `[...]`.
- Khi lật thẻ, hiển thị phần text đầy đủ với định dạng nổi bật.
**Status:** ⬜ Todo
**Commit:** -

### [R-10] — Gamification & Heatmap (Anki Stage 4)

**Type:** Feature
**Description:** Bổ sung yếu tố trò chơi hoá (Gamification) để tăng động lực học tập: Chuỗi ngày học liên tục (Streak) và biểu đồ đóng góp (Heatmap) giống GitHub.
**Acceptance Criteria:**
- Tracking hoạt động học tập hằng ngày của người dùng.
- Tính toán và hiển thị số ngày học liên tiếp (Streak).
- Xây dựng UI Heatmap hiển thị cường độ ôn tập theo lịch năm.
**Status:** ⬜ Todo
**Commit:** -

### [R-11] — Tối ưu Keyboard Shortcuts cho Anki Mode (Anki Stage 5)

**Type:** Feature
**Description:** Chỉnh sửa lại hệ thống phím tắt cho giống với thói quen của người dùng Anki: Space/Enter để lật thẻ và chọn "Good", phím 1/2/3/4 tương ứng Again/Hard/Good/Easy. Có thể cấu hình phím tắt trong Settings.
**Acceptance Criteria:**
- Phím tắt 1, 2, 3, 4 kích hoạt hành động đánh giá thẻ.
- Phím Space hoặc Enter lật thẻ (nếu thẻ đang úp) hoặc chọn Good (nếu thẻ đang ngửa).
- (Optional) Toggle setting cho phép người dùng chọn giữa "Classic Quizlet Shortcuts" và "Anki Shortcuts".
**Status:** ⬜ Todo
**Commit:** -

### [R-12] — Authentication System (NextAuth.js)

**Type:** Feature
**Description:** Tích hợp hệ thống đăng nhập/đăng ký cho người dùng để bảo mật dữ liệu cá nhân, lưu trữ lịch sử học tập (TestHistory, CardProgress) theo từng tài khoản thay vì local/anonymous.
**Acceptance Criteria:**
- Cài đặt `next-auth` (hoặc `@auth/nextjs`) với Prisma Adapter.
- Cập nhật Prisma schema (thêm các model User, Account, Session, VerificationToken) và liên kết các model hiện tại (Set, TestHistory, FlashcardProgress) với User.
- Hỗ trợ đăng nhập qua OAuth (Google/GitHub) và Credentials (Email/Password).
- Tạo giao diện Login/Register page và bảo vệ các routes yêu cầu đăng nhập bằng middleware/session check.
- Cập nhật tRPC context để nhận diện user session và filter data theo user.
**Status:** ✅ Done
**Commit:** feat: implement authentication system with NextAuth and Prisma

### [R-13] — TOPIK Set Test: chọn cả Browse Sets lẫn Set của user

**Type:** Feature
**Description:** Trong phần Set Test (`/test`), `SetTestGenerator` hiện chỉ load Browse Sets (public, unowned) qua `sets.list`. Cho phép người dùng chọn Set từ BOTH Browse Sets VÀ các Set của chính user (qua `sets.my`), gom thành 2 tab khác nhau trong cùng màn hình, mỗi tab hiển thị tiêu đề + số item, giữ nguyên flow generate/chấm điểm hiện tại.
**Acceptance Criteria:**
- `SetTestGenerator` fetch cả `sets.list` (Browse) và `sets.my` (của user), không cần đăng nhập vẫn hiển thị Browse Sets.
- UI có tab chuyển đổi "Set của tôi" / "Browse Sets" (ẩn tab "Set của tôi" nếu chưa đăng nhập hoặc không có set). Mỗi mục vẫn render chuẩn như hiện tại và select được.
- Set được chọn từ tab nào cũng generate đề bình thường (set-test.generate hoạt động với mọi setId), không lỗi.
- Typecheck + lint pass sạch.
**Status:** ✅ Done
**Commit:** feat: allow picking user sets in Set Test via tab switcher

### [R-14] — Fix: Test set-test không hiện trong lịch sử bài test

**Type:** Bug
**Description:** Test tạo từ **Set Test** không xuất hiện trong `/test/history` khi user đã đăng nhập. `setTest.generate` (`set-test.ts`) tạo `TestHistory` chỉ gắn `deviceId`, không gắn `userId`; trong khi `testHistory.list` khi đã đăng nhập filter `{ userId }` → record không khớp → bị ẩn. Đối chiếu: `testHistory.save` (đường Generator) có gắn `userId` nên hiện đúng.
**Acceptance Criteria:**
- `set-test.generate` gắn `ctx.userId` vào `TestHistory` khi user đã đăng nhập (giữ nguyên `deviceId` cho weakness tracking + user ẩn danh).
- Test e2e: generate với userId thật → `testHistory.list` (cùng userId) trả về record vừa tạo.
- Typecheck + lint pass sạch.
**Status:** ✅ Done
**Commit:** -

### [R-15] — Hiển thị tiến độ học trên SetCard (Set Progress Indicator)

**Type:** Feature
**Description:** Thay đổi màu gradient khi hover của SetCard để thể hiện tiến độ học (số lượng từ đã thuộc/đã học). Tỉ lệ hoàn thành tính bằng `(số từ có trạng thái graduated / tổng số từ) * 100`.
**Acceptance Criteria:**
- Cập nhật tRPC queries (`sets.list`, `sets.my`) để join với `CardProgress` và trả về số thẻ đã thuộc ứng với `userId` hoặc `deviceId`.
- Truyền dữ liệu tiến độ vào component `SetCard`.
- `SetCard` thay đổi màu gradient động tuỳ theo % tiến độ (VD: 0%: mặc định, >0%: màu cam/vàng, 100%: màu xanh lá).
- Typecheck, lint pass sạch.
**Status:** ✅ Done
**Commit:** feat: implement Set Progress Indicator on SetCard (R-15)
