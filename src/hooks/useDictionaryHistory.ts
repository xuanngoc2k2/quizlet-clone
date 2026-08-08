"use client"

import { useState } from "react"
import {
  addDictionaryHistoryItem,
  clearDictionaryHistory,
  getDictionaryHistory,
  removeDictionaryHistoryItem,
} from "@/lib/dictionary-storage"

export function useDictionaryHistory() {
  const [history, setHistory] = useState<string[]>(() => getDictionaryHistory())

  const addHistory = (text: string) => {
    setHistory((prev) => addDictionaryHistoryItem(text, prev))
  }

  const removeHistory = (text: string) => {
    setHistory(removeDictionaryHistoryItem(text))
  }

  const clearHistory = () => {
    clearDictionaryHistory()
    setHistory([])
  }

  return { history, addHistory, removeHistory, clearHistory }
}
