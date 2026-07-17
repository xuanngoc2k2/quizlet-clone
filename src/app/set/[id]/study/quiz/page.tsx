"use client"

import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/Button"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { updateSetProgress } from "@/lib/local-storage"
import { shuffleArray } from "@/lib/utils"

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
  const { data: set } = api.sets.getById.useQuery({ id })
  const cardItems = useMemo(() => set?.cards ?? [], [set?.cards])
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
    if (isCorrect) setCorrect((p) => p + 1)
    else setIncorrect((p) => p + 1)
  }, [selected, currentQ, questions])

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
          <p className="text-gray-500">No cards in this set</p>
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
          <h2 className="mb-2 text-2xl font-bold">Quiz Complete!</h2>
          <p className="mb-1 text-gray-600">
            {correct} / {questions.length} correct
          </p>
          <p className="mb-8 text-sm text-gray-400">
            Time: {Math.floor(elapsed / 60)}m {elapsed % 60}s
          </p>
          <div className="flex gap-3">
            <Button onClick={() => { setCurrentQ(0); setCorrect(0); setIncorrect(0); setFinished(false); setSelected(null); setElapsed(0) }} variant="secondary">
              Retry
            </Button>
            <Button onClick={() => router.push(`/set/${id}`)}>Back to Set</Button>
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
        <div className="mb-4 text-center text-xs text-gray-400">
          {currentQ + 1} / {questions.length}
        </div>

        <div className="mb-6 rounded-2xl border bg-white p-8 text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Term</p>
          <p className="text-xl font-semibold">{q.prompt}</p>
          <p className="mt-2 text-xs text-gray-400">Choose the correct definition</p>
        </div>

        <div className="flex flex-col gap-3">
          {q.options.map((option, i) => {
            let style = "border-gray-200 bg-white"
            if (selected) {
              if (option === q.correctAnswer) style = "border-green-500 bg-green-50"
              else if (option === selected) style = "border-red-500 bg-red-50"
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(option)}
                className={`w-full rounded-xl border p-4 text-left text-sm transition-all ${style} touch-target`}
              >
                {option}
              </button>
            )
          })}
        </div>

        {selected && (
          <Button onClick={handleNext} className="mt-6 w-full">
            {currentQ + 1 >= questions.length ? "See Results" : "Next"}
          </Button>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
