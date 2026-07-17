import type { StudyProgress, StudyMode } from "@/types"

const PROGRESS_KEY = "quizlet-progress"
const OWN_SETS_KEY = "quizlet-own-sets"

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

export function getOwnSetIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(OWN_SETS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addOwnSetId(id: string): void {
  if (typeof window === "undefined") return
  try {
    const ids = getOwnSetIds()
    if (!ids.includes(id)) {
      ids.push(id)
      localStorage.setItem(OWN_SETS_KEY, JSON.stringify(ids))
    }
  } catch {
    // storage full
  }
}

export function removeOwnSetId(id: string): void {
  if (typeof window === "undefined") return
  try {
    const ids = getOwnSetIds()
    localStorage.setItem(
      OWN_SETS_KEY,
      JSON.stringify(ids.filter((x) => x !== id)),
    )
  } catch {
    // storage full
  }
}
