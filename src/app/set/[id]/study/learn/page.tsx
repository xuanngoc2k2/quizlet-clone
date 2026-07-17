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
import { Input } from "@/components/ui/Input"
import { useEffect, useRef, useState } from "react"

function normalize(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, " ")
}

function isCorrect(userAnswer: string, correctAnswer: string) {
  const a = normalize(userAnswer)
  const b = normalize(correctAnswer)
  if (a === b) return true
  if (a.includes(b) || b.includes(a)) return true
  const aWords = a.split(" ")
  const bWords = b.split(" ")
  const common = aWords.filter((w) => bWords.includes(w)).length
  return common >= Math.min(aWords.length, bWords.length) * 0.7
}

export default function LearnPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: set } = api.sets.getById.useQuery({ id })
  const cards = set?.cards ?? []
  const engine = useStudyEngine(cards)
  const timer = useTimer()
  const [answer, setAnswer] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [lastCorrect, setLastCorrect] = useState(false)
  const startedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!startedRef.current && cards.length > 0) {
      timer.start()
      startedRef.current = true
    }
  }, [cards.length, timer])

  useEffect(() => {
    if (engine.isComplete && cards.length > 0) {
      timer.stop()
      updateSetProgress(id, "learn", {
        correct: engine.correctCount,
        incorrect: engine.incorrectCount,
        completedCards: engine.completedCards,
        timeSpent: timer.elapsed,
        step: engine.total,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.isComplete, cards.length])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const correct = isCorrect(answer, engine.currentCard?.definition ?? "")
    setLastCorrect(correct)
    setShowResult(true)
  }

  function handleNext() {
    if (lastCorrect) {
      engine.markCorrect()
    } else {
      engine.markIncorrect()
    }
    setAnswer("")
    setShowResult(false)
    inputRef.current?.focus()
  }

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
            <Button onClick={engine.reset} variant="secondary">Study Again</Button>
            <Button onClick={() => router.push(`/set/${id}`)}>Back to Set</Button>
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

        <div className="mb-6 rounded-2xl border bg-white p-8 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Term</p>
          <p className="text-xl font-semibold">{engine.currentCard?.term}</p>
        </div>

        {showResult ? (
          <div className="flex flex-col items-center gap-4">
            <div className={`rounded-xl p-4 text-center ${lastCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              <p className="font-medium">{lastCorrect ? "Correct!" : "Incorrect"}</p>
              <p className="mt-1 text-sm">{engine.currentCard?.definition}</p>
            </div>
            <Button onClick={handleNext} className="w-full">
              {lastCorrect ? "Next" : "Try Again Later"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              ref={inputRef}
              placeholder="Type the definition..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              autoFocus
            />
            <Button type="submit" disabled={!answer.trim()}>
              Check Answer
            </Button>
          </form>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
