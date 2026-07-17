# Architecture — Quizlet Clone

> Mobile-first Quizlet clone for iPad & phone
> Last updated: 2026-07-17

---

## 1. System Overview

```
User (Mobile/Tablet Browser)
       │
       ▼
  Next.js App Router
  ├── Server Components (data fetching, layout)
  ├── Client Components (interactive: card flip, quiz, match)
  └── tRPC API Layer
         │
         ▼
    Prisma ORM
         │
         ▼
    PostgreSQL (prod) / SQLite (dev)

Browser localStorage
  └── StudyProgress (per-set, per-mode)
  └── OwnSetIds (track "my sets")
```

---

## 2. Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | Next.js 14+ App Router + TypeScript | SSR/SSG, RSC cho fast loads, Client Components cho interactivity |
| Styling | Tailwind CSS | Mobile-first responsive, utility-first |
| Backend | tRPC (embedded in Next.js) | Type-safe API, no REST boilerplate, full inference |
| Database | Prisma + SQLite (dev) / PostgreSQL (prod) | Type-safe ORM, easy migrations |
| Animations | Framer Motion | React-native animations, 60fps on mobile |
| PWA | @serwist/next | Offline support, install prompt |
| Test | Vitest + Playwright | Fast unit tests, reliable e2e |
| Client State | React Query (via tRPC React) | Caching, stale-while-revalidate |

> See ADR-001 for tech decisions

---

## 3. Data Models

### FlashcardSet
```
id          String @id @default(cuid())
title       String
description String?
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
cards       Flashcard[]
```

### Flashcard
```
id          String @id @default(cuid())
setId       String @map
term        String
definition  String
order       Int
createdAt   DateTime @default(now())
set         FlashcardSet @relation(fields: [setId], references: [id], onDelete: Cascade)
```

---

## 4. API Design (tRPC)

### Set Router
| Procedure | Input | Output |
|-----------|-------|--------|
| `set.list` | `{ search?: string }` | `FlashcardSet[]` |
| `set.getById` | `{ id: string }` | `FlashcardSet & { cards: Flashcard[] }` |
| `set.create` | `{ title, description?, cards: { term, definition }[] }` | `FlashcardSet` |
| `set.update` | `{ id, title?, description?, cards? }` | `FlashcardSet` |
| `set.delete` | `{ id: string }` | `void` |

### Card Router
| Procedure | Input | Output |
|-----------|-------|--------|
| `card.list` | `{ setId: string }` | `Flashcard[]` |

---

## 5. Pages & Components

### Page → Component Tree

```
Home (/) → SetList → SetCard[]
Create Set (/set/new) → SetForm → CardRow[]
View Set (/set/[id]) → SetHeader + CardList
Edit Set (/set/[id]/edit) → SetForm (pre-filled)
Study (/set/[id]/study) → StudyHub → ModeSelector
  ├── FlashcardView
  ├── LearnView
  ├── QuizView
  ├── MatchView
  └── SpellView
Search (/search?q=) → SetList (filtered)
```

### Shared Components
- `ui/Button`, `ui/Input`, `ui/Card`, `ui/Modal`, `ui/IconButton`
- `layout/Header` (top nav on desktop, search bar)
- `layout/BottomNav` (mobile nav: Home, Create, My Sets)
- `layout/Shell` (responsive wrapper, safe-area handling)

---

## 6. Data Flow

### Browse (Server Component → RSC)
```
Client → Next.js Server → tRPC (server) → Prisma → SQLite/PostgreSQL
                                               ↓
                                    HTML rendered (RSC)
                                               ↓
                                    Client hydrates
```

### Study (Client Component)
```
Client loads set data → tRPC query
Study mode starts → localStorage read (existing progress)
Card interaction → localStorage write (update progress)
```

### Create/Edit (Client Component → Mutation)
```
Client fills form → validation (Zod) → tRPC mutation
Mutation success → router.push(`/set/[id]`)
Error → toast notification
```

---

## 7. Study Modes Architecture

```
StudyEngine (shared hooks)
  ├── useCardQueue(setId)     — shuffle, progress, repeat incorrect
  ├── useTimer()              — elapsed time tracking
  └── useProgress(setId)      — localStorage read/write

Each mode:
  └── uses StudyEngine hooks
  └── has 2 states: Playing → Result
```

---

## 8. localStorage Schema

```ts
// ~/lib/local-storage.ts
type StudyProgress = {
  [setId: string]: {
    mode: 'flashcard' | 'learn' | 'quiz' | 'match' | 'spell'
    step: number
    correct: number
    incorrect: number
    completedCards: string[]
    date: string // ISO
    timeSpent: number // seconds
  }
}

// Own set IDs (created by this device)
ownSetIds: string[]
```

---

## 9. Key Decisions

See `docs/decisions/001-full-nextjs-stack.md`:
- Full Next.js stack (no auth overhead)
- Public + localStorage (no user accounts)
- tRPC over REST (type safety)
- Framer Motion for animations (React-native, 60fps)
- Prisma + SQLite for dev speed

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| localStorage cleared by user | Toast warning, no critical data loss (sets are in DB) |
| Web Speech API not supported | Fallback to text-only spell mode |
| Match game lag on low-end mobile | Limit to 12 cards, hardware-accelerated CSS |
| tRPC learning curve | Document patterns, use examples from Next.js + tRPC docs |
| Large sets (50+ cards) slow | Pagination, virtualization (tanstack-virtual) |
