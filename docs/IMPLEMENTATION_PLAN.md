# Implementation Plan: Quizlet Clone

> **Objective:** Mobile-first Quizlet clone cho iPad & phone — public, no auth, 5 study modes
> **Stack:** Next.js 14+ App Router + TypeScript + Prisma + tRPC + Tailwind CSS
> **Timeline:** 3 phases

---

## Phases

### Phase 0 — Planning ✅
- Output: Design spec, ADRs, phases, tasks
- Details: `docs/phases/phase-0.md`

### Phase 1 — Core Platform ✅
- **Goal:** Project scaffolding, DB, tRPC API, pages (Home, Create, View, Edit), responsive layout
- **Layers:** 3 layers — Foundation, API+Pages, Progress Tracking
- **Definition of Done:** All CRUD operations work, browse/create/edit sets, mobile-responsive ✅
- **Details:** `docs/phases/phase-1.md`

### Phase 2 — Study Modes ✅
- **Goal:** All 5 study modes (Flashcard, Learn, Quiz, Match, Spell) + progress tracking
- **Layers:** 4 layers
- **Definition of Done:** Each mode playable, progress saved to localStorage
- **Details:** `docs/phases/phase-2.md`

### Phase 3 — Polish & Launch ✅
- **Goal:** PWA, animations, tests, performance
- **Layers:** 4 layers
- **Definition of Done:** Lighthouse ≥ 90, PWA installable, tests pass
- **Details:** `docs/phases/phase-3.md`

---

## Layer Overview (Phase 1)

| Layer | Mô tả | Status |
|-------|-------|--------|
| Layer 0 | Project setup, Prisma schema, env, base UI components | ⬜ |
| Layer 1 | tRPC API, pages (Home, Create, View, Edit), responsive layout | ⬜ |
| Layer 2 | localStorage progress, "my sets" management | ⬜ |

---

## Key Decisions

| # | Decision | Rationale | ADR |
|---|----------|-----------|-----|
| 1 | Next.js + Prisma + tRPC + Tailwind | Full type safety, no auth needed, mobile-first | `docs/decisions/001-full-nextjs-stack.md` |
| 2 | Public + localStorage progress | No auth complexity, per-device tracking | spec |
| 3 | No image/rich text in MVP | Keep scope small, add later | spec |

---

## Risks & Assumptions

- **Risk:** tRPC learning curve → **Mitigation:** tRPC docs + code examples
- **Risk:** localStorage bị xóa (clear cache, private mode) → **Mitigation:** Toast warning khi progress mất
- **Assumption:** Web Speech API available cho Spell mode (fallback to input-only)
- **Risk:** Match game performance trên mobile → **Mitigation:** Limit cards to 12 per game, use hardware-accelerated CSS
