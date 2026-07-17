"use client"

import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { useStudyEngine } from "@/hooks/useStudyEngine"
import { useTimer } from "@/hooks/useTimer"
import { updateSetProgress } from "@/lib/local-storage"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { ProgressBar } from "@/components/study/ProgressBar"
import { Button } from "@/components/ui/Button"
import { useEffect, useRef, useState } from "react"

export default function FlashcardPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: set } = api.sets.getById.useQuery({ id })
  const cards = set?.cards ?? []
  const engine = useStudyEngine(cards)
  const timer = useTimer()
  const [flipped, setFlipped] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!startedRef.current && cards.length > 0) {
      timer.start()
      startedRef.current = true
    }
  }, [cards.length, timer])

  useEffect(() => {
    if (engine.isComplete && cards.length > 0) {
      timer.stop()
      updateSetProgress(id, "flashcard", {
        correct: engine.correctCount,
        incorrect: engine.incorrectCount,
        completedCards: engine.completedCards,
        timeSpent: timer.elapsed,
        step: engine.total,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.isComplete, cards.length])

  if (cards.length === 0) {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <p className="text-gray-500">No cards in this set</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (engine.isComplete) {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-24">
          <h2 className="mb-2 text-2xl font-bold">Complete!</h2>
          <p className="mb-1 text-gray-600">
            {engine.correctCount} / {engine.total} correct
          </p>
          <p className="mb-8 text-sm text-gray-400">
            Time: {Math.floor(timer.elapsed / 60)}m {timer.elapsed % 60}s
          </p>
          <div className="flex gap-3">
            <Button onClick={engine.reset} variant="secondary">
              Study Again
            </Button>
            <Button onClick={() => router.push(`/set/${id}`)}>
              Back to Set
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <ProgressBar
          current={engine.currentIndex + 1}
          total={engine.total}
          correct={engine.correctCount}
          incorrect={engine.incorrectCount}
        />

        <div className="flex flex-1 flex-col items-center justify-center">
          <button
            onClick={() => setFlipped(!flipped)}
            className="w-full max-w-md"
          >
            <div
              className={`min-h-[280px] rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 ${
                flipped ? "rotate-y-180" : ""
              }`}
            >
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                  {flipped ? "Definition" : "Term"}
                </p>
                <p className="text-xl font-semibold">
                  {flipped ? engine.currentCard?.definition : engine.currentCard?.term}
                </p>
                <p className="mt-4 text-xs text-gray-400">Tap to flip</p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              engine.markIncorrect()
              setFlipped(false)
            }}
          >
            Still Learning
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => {
              engine.markCorrect()
              setFlipped(false)
            }}
          >
            Got It
          </Button>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
