"use client"

import { useMemo, useState, useCallback } from "react"
import type { Flashcard } from "@/types"

export function useStudyEngine(cards: Flashcard[]) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctIds, setCorrectIds] = useState<Set<string>>(new Set())
  const [incorrectIds, setIncorrectIds] = useState<Set<string>>(new Set())

  const shuffled = useMemo(() => {
    const arr = [...cards]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [cards])

  const currentCard = shuffled[currentIndex] ?? null
  const isComplete = currentIndex >= shuffled.length

  const markCorrect = useCallback(() => {
    if (currentCard) {
      setCorrectIds((prev) => new Set(prev).add(currentCard.id))
    }
    setCurrentIndex((i) => i + 1)
  }, [currentCard])

  const markIncorrect = useCallback(() => {
    if (currentCard) {
      setIncorrectIds((prev) => new Set(prev).add(currentCard.id))
    }
    setCurrentIndex((i) => i + 1)
  }, [currentCard])

  const reset = useCallback(() => {
    setCurrentIndex(0)
    setCorrectIds(new Set())
    setIncorrectIds(new Set())
  }, [])

  return {
    currentCard,
    currentIndex,
    total: shuffled.length,
    correctCount: correctIds.size,
    incorrectCount: incorrectIds.size,
    completedCards: [...Array.from(correctIds), ...Array.from(incorrectIds)],
    isComplete,
    markCorrect,
    markIncorrect,
    reset,
  }
}
