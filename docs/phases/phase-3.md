# Phase 3: Polish & Launch

> **Goal:** PWA, animations, tests, performance optimization
> **Status:** ⬜ Todo

## Definition of Done
- [ ] PWA installable (manifest + service worker + offline)
- [ ] Animations smooth (60fps on mobile)
- [ ] Vitest + Playwright tests pass
- [ ] Lighthouse ≥ 90 all categories

---

## Layer 0: PWA
| ID | Task | Status |
|----|------|--------|
| 0.1 | PWA manifest (icons, theme color, display: standalone) | ⬜ |
| 0.2 | Service worker (offline cache for viewed sets) | ⬜ |
| 0.3 | Install prompt + "Add to Home Screen" toast | ⬜ |
| 0.4 | Safe area insets for notched devices | ⬜ |

## Layer 1: Animations
| ID | Task | Status |
|----|------|--------|
| 1.1 | Page transitions (Framer Motion AnimatePresence) | ⬜ |
| 1.2 | Card flip 3D effect (transform-style: preserve-3d) | ⬜ |
| 1.3 | Match game card bounce + fade animations | ⬜ |
| 1.4 | Loading skeleton shimmer animation | ⬜ |

## Layer 2: Tests
| ID | Task | Status |
|----|------|--------|
| 2.1 | Vitest setup + unit tests for localStorage, card shuffle, answer check | ⬜ |
| 2.2 | Component tests: SetForm validation, FlashcardView flip, Quiz scoring | ⬜ |
| 2.3 | tRPC router tests: input validation, error cases | ⬜ |
| 2.4 | Playwright e2e: create set → study → complete all modes | ⬜ |

## Layer 3: Performance + SEO
| ID | Task | Status |
|----|------|--------|
| 3.1 | Metadata API (open graph, title, description per page) | ⬜ |
| 3.2 | Image optimization (Next/Image for card images if any) | ⬜ |
| 3.3 | Bundle analysis + code splitting for study modes | ⬜ |
| 3.4 | Lighthouse audit + fix performance issues | ⬜ |

---

## Dependencies
- Phase 2 — Study Modes ✅
- @serwist/next or next-pwa
- Vitest + @testing-library/react
- Playwright
