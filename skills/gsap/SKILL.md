---
name: gsap
description: GSAP animation intelligence. Core API, Timelines, React useGSAP hook, ScrollTrigger, memory cleanup, and performance optimization.
---

# 🌀 GSAP — GREEN SOCK ANIMATION PLATFORM
*(AI Skill Module for High-Performance Animations)*

Tài liệu này cung cấp bộ quy tắc và ví dụ mẫu chuẩn hóa để AI Agent viết mã nguồn hoạt họa bằng GreenSock (GSAP) tối ưu hóa hiệu năng, tương thích hoàn toàn với React 18/19 (Next.js) và không bị rò rỉ bộ nhớ (Memory Leak).

---

## 🏗️ 1. LUẬT SẮT KHI DÙNG GSAP TRONG REACT / NEXT.JS

Khi phát triển giao diện React/Next.js, **AI BẮT BUỘC** phải tuân thủ các quy tắc sau:

### ⚠️ Luật 1: KHÔNG DÙNG `useEffect` hoặc `useLayoutEffect` thông thường
*   **Sai:** Sử dụng `useEffect` thông thường để khởi tạo GSAP. Điều này gây lỗi chạy lặp hiệu ứng 2 lần (Double-Animation) do React StrictMode và dễ bị rò rỉ bộ nhớ khi chuyển trang.
*   **Đúng:** **BẮT BUỘC** sử dụng hook chuyên dụng `@gsap/react` để tự động hóa việc dọn dẹp (cleanup) khi component unmount:
    ```typescript
    import { useGSAP } from "@gsap/react";
    import gsap from "gsap";
    
    // Đăng ký plugin nếu có dùng
    import { ScrollTrigger } from "gsap/ScrollTrigger";
    gsap.registerPlugin(ScrollTrigger);
    ```

### ⚠️ Luật 2: Luôn sử dụng `scope` (Phạm vi truy cập)
Để tránh việc GSAP vô tình chọn nhầm phần tử có cùng class ở component khác, luôn chỉ định vùng `scope` bằng `useRef`:
```typescript
const container = useRef<HTMLDivElement>(null);

useGSAP(() => {
  // selector ".box" sẽ chỉ tìm kiếm BÊN TRONG container
  gsap.to(".box", { x: 100 });
}, { scope: container }); // Cấu hình scope tại đây!
```

---

## ⏳ 2. CORE API & TIMELINES (TRÌNH TỰ HOẠT HỌA)

### A. Core API Best Practices
1.  **Dùng `autoAlpha` thay vì `opacity`:** `autoAlpha` tự động đổi `visibility: hidden` khi opacity về 0, giúp trình duyệt bỏ qua việc tính toán click/hover trên phần tử đang ẩn.
2.  **Dùng Transform Aliases:** Luôn dùng `x`, `y`, `scale`, `rotation` thay cho `left`, `top`, `width`, `height` để kích hoạt tăng tốc phần cứng GPU.

### B. Timelines thay vì Delay
Không sử dụng `delay` thủ công để xếp hàng các hiệu ứng. Luôn dùng `gsap.timeline()` để tạo chuỗi chuyển động chính xác:

```typescript
useGSAP(() => {
  const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.5 } });
  
  tl.to(".title", { y: 0, autoAlpha: 1 })
    .to(".desc", { y: 0, autoAlpha: 1 }, "-=0.2") // Chạy sớm hơn 0.2s so với tiến trình
    .to(".btn", { scale: 1, autoAlpha: 1 }, "<");  // Chạy cùng lúc với hiệu ứng trước
}, { scope: container });
```

---

## 📜 3. SCROLL TRIGGER (HIỆU ỨNG CUỘN TRANG)

ScrollTrigger cho phép tạo hiệu ứng liên kết với con lăn chuột. Khi sử dụng ScrollTrigger trong React, **PHẢI** tuân thủ cấu trúc dọn dẹp bộ nhớ:

```typescript
const container = useRef<HTMLDivElement>(null);

useGSAP(() => {
  gsap.to(".flying-element", {
    x: 300,
    scrollTrigger: {
      trigger: ".trigger-section", // Phần tử kích hoạt
      start: "top 80%",            // Bắt đầu khi đỉnh trigger chạm 80% chiều cao màn hình
      end: "bottom 20%",          // Kết thúc khi đáy trigger chạm 20% màn hình
      scrub: true,                 // Liên kết mượt mà với con lăn chuột (true hoặc số giây)
      pin: true,                   // Ghim phần tử lại khi cuộn
      anticipatePin: 1,            // Tránh giật màn hình khi ghim
    }
  });
}, { scope: container });
// useGSAP sẽ TỰ ĐỘNG dọn dẹp các ScrollTrigger này khi component bị hủy!
```

---

## ⚡ 4. TỐI ƯU HÓA HIỆU NĂNG (PERFORMANCE)

1.  **Sử dụng `will-change`:**
    Khi animate các phần tử phức tạp, hãy thêm thuộc tính CSS `will-change: transform, opacity` để báo trước cho trình duyệt chuẩn bị tăng tốc phần cứng.
2.  **Sử dụng `preventOverlaps` và `fastScrollEnd`:**
    Đối với các hiệu ứng ScrollTrigger phức tạp, thêm cấu hình để tránh việc các hoạt ảnh đè lên nhau khi người dùng cuộn trang quá nhanh:
    ```javascript
    scrollTrigger: {
      trigger: ".section",
      toggleActions: "play none none reverse",
      preventOverlaps: true,
      fastScrollEnd: true,
    }
    ```
3.  **Tránh Flash of Unstyled Content (FOUC):**
    Để tránh việc các phần tử bị giật hình hoặc hiện ra 1 mili-giây trước khi GSAP kịp ẩn chúng, hãy cài đặt CSS ẩn trước (`opacity: 0; visibility: hidden;`) và dùng `gsap.fromTo` hoặc `gsap.to` với `autoAlpha: 1` để hiển thị.

---

## 🚨 5. BẢNG ĐỐI CHIẾU LỖI (ANTI-PATTERNS CHECKLIST)

AI Agent **PHẢI** tự kiểm tra xem có mắc các lỗi dưới đây trước khi hoàn thành:

*   [ ] Có sử dụng `useEffect` để chạy GSAP không? -> **Hủy bỏ**, đổi sang `useGSAP()`.
*   [ ] Có sử dụng selector toàn cục như `gsap.to(".card", ...)` không? -> **Hủy bỏ**, bắt buộc phải useRef container làm `scope`.
*   [ ] Có dùng thuộc tính CSS `top/left/margin` để animate vị trí không? -> **Hủy bỏ**, đổi sang `x/y`.
*   [ ] Có dùng `gsap.registerPlugin` bên trong component không? -> **Hủy bỏ**, đưa việc đăng ký plugin ra ngoài cùng (Global Scope) của file.
