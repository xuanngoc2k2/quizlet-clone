# ADR-001: Full Next.js Stack Approach

**Date:** 2026-07-17
**Status:** Proposed

## Context
Cần chọn stack cho Quizlet clone mobile-first, public (no auth), tập trung vào study modes.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **1: Next.js + Prisma + tRPC** | Full TypeScript, type-safe từ DB đến UI, SSR, PWA ready | Vendor lock into Next.js |
| **2: Next.js + Supabase** | Auth built-in (dù không cần), realtime, ít code backend | Phụ thuộc BaaS, khó self-host |
| **3: T3 Stack (create-t3-app)** | Battle-tested, có boilerplate | Overhead cho project không auth, ít linh hoạt |

## Decision
**Chọn Option 1: Next.js App Router + Prisma + tRPC + Tailwind**

## Rationale
1. **Type safety end-to-end:** Prisma schema → tRPC router → React Query → UI — tất cả cùng kiểu
2. **No auth needed:** Không cần NextAuth/Clerk overhead
3. **App Router:** RSC cho trang browse (fast initial load), Client Components cho study modes (interactive)
4. **tRPC:** Không REST boilerplate, inference type tự động
5. **Prisma:** Migration dễ, SQLite cho dev nhanh, PostgreSQL cho prod
6. **Tailwind:** Mobile-first responsive dễ dàng

## Consequences
- Phải quản lý DB migration (Prisma CLI)
- tRPC learning curve nhẹ so với REST truyền thống
- PWA cần config thêm (next-pwa / @serwist)
