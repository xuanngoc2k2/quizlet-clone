# Design Spec: Quizlet Clone — Mobile-First Web App

> **Date:** 2026-07-17
> **Status:** Draft
> **Approach:** Full Next.js Stack (App Router + Prisma + tRPC + Tailwind)

---

## 1. Project Overview

A mobile-first Quizlet clone optimized for iPad and phone. Users can create, browse, and study flashcard sets with 5 study modes — no account required.

**Core Flow:** Browse sets → Pick a set → Study (Flashcard / Learn / Quiz / Match / Spell)

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + CSS Modules (for complex animations) |
| Database | SQLite (dev) / PostgreSQL (prod) via Prisma ORM |
| API | tRPC (type-safe API, no REST boilerplate) |
| State | React Server Components + tRPC React Query (client) |
| Animation | Framer Motion (card flip, transitions, match game) |
| Progress | localStorage (device-based study progress) |
| PWA | next-pwa or @serwist/next (manifest + service worker) |
| Lint | ESLint + Prettier + Husky |
| Test | Vitest (unit) + Playwright (e2e) |

---

## 3. Architecture

```
Client (Mobile/Tablet Browser)
       │
       ▼
Next.js App Router
  ├── Server Components (data fetching, layout)
  ├── Client Components (interactive: card flip, quiz, match)
  └── API Layer (tRPC server)
         │
         ▼
    Prisma ORM
         │
         ▼
    PostgreSQL (prod) / SQLite (dev)
```

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (responsive shell)
│   ├── page.tsx            # Home — browse sets
│   ├── set/
│   │   ├── [id]/
│   │   │   ├── page.tsx    # View set details
│   │   │   └── study/
│   │   │       └── page.tsx # Study hub (mode selector)
│   │   └── new/
│   │       └── page.tsx    # Create new set
│   │   └── [id]/edit/
│   │       └── page.tsx    # Edit set
│   └── search/
│       └── page.tsx        # Search sets
├── components/
│   ├── ui/                 # Base UI (Button, Input, Card, Modal)
│   ├── layout/             # Header, BottomNav, Shell
│   ├── set/                # SetCard, SetList, SetForm
│   └── study/              # FlashcardView, QuizView, MatchGame, etc.
├── server/
│   ├── db.ts               # Prisma client singleton
│   ├── trpc.ts             # tRPC context + router
│   └── routers/
│       ├── sets.ts         # FlashcardSet CRUD
│       └── cards.ts        # Flashcard CRUD (nested under set)
├── lib/
│   ├── local-storage.ts    # Progress tracking helpers
│   └── utils.ts            # Misc utilities
├── types/
│   └── index.ts            # Shared types (Set, Card, Progress, StudyMode)
└── styles/
    └── globals.css         # Tailwind base + custom styles
```

---

## 4. Data Model

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
setId       String
term        String
definition  String
order       Int     (for ordering within set)
createdAt   DateTime @default(now())
```

### localStorage (Progress)
```ts
type StudyProgress = {
  [setId: string]: {
    mode: StudyMode
    step: number           // current card index
    correct: number
    incorrect: number
    completedCards: string[]  // card IDs mastered
    date: string           // last studied
  }
}

type StudyMode = 'flashcard' | 'learn' | 'quiz' | 'match' | 'spell'
```

---

## 5. API Design (tRPC)

### Set Router
- `set.list(input: { search?: string })` → FlashcardSet[]
- `set.getById(input: { id: string })` → FlashcardSet & cards
- `set.create(input: { title, description?, cards[] })` → FlashcardSet
- `set.update(input: { id, title?, description?, cards[] })` → FlashcardSet
- `set.delete(input: { id })` → void

### Card Router
- `card.list(input: { setId })` → Flashcard[]

---

## 6. Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Browse all sets (grid/card layout), search bar |
| `/set/new` | CreateSet | Form: title, description, add cards (dynamic term/def pairs) |
| `/set/[id]` | ViewSet | Set details, card list, "Study" CTA |
| `/set/[id]/edit` | EditSet | Same form as create, pre-filled |
| `/set/[id]/study` | StudyHub | Choose study mode, see progress |
| `/search?q=` | Search | Filter sets by title/term |

---

## 7. Study Modes

### 7.1 Flashcard Mode
- Show term → tap to flip → show definition
- Swipe/buttons: Got it (→ mastered) / Still learning (→ revisit)
- Progress bar at top

### 7.2 Learn Mode
- Show term → user types definition → check answer
- Partial match: show hint, highlight differences
- Repetition for incorrect answers (spaced repetition lite)

### 7.3 Quiz Mode
- Multiple choice: 4 options, 1 correct
- Mix of "term→definition" and "definition→term"
- Show score at end (X/10, percentage)

### 7.4 Match Game
- Grid of term+definition cards (mix)
- Tap term then tap matching definition
- Timer-based, fastest completion tracked

### 7.5 Spell Mode
- Audio TTS of term → user spells it
- Skip if no audio available (fallback: show definition, type term)
- Case-insensitive matching

---

## 8. Mobile-First Design

- **Breakpoints:** Base = phone (320px), md = tablet (768px), lg = desktop (1024px)
- **Touch targets:** Min 44x44px for interactive elements
- **Bottom nav** on mobile, top nav on desktop
- **Swipe gestures** for card navigation in study modes
- **PWA:** Install prompt, offline cache for viewed sets
- **Safe areas:** `env(safe-area-inset-*)` for notched devices

---

## 9. Data Flow

### Browsing Sets (Server Component)
```
Home Page (RSC)
  └── SetList (RSC)
       └── SetCard (RSC → Client for interactivity)
```

### Studying (Client Component)
```
StudyHub (Client)
  ├── ModeSelector → switch between modes
  ├── ProgressBar (localStorage)
  ├── FlashcardView (Client + framer-motion)
  ├── LearnView (Client + input checking)
  ├── QuizView (Client + MCQ logic)
  ├── MatchView (Client + drag/click matching)
  └── SpellView (Client + Web Speech API)
```

### Creating/Editing Set (Client Component)
```
CreateSet page (Client)
  └── SetForm
       ├── TitleInput
       ├── DescriptionInput (optional)
       └── CardList
            └── CardRow (term + definition inputs, add/remove)
```

---

## 10. Error Handling

- **tRPC Errors:** Zod validation on input, Prisma errors caught -> user-friendly messages
- **Network:** Offline detection, retry, toast notifications
- **Form:** Client-side validation (title required, at least 1 card)
- **Fallback UI:** Each page has error boundary + loading skeleton
- **localStorage:** Try/catch with fallback (storage full, private browsing)

---

## 11. Testing Strategy

| Type | Tool | Scope |
|------|------|-------|
| Unit | Vitest | Utils, helpers, localStorage logic |
| Component | Vitest + Testing Library | UI components, study mode logic |
| API | Vitest + tRPC mock | Router input validation, error cases |
| E2E | Playwright | Full flows: create → study → complete mode |

---

## 12. Out of Scope (Phase 1)

- User accounts / auth
- Sharing sets via link
- Image upload for cards
- AI-generated cards
- Realtime collaboration
- Rich text formatting in term/definition
- Social features (comments, likes)
- Dark mode (Phase 3 candidate)
