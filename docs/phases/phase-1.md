# Phase 1: Core Platform

> **Goal:** Project scaffolding, DB, tRPC API, pages (Home, Create, View, Edit), responsive layout
> **Status:** 🔄 In Progress

## Definition of Done
- [ ] Next.js app chạy được, Prisma migrate lên DB
- [ ] tRPC routers cho sets + cards CRUD
- [ ] Pages: Home (browse), Create/Edit Set, View Set (card list)
- [ ] Mobile-responsive layout (touch targets, bottom nav)
- [ ] localStorage helpers cho progress

---

## Layer 0: Foundation (no dependency)
| ID | Task | Status |
|----|------|--------|
| 0.1 | Next.js App Router project scaffold + TypeScript config | ⬜ |
| 0.2 | Tailwind CSS setup + globals.css (mobile-first) | ⬜ |
| 0.3 | Prisma schema (FlashcardSet, Flashcard) + seed script | ⬜ |
| 0.4 | tRPC server setup (context, trpc.ts, React Query provider) | ⬜ |
| 0.5 | Base UI components (Button, Input, Card, Modal, IconButton) | ⬜ |

## Layer 1: API + Pages (depends on Layer 0)
| ID | Task | Status |
|----|------|--------|
| 1.1 | tRPC set router (list, getById, create, update, delete) | ⬜ |
| 1.2 | SetCard component + SetList + Home page (browse all sets) | ⬜ |
| 1.3 | SetForm (title, description, dynamic card rows) + CreateSet page | ⬜ |
| 1.4 | EditSet page (reuse SetForm, pre-fill) | ⬜ |
| 1.5 | ViewSet page (card list with sticky header) | ⬜ |
| 1.6 | Responsive layout: Header, BottomNav, Shell | ⬜ |
| 1.7 | Search bar + search page (/search?q=) | ⬜ |

## Layer 2: Progress Tracking (depends on Layer 1)
| ID | Task | Status |
|----|------|--------|
| 2.1 | localStorage helpers (get/set progress, get/remove own set IDs) | ⬜ |
| 2.2 | "My Sets" section on Home (filter by stored IDs) | ⬜ |
| 2.3 | Loading skeletons + error boundaries cho pages | ⬜ |

---

## Dependencies
- Phase 0 — Planning ✅ (spec approved)
- Node.js 18+, npm/pnpm installed

## Notes
- Dev DB: SQLite (no external server)
- Prod DB: PostgreSQL (via Prisma)
- No i18n needed for MVP
