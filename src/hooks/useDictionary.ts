"use client"

import { createContext, useContext } from "react"
import type { DictionaryResult, Lang } from "@/lib/dictionary"

export type DictionaryMessage = {
  id: string
  role: "user" | "assistant"
  text?: string
  result?: DictionaryResult
  status?: "loading" | "error"
  error?: string
  from?: Lang
  to?: Lang
}

export type DictionaryContextValue = {
  open: boolean
  setOpen: (_open: boolean) => void
  minimized: boolean
  setMinimized: (_minimized: boolean) => void
  messages: DictionaryMessage[]
  from: Lang
  to: Lang
  setFrom: (_from: Lang) => void
  setTo: (_to: Lang) => void
  swapDirection: () => void
  submit: (_text: string, _opts?: { from?: Lang; to?: Lang }) => void
  clearConversation: () => void
  history: string[]
  removeHistoryItem: (_text: string) => void
  clearHistory: () => void
  unread: number
  panelRef: React.RefObject<HTMLDivElement>
}

export const DictionaryContext = createContext<DictionaryContextValue | null>(null)

export function useDictionary(): DictionaryContextValue {
  const ctx = useContext(DictionaryContext)
  if (!ctx) throw new Error("useDictionary must be used within a DictionaryProvider")
  return ctx
}
