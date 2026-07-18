"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { useStudyEngine } from "@/hooks/useStudyEngine"
import { useTimer } from "@/hooks/useTimer"
import { updateSetProgress, filterCardsByRemembered } from "@/lib/local-storage"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { ProgressBar } from "@/components/study/ProgressBar"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { MathText } from "@/components/ui/MathText"
import { SpeakerButton } from "@/components/ui/SpeakerButton"
import { useEffect, useRef, useState, useMemo } from "react"
import { CheckCircle2, XCircle, Sparkles, RotateCw } from "lucide-react"

export default function SpellPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: set } = api.sets.getById.useQuery({ id })
  const rememberedFilter = (searchParams.get("remembered") ?? "all") as "all" | "0" | "1" | "2" | "3"
  const { data: cardProgress = {} } = api.cardProgress.getBySet.useQuery({ setId: id })
  const incrementMutation = api.cardProgress.increment.useMutation()
  const cards = useMemo(
    () => filterCardsByRemembered(set?.cards ?? [], cardProgress, rememberedFilter),
    [set?.cards, cardProgress, rememberedFilter],
  )
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
      updateSetProgress(id, "spell", {
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
    const correct = answer.toLowerCase().trim() === engine.currentCard?.term.toLowerCase().trim()
    setLastCorrect(correct)
    setShowResult(true)
  }

  function handleNext() {
    if (lastCorrect) {
      if (engine.currentCard) incrementMutation.mutate({ setId: id, cardId: engine.currentCard.id })
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
          <p className="text-primary-500">No cards in this set</p>
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
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-500 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold text-primary-900">Complete!</h2>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-lg font-bold">{engine.correctCount}</span>
            </span>
            <span className="text-primary-300">/</span>
            <span className="flex items-center gap-1.5 text-red-500">
              <XCircle className="h-5 w-5" />
              <span className="text-lg font-bold">{engine.incorrectCount}</span>
            </span>
          </div>
          <p className="mt-2 text-sm text-primary-400">
            Time: {Math.floor(timer.elapsed / 60)}m {timer.elapsed % 60}s
          </p>
          <div className="mt-8 flex gap-3">
            <Button onClick={engine.reset} variant="secondary">
              <RotateCw className="h-4 w-4" />
              Study Again
            </Button>
            <Button onClick={() => router.push(`/set/${id}`)} variant="gradient">
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

        <div className="mb-6 rounded-2xl border border-primary-100 bg-white p-8 text-center shadow-sm">
          <div className="mb-3 flex items-center justify-center gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-400">Definition</p>
            {engine.currentCard && <SpeakerButton text={engine.currentCard.definition} lang="en-US" />}
          </div>
          <p className="text-xl font-semibold text-primary-900 whitespace-pre-wrap"><MathText text={engine.currentCard?.definition ?? ""} /></p>
          <p className="mt-4 text-xs text-primary-400">Type the term</p>
        </div>

        {showResult ? (
          <div className="flex flex-col items-center gap-4">
            <div className={`w-full rounded-xl p-4 text-center ${lastCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              <p className="font-medium">{lastCorrect ? "Correct!" : "Incorrect"}</p>
              <p className="mt-1 text-sm text-primary-900">
                Correct answer: <span className="font-semibold">{engine.currentCard?.term}</span>
              </p>
            </div>
            <Button onClick={handleNext} variant="gradient" className="w-full">
              {lastCorrect ? "Next" : "Try Again Later"}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              ref={inputRef}
              placeholder="Type the term..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              autoFocus
            />
            <Button type="submit" variant="gradient" disabled={!answer.trim()}>
              Check Spelling
            </Button>
          </form>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
