# 🛸 HƯỚNG DẪN THIẾT KẾ GIAO DIỆN HIỆN ĐẠI (UI/UX DYNAMIC DRAFT)
*(Dành cho Nhà phát triển và AI Coding Agents)*

Tài liệu này cung cấp bộ quy chuẩn hạ tầng và tri thức thiết kế để tích hợp các hiệu ứng hoạt họa (micro-animations), 3D, và phát sáng (glow) từ **Magic UI** và **Aceternity UI** một cách linh hoạt, giữ cho dự án luôn gọn nhẹ và sạch sẽ nhất.

---

## 🏗️ 1. HẠ TẦNG KỸ THUẬT (DOCKING THE SYSTEM)

Khi dự án cụ thể phát sinh yêu cầu xây dựng giao diện cao cấp, AI hoặc Nhà phát triển cần chủ động tự thiết lập hạ tầng tối giản dưới đây.

### Bước 1.1: Cài đặt thư viện cốt lõi (Dependencies)
Chạy lệnh sau để cài đặt các thư viện nền móng hỗ trợ hiệu ứng chuyển động và xử lý CSS class:
```bash
npm install framer-motion clsx tailwind-merge lucide-react
```

### Bước 1.2: Tạo hàm tiện ích ghép Class (`cn` helper)
Tạo tệp tin `src/lib/utils.ts` (hoặc `src/utils/cn.ts` tùy cấu trúc dự án) để xử lý việc gộp class Tailwind động không bị xung đột:
```typescript
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tw-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 🎨 2. LUỒNG PHỐI HỢP VỚI SKILL `ui-ux-pro-max`

Trước khi bắt tay vào copy-paste hay viết code bất kỳ giao diện nào, **AI Agent BẮT BUỘC** phải tuân theo quy trình phối hợp 2 bước sau:

```
[BƯỚC 1: PHÂN TÍCH]                                [BƯỚC 2: THỰC THI]
Chạy `ui-ux-pro-max` script ───► Lấy bảng màu,  ───► Thiết lập hạ tầng dynamic ───► Copy-paste component
để xác định Style & Palette      font chữ & layout   (nếu chưa có) & code UI         Magic UI / Aceternity UI
```

1.  **Bước 1 (Phân tích):** Chạy lệnh tìm kiếm thiết kế để lấy bảng màu (Color Palette) và kiểu chữ (Typography) phù hợp:
    ```bash
    python3 skills/ui-ux-pro-max/scripts/search.py "<product_type> <keywords>" --design-system
    ```
2.  **Bước 2 (Thực thi):** Sử dụng các mã màu HEX hoặc HSL, font chữ Google Fonts được gợi ý từ bước 1 để áp dụng vào cấu trúc hoạt họa của component Magic UI / Aceternity UI.

---

## ⚡ 3. NGUYÊN TẮC COPY-PASTE & PHÁT TRIỂN COMPONENT

### A. Lựa chọn Component thông minh
Chỉ lấy các component thực sự mang lại trải nghiệm thị giác đột phá ("WOW factor"):
*   **Magic UI (magicui.design):** Ưu tiên các hiệu ứng nền (`Particles`, `Retro Grid`), chữ nghệ thuật (`Sparkles Text`, `Text Animate`), và nút bấm (`Shimmer Button`, `Rainbow Button`).
*   **Aceternity UI (ui.aceternity.com):** Ưu tiên hiệu ứng viền phát sáng động (`Moving Border`), card nghiêng 3D lơ lửng (`3D Card Effect`), và các bố cục hiện đại (`Bento Grid`).

### B. Quy tắc chia nhỏ Component (Component-First Rule)
*   **JSX > 50 dòng:** Phải tách component Magic UI đó ra thành tệp tin riêng trong `src/components/ui/` hoặc `src/components/magicui/`.
*   **Không lạm dụng State cục bộ:** Các component hoạt họa chỉ nên nhận dữ liệu qua `props` để hiển thị, giữ logic tính toán và fetch dữ liệu ở tầng Container / Service.

---

## 🚨 4. BỘ LUẬT SẮT VỀ MỸ THUẬT (IRON LAWS OF VISUAL QUALITY)

Để tránh để lại các lỗi thiết kế thô sơ ("sạn" giao diện), AI Agent phải tự đối chiếu danh sách dưới đây trước khi bàn giao:

| Danh mục | Quy chuẩn "NÊN LÀM" (Do) | Điều cấm kỵ "TRÁNH LÀM" (Don't) |
| :--- | :--- | :--- |
| **Icons** | Sử dụng SVG chất lượng cao đồng bộ (`Lucide Icons`, `Heroicons`). | Dùng icon Emoji (🎨, 🚀, ⚙️) làm icon chính trên giao diện. |
| **Hover States** | Dùng hiệu ứng đổi màu nhẹ (`transition-colors`) hoặc độ mờ (`opacity`). | Dùng scale quá lớn làm xô lệch hoặc giật bố cục các phần tử xung quanh. |
| **Tương tác** | Bắt buộc thêm `cursor-pointer` cho mọi nút bấm, thẻ Card có thể click. | Để mặc định con trỏ chuột (`default cursor`) trên các vùng tương tác. |
| **Độ tương phản** | Đảm bảo độ tương phản chữ tối thiểu 4.5:1 (Dark Mode dùng nền đen `#030303` chữ trắng xám `#E2E8F0`). | Dùng chữ xám mờ trên nền kính trong suốt quá mỏng (gây nhức mắt). |
| **Độ mượt** | Tần suất chuyển động (duration) lý tưởng từ 150ms đến 300ms. | Hiệu ứng chuyển động quá chậm (>500ms) tạo cảm giác ứng dụng bị lag. |

---

## 🔍 5. QUY TRÌNH KIỂM THỬ GIAO DIỆN (UI VERIFICATION)

Khi tích hợp các hiệu ứng hoạt họa, bắt buộc phải kiểm tra:
1.  **Tính phản hồi (Responsive):** Thu nhỏ màn hình xuống kích thước `375px` (Mobile) và mở rộng `1440px` (Desktop). Đảm bảo các hạt Particles hay 3D Card không gây tràn màn hình theo chiều ngang (Không lỗi Horizontal Scroll).
2.  **Khả năng tương thích:** Nếu hệ thống có cài đặt công cụ trình duyệt `chrome-devtools-mcp`, AI **phải chụp ảnh màn hình (screenshot)** trang giao diện vừa tạo để tự rà soát bố cục trực quan trước khi báo cáo hoàn thành.
