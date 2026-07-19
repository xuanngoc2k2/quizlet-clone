"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/Button"
import { CheckCircle2, XCircle, Sparkles, RotateCw } from "lucide-react"

type Question = {
  id: number
  type: "multiple-choice" | "conjugation" | "synonym" | "translation"
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
}

type TestData = {
  title: string
  description: string
  questions: Question[]
}

export function TestViewer({ test, onReset }: { test: TestData; onReset: () => void }) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showExplanations, setShowExplanations] = useState(false)

  const typeLabels: Record<string, string> = {
    "multiple-choice": "Trắc nghiệm",
    conjugation: "Chia động từ",
    synonym: "Đồng nghĩa",
    translation: "Dịch thuật",
  }

  const typeColors: Record<string, string> = {
    "multiple-choice": "bg-blue-100 text-blue-700",
    conjugation: "bg-emerald-100 text-emerald-700",
    synonym: "bg-violet-100 text-violet-700",
    translation: "bg-amber-100 text-amber-700",
  }

  function setAnswer(qId: number, value: string) {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  const results = useMemo(() => {
    if (!submitted) return null
    let correct = 0
    const details = test.questions.map((q) => {
      const userAns = answers[q.id]?.trim() ?? ""
      const isCorrect = userAns.toLowerCase() === q.correctAnswer.toLowerCase()
      if (isCorrect) correct++
      return { ...q, userAnswer: userAns, isCorrect }
    })
    return { correct, total: test.questions.length, details }
  }, [submitted, answers, test.questions])

  if (!submitted) {
    return (
      <div>
        <div className="mb-6 text-center">
          <h2 className="font-display text-xl font-bold text-primary-900">{test.title}</h2>
          <p className="mt-1 text-sm text-primary-500">{test.description}</p>
          <p className="mt-1 text-xs text-primary-400">{test.questions.length} questions</p>
        </div>

        <div className="flex flex-col gap-4">
          {test.questions.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-bold text-primary-400">Q{q.id}.</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeColors[q.type]}`}>
                  {typeLabels[q.type]}
                </span>
              </div>
              <p className="mb-3 whitespace-pre-wrap text-sm font-medium text-primary-900">
                {q.question}
              </p>

              {q.type === "multiple-choice" && q.options ? (
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswer(q.id, opt)}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                        answers[q.id] === opt
                          ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500/20 text-primary-900"
                          : "border-primary-100 bg-white text-primary-600 hover:border-primary-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  placeholder={q.type === "translation" ? "Type translation..." : "Type answer..."}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="w-full rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button
            variant="gradient"
            className="w-full"
            onClick={() => setSubmitted(true)}
          >
            Submit Answers
          </Button>
        </div>
      </div>
    )
  }

  if (submitted && !showExplanations) {
    const score = results ? Math.round((results.correct / results.total) * 100) : 0
    return (
      <div className="flex flex-col items-center py-8">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-500 shadow-lg">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h2 className="font-display text-2xl font-bold text-primary-900">Test Complete!</h2>
        <div className="mt-4 text-center">
          <span className="text-4xl font-bold text-primary-900">{results?.correct}</span>
          <span className="text-2xl text-primary-400">/{results?.total}</span>
        </div>
        <p className="mt-2 text-sm text-primary-500">{score}% correct</p>
        <div className="mt-8 flex gap-3">
          <Button onClick={onReset} variant="secondary">
            <RotateCw className="h-4 w-4" />
            New Test
          </Button>
          <Button onClick={() => setShowExplanations(true)} variant="gradient">
            Review Answers
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-primary-900">Review</h2>
        <Button onClick={() => setShowExplanations(false)} variant="secondary" size="sm">
          Back
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {results?.details.map((q) => (
          <div
            key={q.id}
            className={`rounded-2xl border p-4 shadow-sm ${
              q.isCorrect
                ? "border-emerald-200 bg-emerald-50/50"
                : "border-red-200 bg-red-50/50"
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-bold text-primary-400">Q{q.id}.</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeColors[q.type]}`}>
                {typeLabels[q.type]}
              </span>
              {q.isCorrect ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="mb-2 whitespace-pre-wrap text-sm font-medium text-primary-900">{q.question}</p>
            <div className="flex flex-col gap-1 text-xs">
              {!q.isCorrect && (
                <p>
                  <span className="font-medium text-red-600">Your answer: </span>
                  <span className="text-red-500">{q.userAnswer || "(empty)"}</span>
                </p>
              )}
              <p>
                <span className="font-medium text-emerald-600">Correct: </span>
                <span className="text-emerald-700">{q.correctAnswer}</span>
              </p>
              <p className="mt-1 rounded-lg bg-primary-50 px-3 py-2 text-primary-600">
                {q.explanation}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button onClick={onReset} variant="gradient" className="w-full">
          <RotateCw className="h-4 w-4" />
          New Test
        </Button>
      </div>
    </div>
  )
}
