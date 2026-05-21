# ⚙️ Task Execution Protocol (BẮT BUỘC)

> Mỗi task PHẢI đi qua 3 gate. Không được skip. Không được rút gọn.
> Flow: **Task → Pre-Code → Code → Post-Code → Commit**

<HARD-GATE: PRE-CODE>
Trước khi viết BẤT KỲ dòng code nào, PHẢI hoàn thành:

**1. Graph Context Summary**
- Gọi `codegraph_context(task_description)` → liệt kê files liên quan
- Gọi `codegraph_search(keyword)` → tìm component/hook/service đã tồn tại
- Nếu MCP tools không khả dụng → đọc `docs/ARCHITECTURE.md` + dùng file tree
- ⚠️ **PHẢI ghi rõ trong output:** "📊 Graph Context: [danh sách files liên quan]"
- ⚠️ **Nếu đã có component/hook/service tương tự → TÁI SỬ DỤNG, không tạo mới**

**2. Impact Analysis**
- Gọi `codegraph_explore(file)` cho MỖI file định sửa
- OUTPUT BẮT BUỘC (ghi rõ trong response):
  ```
  ✅ Allowed files: [files sẽ create/modify — chỉ sửa những file này]
  ⛔ Forbidden files: [files KHÔNG được đụng]
  ⚠️ Risk files: [shared/infra files — cần giải thích nếu sửa]
  🧪 Tests affected: [test files cần chạy lại]
  ```

**3. Component Plan (cho UI tasks)**
- Liệt kê components sẽ tạo/sửa (theo Component-First Rule)
- Page file chỉ compose — KHÔNG chứa logic/state/fetch
- UI block > 50 dòng JSX → tách component

Nếu THIẾU bất kỳ output nào ở trên → KHÔNG ĐƯỢC bắt đầu code.
</HARD-GATE>

<HARD-GATE: DURING-CODE>
Trong khi code, PHẢI tuân theo:

1. **Chỉ sửa files trong "Allowed files"** đã khai báo ở Pre-Code
2. Nếu cần sửa file ngoài scope → **DỪNG LẠI**, update Impact Analysis, giải thích lý do
3. **Component-First**: Không nhét >50 dòng JSX vào 1 component
4. Mỗi file mới phải đúng vị trí trong folder structure
5. **Verify graph usage**: Khi không chắc file nào bị ảnh hưởng → gọi `codegraph_explore` NGAY, không đoán
</HARD-GATE>

<HARD-GATE: POST-CODE>
Sau khi code xong, PHẢI hoàn thành TRƯỚC KHI báo done:

**1. Spec Compliance Check**
- So sánh implementation vs. task requirements: **Thiếu gì? Thừa gì?**
- Nếu thiếu requirement → implement thêm
- Nếu thừa (code ngoài scope) → xóa hoặc giải thích lý do
- ⚠️ "Tests pass" ≠ "Spec compliant". Kiểm tra cả hai.

**2. Post-Code Impact Check**
- Gọi `codegraph_explore` cho các files ĐÃ SỬA
- So sánh với Impact Analysis ban đầu
- Nếu có file bị ảnh hưởng ngoài dự kiến → kiểm tra + sửa

**3. Verification** (chạy `./scripts/ai-review.sh` hoặc thủ công)
- Dùng `rtk` (nếu có) trước các lệnh terminal dài để giảm token rác.
- TypeScript: `rtk npx tsc --noEmit`
- Lint: `rtk npm run lint` (nếu có)
- Test: `rtk npm test` (nếu có)
- Build: `rtk npm run build` (nếu có)
- UI/React: `rtk npx react-doctor` (bắt buộc nếu là project React)
- **UI Visual Check (nếu có `chrome-devtools-mcp`):** Dùng MCP tools để screenshot trang vừa sửa, inspect DOM, đọc console errors. Báo lỗi nếu layout bị vỡ.
- Nếu bất kỳ lệnh nào fail → SỬA cho đến khi pass
- ⚠️ **PHẢI paste raw output** (hoặc trích dẫn key lines). KHÔNG chỉ ghi "pass".

**4. Knowledge & Memory Update**
- Nếu task vừa hoàn thành giải quyết một **bug phức tạp**, cấu hình khó, hoặc phát hiện ra **pattern/best-practice mới**:
- BẮT BUỘC tạo file mới trong `docs/knowledge/` (VD: `YYYY-MM-DD-[topic].md`).
- Cập nhật file `docs/knowledge/INDEX.md` và gắn Tags (VD: `#bug`, `#config`, `#ui`).
- Nếu có quy trình / script mới cần ghi nhớ cho context cá nhân, lưu vào `memory/`.

**5. Completion Report** (ghi rõ trong response)
```
📋 COMPLETION REPORT
- Files created: [danh sách]
- Files modified: [danh sách]
- Files deleted: [danh sách]
- Spec compliance: ✅ match / ⚠️ gaps [liệt kê]
- Graph tools used: ✅/❌ (liệt kê tools đã gọi)
- Verification evidence (dùng rtk để gọn log):
  - TypeScript: [paste exit code hoặc error count]
  - Lint: [paste error count hoặc "0 errors"]
  - Tests: [paste X/Y passed hoặc skip + lý do]
  - Build: [paste exit code]
  - React Doctor: [paste status hoặc skip]
- Impact ngoài dự kiến: có/không
- Knowledge Updated: [Đường dẫn file knowledge mới tạo hoặc "None"]
```

⛔ KHÔNG ĐƯỢC báo "done" nếu:
- Chưa hoàn thành Completion Report
- Report thiếu verification evidence (raw output)
- Spec compliance chưa check
</HARD-GATE>
