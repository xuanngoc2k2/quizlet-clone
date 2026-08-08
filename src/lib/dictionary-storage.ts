const HISTORY_KEY = "quizlet-dict-history"
const POSITION_KEY = "quizlet-dict-position"
const MAX_HISTORY = 20

export type PanelPosition = { x: number; y: number }

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or private mode
  }
}

export function getDictionaryHistory(): string[] {
  const list = readJSON<string[]>(HISTORY_KEY, [])
  return Array.isArray(list) ? list : []
}

export function addDictionaryHistoryItem(text: string, current: string[] = getDictionaryHistory()): string[] {
  const trimmed = text.trim()
  if (!trimmed) return current
  const next = [trimmed, ...current.filter((item) => item !== trimmed)].slice(0, MAX_HISTORY)
  writeJSON(HISTORY_KEY, next)
  return next
}

export function removeDictionaryHistoryItem(text: string): string[] {
  const next = getDictionaryHistory().filter((item) => item !== text)
  writeJSON(HISTORY_KEY, next)
  return next
}

export function clearDictionaryHistory(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch {
    // ignore
  }
}

export function getPanelPosition(): PanelPosition | null {
  return readJSON<PanelPosition | null>(POSITION_KEY, null)
}

export function savePanelPosition(pos: PanelPosition | null): void {
  if (pos) {
    writeJSON(POSITION_KEY, pos)
  } else {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(POSITION_KEY)
    } catch {
      // ignore
    }
  }
}
