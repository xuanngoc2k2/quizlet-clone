"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/Button"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { updateSetProgress, filterCardsByRemembered } from "@/lib/local-storage"
import { shuffleArray } from "@/lib/utils"
import { CheckCircle2, XCircle, Sparkles, RotateCw } from "lucide-react"

function generateQuestions(cards: { id: string; term: string; definition: string }[], count = 10) {
  const shuffled = shuffleArray(cards).slice(0, count)
  return shuffled.map((card) => {
    const others = cards.filter((c) => c.id !== card.id).map((c) => c.definition)
    const wrongAnswers = shuffleArray(others).slice(0, 3)
    while (wrongAnswers.length < 3) {
      wrongAnswers.push("(no other options)")
    }
    const options = shuffleArray([card.definition, ...wrongAnswers])
    return {
      cardId: card.id,
      prompt: card.term,
      correctAnswer: card.definition,
      options,
    }
  })
}

export default function QuizPage() {
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
  const cardItems = useMemo(
    () => filterCardsByRemembered(set?.cards ?? [], cardProgress, rememberedFilter),
    [set?.cards, cardProgress, rememberedFilter],
  )
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [incorrect, setIncorrect] = useState(0)
  const [finished, setFinished] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const questions = useMemo(() => generateQuestions(cardItems), [cardItems])

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleSelect = useCallback((option: string) => {
    if (selected) return
    setSelected(option)
    const isCorrect = option === questions[currentQ].correctAnswer
    if (isCorrect) {
      setCorrect((p) => p + 1)
      incrementMutation.mutate({ setId: id, cardId: questions[currentQ].cardId })
    } else {
      setIncorrect((p) => p + 1)
    }
  }, [selected, currentQ, questions, id, incrementMutation])

  function handleNext() {
    if (currentQ + 1 >= questions.length) {
      setFinished(true)
      if (timerRef.current) clearInterval(timerRef.current)
      updateSetProgress(id, "quiz", {
        correct,
        incorrect,
        completedCards: questions.map((q) => q.cardId),
        timeSpent: elapsed,
        step: questions.length,
      })
    } else {
      setCurrentQ((p) => p + 1)
      setSelected(null)
    }
  }

  if (cardItems.length === 0) {
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

  if (finished) {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-24">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-500 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold text-primary-900">Quiz Complete!</h2>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-lg font-bold">{correct}</span>
            </span>
            <span className="text-primary-300">/</span>
            <span className="flex items-center gap-1.5 text-red-500">
              <XCircle className="h-5 w-5" />
              <span className="text-lg font-bold">{incorrect}</span>
            </span>
          </div>
          <p className="mt-2 text-sm text-primary-400">
            Time: {Math.floor(elapsed / 60)}m {elapsed % 60}s
          </p>
          <div className="mt-8 flex gap-3">
            <Button onClick={() => { setCurrentQ(0); setCorrect(0); setIncorrect(0); setFinished(false); setSelected(null); setElapsed(0) }} variant="secondary">
              <RotateCw className="h-4 w-4" />
              Retry
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

  const q = questions[currentQ]

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <div className="mb-4 text-center text-xs font-medium text-primary-400">
          {currentQ + 1} / {questions.length}
        </div>

        <div className="mb-6 rounded-2xl border border-primary-100 bg-white p-8 text-center shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary-400">Term</p>
          <p className="text-xl font-semibold text-primary-900">{q.prompt}</p>
          <p className="mt-2 text-xs text-primary-400">Choose the correct definition</p>
        </div>

        <div className="flex flex-col gap-3">
          {q.options.map((option, i) => {
            let style = "border-primary-100 bg-white hover:border-primary-300 hover:shadow-sm"
            if (selected) {
              if (option === q.correctAnswer) style = "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
              else if (option === selected) style = "border-red-400 bg-red-50 ring-2 ring-red-500/20"
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(option)}
                className={`w-full rounded-xl border p-4 text-left text-sm transition-all duration-200 ${style} touch-target`}
              >
                {option}
              </button>
            )
          })}
        </div>

        {selected && (
          <Button onClick={handleNext} variant="gradient" className="mt-6 w-full">
            {currentQ + 1 >= questions.length ? "See Results" : "Next"}
          </Button>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
