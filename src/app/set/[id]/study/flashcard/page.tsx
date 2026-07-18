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
import { MathText } from "@/components/ui/MathText"
import { SpeakerButton } from "@/components/ui/SpeakerButton"
import { useEffect, useRef, useState, useMemo } from "react"
import { RotateCw, CheckCircle2, XCircle, Sparkles } from "lucide-react"

export default function FlashcardPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: set } = api.sets.getById.useQuery({ id })
  const rememberedFilter = (searchParams.get("remembered") ?? "all") as "all" | "0" | "1" | "2" | "3"
  const { data: cardProgress = {} } = api.cardProgress.getBySet.useQuery({ setId: id })
  const utils = api.useUtils()
  const incrementMutation = api.cardProgress.increment.useMutation({
    onSuccess: () => utils.cardProgress.getBySet.invalidate({ setId: id }),
  })
  const cards = useMemo(
    () => filterCardsByRemembered(set?.cards ?? [], cardProgress, rememberedFilter),
    [set?.cards, cardProgress, rememberedFilter],
  )
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

        <div className="flex flex-1 flex-col items-center justify-center">
          <button onClick={() => setFlipped(!flipped)} className="w-full max-w-md perspective">
            <div
              className={`relative min-h-[300px] w-full transition-transform duration-500 preserve-3d ${
                flipped ? "rotate-y-180" : ""
              }`}
            >
              <div className="absolute inset-0 backface-hidden rounded-2xl border border-primary-100 bg-white p-8 shadow-lg">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary-400">Term</p>
                  <p className="text-xl font-semibold text-primary-900 whitespace-pre-wrap"><MathText text={engine.currentCard?.term ?? ""} /></p>
                  <p className="mt-6 text-xs text-primary-300">Tap to flip</p>
                </div>
                {engine.currentCard && (
                  <div className="absolute bottom-4 right-4">
                    <SpeakerButton text={engine.currentCard.term} lang="ko-KR" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border border-primary-100 bg-white p-8 shadow-lg">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary-400">Definition</p>
                  <p className="text-xl font-semibold text-primary-900 whitespace-pre-wrap"><MathText text={engine.currentCard?.definition ?? ""} /></p>
                  <p className="mt-6 text-xs text-primary-300">Tap to flip back</p>
                </div>
                {engine.currentCard && (
                  <div className="absolute bottom-4 right-4">
                    <SpeakerButton text={engine.currentCard.definition} lang="en-US" />
                  </div>
                )}
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
            <XCircle className="h-4 w-4" />
            Still Learning
          </Button>
          <Button
            variant="gradient"
            className="flex-1"
            onClick={() => {
              if (engine.currentCard) incrementMutation.mutate({ setId: id, cardId: engine.currentCard.id })
              engine.markCorrect()
              setFlipped(false)
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
            Got It
          </Button>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
