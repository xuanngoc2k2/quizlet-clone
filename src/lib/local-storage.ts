import type { StudyProgress, StudyMode, CardProgressData, RememberedFilter, Flashcard } from "@/types"

const PROGRESS_KEY = "quizlet-progress"
const CARD_PROGRESS_KEY = "quizlet-card-progress"
const DEVICE_ID_KEY = "quizlet-device-id"
const AUTOPLAY_SETTING_KEY = "quizlet-autoplay-setting"

export function getProgress(): StudyProgress {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveProgress(progress: StudyProgress): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // storage full or private mode
  }
}

export function updateSetProgress(
  setId: string,
  mode: StudyMode,
  data: {
    step?: number
    correct?: number
    incorrect?: number
    completedCards?: string[]
    timeSpent?: number
  },
): StudyProgress {
  const progress = getProgress()
  const current = progress[setId] ?? {
    mode,
    step: 0,
    correct: 0,
    incorrect: 0,
    completedCards: [],
    date: new Date().toISOString(),
    timeSpent: 0,
  }

  progress[setId] = {
    ...current,
    mode,
    step: data.step ?? current.step,
    correct: data.correct ?? current.correct,
    incorrect: data.incorrect ?? current.incorrect,
    completedCards: data.completedCards ?? current.completedCards,
    timeSpent: data.timeSpent ?? current.timeSpent,
    date: new Date().toISOString(),
  }

  saveProgress(progress)
  return progress
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return ""
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY)
    if (!id) {
      id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
      localStorage.setItem(DEVICE_ID_KEY, id)
    }
    return id
  } catch {
    return ""
  }
}

export function getCardProgressData(): CardProgressData {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(CARD_PROGRESS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveCardProgressData(data: CardProgressData): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CARD_PROGRESS_KEY, JSON.stringify(data))
  } catch {
    // storage full
  }
}

export function incrementRememberedCount(setId: string, cardId: string): void {
  const data = getCardProgressData()
  const setData = data[setId] ?? {}
  const cardData = setData[cardId] ?? { rememberedCount: 0 }
  setData[cardId] = { rememberedCount: cardData.rememberedCount + 1 }
  data[setId] = setData
  saveCardProgressData(data)
}

export function filterCardsByRemembered(
  cards: Flashcard[],
  cardProgress: Record<string, number>,
  filter: RememberedFilter,
): Flashcard[] {
  if (filter === "all") return cards
  const threshold = Number.parseInt(filter, 10)
  return cards.filter((card) => {
    const remembered = cardProgress[card.id] ?? 0
    if (threshold === 3) return remembered >= 3
    return remembered === threshold
  })
}

export function getAutoplaySetting(): boolean {
  if (typeof window === "undefined") return true
  try {
    const raw = localStorage.getItem(AUTOPLAY_SETTING_KEY)
    return raw !== null ? JSON.parse(raw) : true
  } catch {
    return true
  }
}

export function saveAutoplaySetting(enabled: boolean): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(AUTOPLAY_SETTING_KEY, JSON.stringify(enabled))
  } catch {
    // storage full
  }
}
