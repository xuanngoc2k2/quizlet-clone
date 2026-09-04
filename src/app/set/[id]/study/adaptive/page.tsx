"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { useStudyEngine } from "@/hooks/useStudyEngine"
import { filterCardsByRemembered } from "@/lib/local-storage"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { ProgressBar } from "@/components/study/ProgressBar"
import { ClozeCard } from "@/components/study/ClozeCard"
import { Button } from "@/components/ui/Button"
import { MathText } from "@/components/ui/MathText"
import { SpeakerButton } from "@/components/ui/SpeakerButton"
import { useMemo, useState } from "react"
import { CheckCircle2, XCircle, Sparkles, RotateCw, ChevronRight } from "lucide-react"

export default function AdaptiveStudyPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const rememberedFilter = (searchParams.get("remembered") ?? "all") as "all" | "0" | "1" | "2" | "3"
  
  const { data: set } = api.sets.getById.useQuery({ id })
  const { data: cardProgress = {} } = api.cardProgress.getBySet.useQuery({ setId: id })
  const { data: srsProgress = {} } = api.cardProgress.getSrsBySet.useQuery({ setId: id })
  const utils = api.useUtils()

  const reviewMutation = api.cardProgress.review.useMutation({
    onSuccess: () => {
      utils.cardProgress.getBySet.invalidate({ setId: id })
      utils.cardProgress.getSrsBySet.invalidate({ setId: id })
    },
  })

  const cards = useMemo(
    () => filterCardsByRemembered(set?.cards ?? [], cardProgress, rememberedFilter),
    [set?.cards, cardProgress, rememberedFilter],
  )
  
  const engine = useStudyEngine(cards, srsProgress)
  const [flipped, setFlipped] = useState(false)

  const handleNextFlashcard = (rating: 0 | 1 | 2 | 3) => {
    if (!engine.currentCard) return
    reviewMutation.mutate({ setId: id, cardId: engine.currentCard.id, rating })
    if (rating >= 2) engine.markCorrect()
    else engine.markIncorrect()
    setFlipped(false)
  }

  const handleClozeCorrect = () => {
    if (!engine.currentCard) return
    reviewMutation.mutate({ setId: id, cardId: engine.currentCard.id, rating: 2 }) // Good
    engine.markCorrect()
    setFlipped(false)
  }

  const handleClozeIncorrect = () => {
    if (!engine.currentCard) return
    reviewMutation.mutate({ setId: id, cardId: engine.currentCard.id, rating: 0 }) // Again
    engine.markIncorrect()
    setFlipped(false)
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
        <div className="mb-8">
          <ProgressBar
            current={engine.currentIndex + 1}
            total={engine.total}
            correct={engine.correctCount}
            incorrect={engine.incorrectCount}
          />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center min-h-[400px]">
          {engine.recommendedMode === "cloze" && engine.currentCard ? (
            <ClozeCard 
              card={engine.currentCard} 
              onCorrect={handleClozeCorrect}
              onIncorrect={handleClozeIncorrect}
            />
          ) : (
            <div className="w-full max-w-md">
              <p className="mb-4 text-center text-sm font-medium text-pink-500">
                Mode: {engine.recommendedMode.toUpperCase()}
              </p>
              <button onClick={() => setFlipped(!flipped)} className="w-full perspective">
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
                  </div>
                  <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border border-primary-100 bg-white p-8 shadow-lg">
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary-400">Definition</p>
                      <p className="text-xl font-semibold text-primary-900 whitespace-pre-wrap"><MathText text={engine.currentCard?.definition ?? ""} /></p>
                    </div>
                    {engine.currentCard && (
                      <div className="absolute bottom-4 right-4">
                        <SpeakerButton text={engine.currentCard.definition} lang="en-US" />
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {!flipped ? (
                <div className="mt-8">
                  <Button variant="secondary" className="w-full" onClick={() => setFlipped(true)}>
                    <ChevronRight className="h-4 w-4" /> Lật thẻ
                  </Button>
                </div>
              ) : (
                <div className="mt-8 grid grid-cols-4 gap-2">
                  <button onClick={() => handleNextFlashcard(0)} className="rounded-xl border-2 border-red-200 bg-red-50 p-2 text-red-600 font-bold hover:bg-red-100">Quên</button>
                  <button onClick={() => handleNextFlashcard(1)} className="rounded-xl border-2 border-orange-200 bg-orange-50 p-2 text-orange-600 font-bold hover:bg-orange-100">Khó</button>
                  <button onClick={() => handleNextFlashcard(2)} className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-2 text-emerald-600 font-bold hover:bg-emerald-100">Tốt</button>
                  <button onClick={() => handleNextFlashcard(3)} className="rounded-xl border-2 border-blue-200 bg-blue-50 p-2 text-blue-600 font-bold hover:bg-blue-100">Dễ</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
