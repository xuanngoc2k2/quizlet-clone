"use client"

import { useState, useCallback, useEffect } from "react"
import type { Flashcard } from "@/types"

export function useStudyEngine(cards: Flashcard[], srsData?: Record<string, any>) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctIds, setCorrectIds] = useState<Set<string>>(new Set())
  const [incorrectIds, setIncorrectIds] = useState<Set<string>>(new Set())

  const [shuffled, setShuffled] = useState<Flashcard[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize the deck once when cards are available
  useEffect(() => {
    if (cards.length > 0 && !isInitialized) {
      const arr = [...cards]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]
      }
      setShuffled(arr)
      setIsInitialized(true)
    }
  }, [cards, isInitialized])

  const currentCard = shuffled[currentIndex] ?? null
  const isComplete = isInitialized && shuffled.length > 0 && currentIndex >= shuffled.length

  let recommendedMode = "flashcard"
  if (currentCard && srsData && srsData[currentCard.id]) {
    const srs = srsData[currentCard.id]
    if (srs.srsLapses > 0 && srs.srsState === "review") {
      recommendedMode = "cloze"
    } else if (srs.srsState === "review") {
      recommendedMode = "quiz"
    }
  }

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
    
    const arr = [...cards]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    setShuffled(arr)
    setIsInitialized(true)
  }, [cards])

  return {
    currentCard,
    currentIndex,
    total: shuffled.length,
    correctCount: correctIds.size,
    incorrectCount: incorrectIds.size,
    completedCards: [...Array.from(correctIds), ...Array.from(incorrectIds)],
    isComplete,
    recommendedMode,
    markCorrect,
    markIncorrect,
    reset,
  }
}
