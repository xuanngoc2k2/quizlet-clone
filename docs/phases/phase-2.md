# Phase 2: Study Modes

> **Goal:** All 5 study modes (Flashcard, Learn, Quiz, Match, Spell) + progress tracking
> **Status:** ⬜ Todo

## Definition of Done
- [ ] 5 study modes implemented and playable
- [ ] Progress saved to localStorage per set per mode
- [ ] Touch-friendly: swipe, tap, drag

---

## Layer 0: Study Engine (shared)
| ID | Task | Status |
|----|------|--------|
| 0.1 | Card shuffler + queue manager (spaced repetition lite) | ⬜ |
| 0.2 | Timer utility for study sessions | ⬜ |
| 0.3 | StudyProgress types + localStorage read/write hooks | ⬜ |
| 0.4 | StudyHub page: mode selector, progress overview | ⬜ |

## Layer 1: Flashcard + Learn
| ID | Task | Status |
|----|------|--------|
| 1.1 | FlashcardView: term display, flip animation (Framer Motion), Got It / Still Learning buttons | ⬜ |
| 1.2 | LearnView: show term → type definition → check answer (case-insensitive, partial match) | ⬜ |
| 1.3 | ProgressBar component (cards done / total) | ⬜ |

## Layer 2: Quiz + Match
| ID | Task | Status |
|----|------|--------|
| 2.1 | QuizView: multiple choice (4 options), mix term→def & def→term, score screen | ⬜ |
| 2.2 | MatchView: grid of shuffled term+def cards, tap-to-match, timer | ⬜ |

## Layer 3: Spell + Dashboard
| ID | Task | Status |
|----|------|--------|
| 3.1 | SpellView: Web Speech API TTS → user types word → check | ⬜ |
| 3.2 | Fallback: no audio → show definition → type term | ⬜ |
| 3.3 | Study dashboard: progress per mode, streaks, last studied | ⬜ |

---

## Dependencies
- Phase 1 — Core Platform ✅
- Framer Motion installed
- Web Speech API (browser native, no polyfill for MVP)
