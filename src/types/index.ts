export interface FlashcardSet {
  id: string
  title: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  cards?: Flashcard[]
  _count?: { cards: number }
}

export interface Flashcard {
  id: string
  setId: string
  term: string
  definition: string
  order: number
  createdAt: Date
}

export type StudyMode = "flashcard" | "learn" | "quiz" | "match" | "spell"

export interface StudyProgress {
  [setId: string]: {
    mode: StudyMode
    step: number
    correct: number
    incorrect: number
    completedCards: string[]
    date: string
    timeSpent: number
  }
}
