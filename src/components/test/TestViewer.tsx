"use client"

import { useState } from "react"
import { api } from "@/lib/trpc-provider"
import { Button } from "@/components/ui/Button"
import { CheckCircle2, XCircle, Sparkles, RotateCw, Loader2 } from "lucide-react"

type Question = {
  id: number
  type: "multiple-choice" | "conjugation" | "synonym" | "translation"
  part: number
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
}

type Section = {
  name: string
  instruction: string
  questions: Question[]
}

type TestData = {
  title: string
  description: string
  sections: Section[]
}

type GradeResult = {
  results: {
    questionId: number
    isCorrect: boolean
    userAnswer: string
    correctAnswer: string
    explanation: string
  }[]
  totalCorrect: number
  totalQuestions: number
}

export function TestViewer({ test, onReset }: { test: TestData; onReset: () => void }) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showExplanations, setShowExplanations] = useState(false)
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)
  const grade = api.test.grade.useMutation()

  const allQuestions = test.sections.flatMap((s) => s.questions)

  const sectionColors: Record<number, string> = {
    1: "bg-blue-50 border-blue-200",
    2: "bg-emerald-50 border-emerald-200",
    3: "bg-violet-50 border-violet-200",
    4: "bg-amber-50 border-amber-200",
  }

  const sectionAccent: Record<number, string> = {
    1: "text-blue-600 bg-blue-100",
    2: "text-emerald-600 bg-emerald-100",
    3: "text-violet-600 bg-violet-100",
    4: "text-amber-600 bg-amber-100",
  }

  function setAnswer(qId: number, value: string) {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  async function handleSubmit() {
    try {
      const result = await grade.mutateAsync({
        questions: allQuestions,
        answers,
      })
      setGradeResult(result)
      setSubmitted(true)
    } catch {
      // error displayed via grade.error
    }
  }

  if (grade.isLoading) {
    return (
      <div className="flex flex-col items-center py-16">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary-400" />
        <p className="text-lg font-medium text-primary-600">AI is grading...</p>
        <p className="mt-1 text-sm text-primary-400">
          Analyzing your answers and preparing feedback
        </p>
      </div>
    )
  }

  if (grade.error) {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {grade.error.message}
        </div>
        <Button onClick={onReset} variant="secondary" className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  if (!submitted) {
    return (
      <div>
        <div className="mb-6 text-center">
          <h2 className="font-display text-xl font-bold text-primary-900">{test.title}</h2>
          <p className="mt-1 text-sm text-primary-500">{test.description}</p>
          <p className="mt-1 text-xs text-primary-400">{allQuestions.length} questions</p>
        </div>

        {test.sections.map((section) => (
          <div key={section.name} className="mb-8">
            <div className={`mb-4 rounded-xl border p-4 ${sectionColors[section.questions[0]?.part ?? 1]}`}>
              <h3 className="font-display text-base font-bold text-primary-900">{section.name}</h3>
              <p className="mt-0.5 text-xs text-primary-500">{section.instruction}</p>
              <p className="mt-0.5 text-xs text-primary-400">{section.questions.length} questions</p>
            </div>

            <div className="flex flex-col gap-4">
              {section.questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-primary-400">Q{q.id}.</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sectionAccent[q.part]}`}>
                      Phần {q.part}
                    </span>
                  </div>
                  <p className="mb-3 whitespace-pre-wrap text-sm font-medium text-primary-900">
                    {q.question}
                  </p>

                  {(q.type === "multiple-choice" || q.type === "synonym") && q.options ? (
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
                  ) : q.type === "conjugation" ? (
                    <input
                      placeholder="Type answer..."
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      className="w-full rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                    />
                  ) : q.type === "translation" ? (
                    <textarea
                      placeholder="Viết câu tiếng Hàn..."
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6">
          <Button
            variant="gradient"
            className="w-full"
            onClick={handleSubmit}
            disabled={grade.isLoading}
          >
            Submit Answers
          </Button>
        </div>
      </div>
    )
  }

  if (!showExplanations) {
    const score = Math.round((gradeResult!.totalCorrect / gradeResult!.totalQuestions) * 100)
    return (
      <div className="flex flex-col items-center py-8">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-500 shadow-lg">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h2 className="font-display text-2xl font-bold text-primary-900">Test Complete!</h2>
        <div className="mt-4 text-center">
          <span className="text-4xl font-bold text-primary-900">{gradeResult!.totalCorrect}</span>
          <span className="text-2xl text-primary-400">/{gradeResult!.totalQuestions}</span>
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

  const sectionNames: Record<number, string> = {
    1: "Phần 1: Trắc nghiệm khách quan",
    2: "Phần 2: Chia dạng từ",
    3: "Phần 3: Tìm câu đồng nghĩa",
    4: "Phần 4: Dịch câu",
  }

  const groupedResults: Record<number, GradeResult["results"]> = { 1: [], 2: [], 3: [], 4: [] }
  const questionsByPart: Record<number, Question> = {}
  allQuestions.forEach((q) => {
    questionsByPart[q.id] = q
  })
  for (const r of gradeResult!.results) {
    const part = questionsByPart[r.questionId]?.part ?? 1
    if (!groupedResults[part]) groupedResults[part] = []
    groupedResults[part].push(r)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-primary-900">Review</h2>
        <Button onClick={() => setShowExplanations(false)} variant="secondary" size="sm">
          Back
        </Button>
      </div>

      {[1, 2, 3, 4].map((part) => {
        const partResults = groupedResults[part]
        if (!partResults || partResults.length === 0) return null
        return (
          <div key={part} className="mb-8">
            <div className={`mb-4 rounded-xl border p-3 ${sectionColors[part]}`}>
              <h3 className="font-display text-sm font-bold text-primary-900">{sectionNames[part]}</h3>
            </div>

            <div className="flex flex-col gap-4">
              {partResults.map((r) => {
                const q = questionsByPart[r.questionId]
                if (!q) return null
                const isPart4 = q.part === 4
                if (isPart4) {
                  const sections = r.explanation.split(/\[오답 분석\]|\[문법 구조\]|\[어휘\]|\[모범 답안\]|\[학습 팁\]/).filter(Boolean)
                  const labels = ["오답 분석", "문법 구조", "어휘", "모범 답안", "학습 팁"]
                  const parts: { label: string; content: string }[] = []
                  let idx = 0
                  labels.forEach((label) => {
                    const regex = new RegExp(`\\[${label}\\]`)
                    const match = r.explanation.match(regex)
                    if (match) {
                      const startIdx = match.index! + match[0].length
                      const nextLabel = labels.slice(labels.indexOf(label) + 1).find((l) => {
                        const nr = new RegExp(`\\[${l}\\]`).exec(r.explanation)
                        return nr
                      })
                      const endIdx = nextLabel
                        ? new RegExp(`\\[${nextLabel}\\]`).exec(r.explanation)!.index!
                        : r.explanation.length
                      const content = r.explanation.slice(startIdx, endIdx).trim()
                      parts.push({ label, content })
                    }
                  })
                  return (
                    <div
                      key={r.questionId}
                      className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm"
                    >
                      <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-500">Q{r.questionId}.</span>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Phần 4
                          </span>
                          {r.isCorrect ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-amber-900">{q.question}</p>
                        <div className="mt-3 flex flex-col gap-1 text-xs">
                          <p>
                            <span className="font-medium text-red-600">Đáp án của bạn: </span>
                            <span className="text-red-500">{r.userAnswer || "(Để trống)"}</span>
                          </p>
                          <p>
                            <span className="font-medium text-emerald-600">Câu mẫu: </span>
                            <span className="text-emerald-700">{r.correctAnswer}</span>
                          </p>
                        </div>
                      </div>
                      <div className="divide-y divide-amber-100">
                        {parts.map((p) => (
                          <div key={p.label} className="px-4 py-3">
                            <p className="mb-1 text-[11px] font-bold text-amber-700">{p.label}</p>
                            <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-primary-700">
                              {p.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }
                return (
                  <div
                    key={r.questionId}
                    className={`rounded-2xl border p-4 shadow-sm ${
                      r.isCorrect
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-red-200 bg-red-50/50"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs font-bold text-primary-400">Q{r.questionId}.</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sectionAccent[q.part]}`}>
                        Phần {q.part}
                      </span>
                      {r.isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <p className="mb-2 whitespace-pre-wrap text-sm font-medium text-primary-900">{q.question}</p>
                    <div className="flex flex-col gap-1 text-xs">
                      {!r.isCorrect && (
                        <p>
                          <span className="font-medium text-red-600">Your answer: </span>
                          <span className="text-red-500">{r.userAnswer || "(empty)"}</span>
                        </p>
                      )}
                      <p>
                        <span className="font-medium text-emerald-600">Correct: </span>
                        <span className="text-emerald-700">{r.correctAnswer}</span>
                      </p>
                      <p className="mt-1 rounded-lg bg-primary-50 px-3 py-2 text-primary-600">
                        {r.explanation}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="mt-6">
        <Button onClick={onReset} variant="gradient" className="w-full">
          <RotateCw className="h-4 w-4" />
          New Test
        </Button>
      </div>
    </div>
  )
}
