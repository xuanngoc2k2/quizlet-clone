# Coding Principles (BẮT BUỘC)

> Dựa trên triết lý Andrej Karpathy. Mọi AI agent PHẢI tuân theo.

## 1. Think Before Coding
**Không tự suy đoán. Không giấu sự nhầm lẫn. Đưa ra các đánh đổi.**
- Nêu rõ giả định. Nếu không chắc chắn → **hỏi**.
- Nếu có nhiều cách hiểu → trình bày chúng, **không âm thầm tự chọn**.
- Nếu có cách đơn giản hơn → nói ra. Push back nếu cần.
- Nếu điều gì đó không rõ ràng → **DỪNG LẠI**. Nói rõ điểm gây lú. Hỏi.

## 2. Simplicity First
**Viết số lượng code tối thiểu để giải quyết vấn đề. Không suy đoán tương lai.**
- Không thêm tính năng ngoài yêu cầu.
- Không tạo abstraction cho code chỉ dùng 1 lần.
- Không thêm "flexibility" hoặc "configurability" nếu không được yêu cầu.
- **Dependency Rule:** KHÔNG tự ý `npm install` package mới (ví dụ: lodash, moment) nếu không được yêu cầu. Ưu tiên Native APIs (VD: `Intl.DateTimeFormat`, Array methods).
- Nếu viết 200 dòng mà có thể 50 dòng → viết lại.
- **Test:** Senior Engineer có thấy cái này quá phức tạp không? Nếu có → simplify.

## 3. Surgical Changes
**Chỉ chạm vào những gì bắt buộc. Chỉ dọn dẹp đống lộn xộn do chính mình tạo ra.**
- Không "cải thiện" code, comment, format ở vùng lân cận.
- Không refactor những thứ không hỏng.
- Tuân theo style hiện tại của project, dù muốn làm khác.
- Nếu thay đổi tạo code thừa → xóa import/variable/function do **chính mình** làm vô dụng. Không xóa dead code có từ trước.
- **Test:** Mọi dòng bị thay đổi phải trace trực tiếp về yêu cầu của user.

## 4. Goal-Driven Execution
**Xác định tiêu chí thành công. Lặp lại cho đến khi verified.**
- Biến task thành mục tiêu verifiable: "Fix bug" → "Viết test tái hiện bug → sửa cho test pass".
- Đối với task nhiều bước → nêu plan ngắn gọn: `[Step] → verify: [check]`.
- Criteria mạnh, tự verify được — không cần user làm rõ liên tục.

## 5. Intellectual Honesty & Tone
**Không chiều theo. Nói thẳng khi thấy sai. Không xin lỗi.**
- **Tone:** Tiếng Việt ngắn gọn, đi thẳng vào vấn đề. KHÔNG xin lỗi ("Tôi xin lỗi vì sự nhầm lẫn...").
- **Fixing Bugs:** Nếu làm sai, CHỈ đưa ra Phân tích nguyên nhân (Root Cause) + Bằng chứng (Evidence) + Cách sửa.
- Nếu user sai → cảnh báo **RISK**, không đồng ý hùa theo.
- Không flip-flop ý kiến chỉ vì user đổi ý. Chỉ đổi khi có evidence mới.
- Nếu request là anti-pattern → từ chối rõ ràng + đề xuất cách tốt hơn.
- **Test:** Nếu sắp đồng ý nhưng biết là sai → DỪNG LẠI và nói sự thật.

## 🚩 Red Flags — DỪNG LẠI nếu đang nghĩ những điều này

| Đang nghĩ... | Thực tế |
|---|---|
| "Câu hỏi đơn giản thôi" | Mọi action đều là task. Check rules trước. |
| "Cần tìm hiểu thêm trước" | Đọc `.ai-context.md` + check skill TRƯỚC khi explore. |
| "Task nhỏ, không cần theo process" | Task nhỏ dễ thành phức tạp. Theo process. |
| "Skill này quá nặng nề" | Nếu skill tồn tại → dùng nó. |
| "Mình nhớ rule rồi" | Rules thay đổi. Đọc lại bản hiện tại. |
| "Làm nhanh cái này trước" | Check rules TRƯỚC KHI làm bất kỳ gì. |
| "Chắc pass rồi" | "Chắc" ≠ evidence. CHẠY command. XEM output. |
| "Lần này ngoại lệ" | Không có ngoại lệ. |
| "Code trông đúng rồi" | Trông đúng ≠ chạy đúng. Verify. |

## 6. Component-First Architecture
**Tách nhỏ, tái sử dụng, dễ đọc cho cả AI lẫn người.**

**Frontend (React/Vue/Svelte):**
- Page/Screen file chỉ **compose** components — KHÔNG chứa logic/state/fetch
- UI block > 50 dòng JSX → **PHẢI** tách thành component riêng
- Logic reusable → custom hook (`hooks/useXxx.ts`)
- API/business logic → service (`services/xxx.service.ts`)
- Types → `types.ts` trong feature folder

**Backend (Node/Express/Fastify):**
- Route handler chỉ parse request + gọi service — KHÔNG chứa business logic
- Business logic → service layer
- Database queries → repository layer
- Validation → middleware hoặc schema (Zod/Joi)

**Feature folder structure:**
```
src/features/[feature-name]/
  components/     ← UI components
  hooks/          ← Custom hooks
  services/       ← API/business logic
  types.ts        ← TypeScript types
  utils.ts        ← Helper functions
  index.ts        ← Public API (re-exports)
```
- **Test:** Nếu component/file quá lớn để đọc trong 30 giây → tách.

---

## Operational Rules
- Test viết ngay sau mỗi task — không để cuối
- 1 commit = 1 task — message: `feat/fix/test/chore: [mô tả]`
- Error handling cho mọi async function
- Không sửa files ngoài danh sách cho phép trong task
- Đọc `docs/knowledge/INDEX.md` trước khi code feature liên quan
- Dùng `scaffolds/*.tmpl` khi tạo file mới (component, service, api-route, hook, test)
- Khi gặp git merge conflict → **KHÔNG tự resolve** → báo user quyết định
- Secrets trong `.env` — KHÔNG hard-code key, url, password vào code

## Verification Iron Law
> **Evidence before claims. Không có ngoại lệ.**

- KHÔNG claim "done", "pass", "works" nếu chưa **CHẠY command** + **XEM output** + **CONFIRM kết quả**.
- "Should pass" = NÓI DỐI. "Looks correct" = NÓI DỐI. "Chắc chắn hoạt động" = NÓI DỐI.
- Completion Report PHẢI chứa **raw output** (hoặc trích dẫn), không chỉ "pass/fail".

| Claim | Requires | NOT Sufficient |
|---|---|---|
| "Tests pass" | Test output: 0 failures | "Should pass", previous run |
| "Lint clean" | Lint output: 0 errors | Partial check, assumption |
| "Build OK" | Build output: exit 0 | "Lint passed" ≠ build passed |
| "Bug fixed" | Test original symptom: passes | Code changed, assumed fixed |

## No Placeholder Rule
- Tasks và plans KHÔNG được chứa: "TBD", "TODO", "implement later", "add appropriate error handling".
- Mọi step phải có: **exact file paths** + **actual code** (hoặc `scaffolds/*.tmpl` reference) + **exact commands** + **expected output**.
- "Similar to Task N" → KHÔNG. Repeat code — AI có thể đọc tasks out of order.
