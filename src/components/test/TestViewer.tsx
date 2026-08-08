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
  grammarHint?: string
  correctAnswer: string
  explanation: string
  difficulty?: string
  meaningVi?: string
  optionExplanations?: string[]
  itemId?: string
  itemType?: "vocabulary" | "grammar"
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
    score?: number
    userAnswer: string
    correctAnswer: string
    explanation: string
  }[]
  totalCorrect: number
  totalQuestions: number
}

export function TestViewer({ test, testHistoryId, onReset, setId }: { test: TestData; testHistoryId?: string; onReset: () => void; setId?: string }) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showExplanations, setShowExplanations] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong">("all")
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)
  const grade = api.test.grade.useMutation()
  const saveAttempt = api.testHistory.saveAttempt.useMutation()
  const weakItems = api.setTest.getWeakItems.useQuery(
    { setId: setId! },
    { enabled: !!setId && submitted },
  )

  const allQuestions = test.sections.flatMap((s) => s.questions)

  const questionsByPart: Record<number, Question> = {}
  allQuestions.forEach((q) => {
    questionsByPart[q.id] = q
  })

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

  function isCorrectForResult(r: GradeResult["results"][number]): boolean {
    return r.isCorrect || (r.score !== undefined && r.score >= 5)
  }

  const wrongCount = gradeResult ? gradeResult.results.filter((r) => !isCorrectForResult(r)).length : 0

  function buildBreakdown() {
    const part: Record<number, { c: number; t: number }> = { 1: { c: 0, t: 0 }, 2: { c: 0, t: 0 }, 3: { c: 0, t: 0 }, 4: { c: 0, t: 0 } }
    const type: Record<"vocabulary" | "grammar", { c: number; t: number }> = {
      vocabulary: { c: 0, t: 0 },
      grammar: { c: 0, t: 0 },
    }
    for (const r of gradeResult!.results) {
      const q = questionsByPart[r.questionId]
      const p = q?.part ?? 1
      part[p].t++
      if (isCorrectForResult(r)) part[p].c++
      const t = q?.itemType ?? "vocabulary"
      type[t].t++
      if (isCorrectForResult(r)) type[t].c++
    }
    return { part, type }
  }

  async function handleSubmit() {
    try {
      const result = await grade.mutateAsync({
        questions: allQuestions,
        answers,
      })
      setGradeResult(result)
      setSubmitted(true)
      if (testHistoryId) {
        saveAttempt.mutate({
          testHistoryId,
          answers,
          results: result.results,
          totalCorrect: result.totalCorrect,
          totalQuestions: result.totalQuestions,
        })
      }
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
        <Button onClick={() => grade.reset()} variant="secondary" className="mt-4">
          Thử lại
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
                    <div>
                      <textarea
                        placeholder="Viết câu tiếng Hàn..."
                        value={answers[q.id] ?? ""}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                      />
                      {q.grammarHint && (
                        <details className="mt-2 group">
                          <summary className="cursor-pointer text-xs font-medium text-amber-600 hover:text-amber-700 select-none">
                            <span className="group-open:hidden">Xem gợi ý ngữ pháp</span>
                            <span className="hidden group-open:inline">Ẩn gợi ý ngữ pháp</span>
                          </summary>
                          <p className="mt-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            {q.grammarHint}
                          </p>
                        </details>
                      )}
                    </div>
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

        <div className="mt-6 w-full max-w-sm">
          <BreakdownCard breakdown={buildBreakdown()} />
        </div>

        {setId && weakItems.data && weakItems.data.items.length > 0 && (
          <div className="mt-4 w-full max-w-sm">
            <WeakItemsPanel items={weakItems.data.items} />
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={onReset} variant="secondary">
            <RotateCw className="h-4 w-4" />
            New Test
          </Button>
          <Button
            onClick={() => { setReviewFilter("wrong"); setShowExplanations(true) }}
            variant="secondary"
            disabled={!wrongCount}
          >
            Ôn câu sai ({wrongCount})
          </Button>
          <Button onClick={() => { setReviewFilter("all"); setShowExplanations(true) }} variant="gradient">
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
    4: "Phần 4: Viết (Dịch Việt→Hàn)",
  }

  const groupedResults: Record<number, GradeResult["results"]> = { 1: [], 2: [], 3: [], 4: [] }
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

      <div className="mb-4 inline-flex rounded-xl bg-primary-50 p-1">
        <button
          onClick={() => setReviewFilter("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            reviewFilter === "all" ? "bg-white text-primary-900 shadow-sm" : "text-primary-400 hover:text-primary-600"
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setReviewFilter("wrong")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            reviewFilter === "wrong" ? "bg-white text-red-600 shadow-sm" : "text-primary-400 hover:text-red-500"
          }`}
        >
          Chỉ câu sai ({wrongCount})
        </button>
      </div>

      {[1, 2, 3, 4].map((part) => {
        const rawResults = groupedResults[part] ?? []
        const partResults = reviewFilter === "wrong" ? rawResults.filter((r) => !isCorrectForResult(r)) : rawResults
        if (partResults.length === 0) return null
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
                  const isFirst = r.questionId === partResults[0]?.questionId
                  if (!isFirst) return null
                  const totalScore = partResults.reduce((sum, pr) => sum + (pr.score ?? 0), 0)
                  const maxScore = partResults.length * 10
                  const avgColor = (totalScore / maxScore) >= 0.7
                    ? "text-emerald-600"
                    : (totalScore / maxScore) >= 0.4
                    ? "text-amber-600"
                    : "text-red-600"
                  const firstExplanation = partResults[0]?.explanation || ""
                  const otherExplanations = partResults.slice(1).map((pr) => pr.explanation || "").filter(Boolean)
                  const combinedExplanation = [firstExplanation, ...otherExplanations].filter(Boolean).join("\n\n---\n\n")
                  return (
                    <div key="part4" className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                      <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Phần 4</span>
                            <span className="text-xs text-amber-500">5 câu</span>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${avgColor} bg-amber-50`}>
                            {totalScore}/{maxScore}
                          </span>
                        </div>
                      </div>
                      <div className="divide-y divide-amber-100">
                        <div className="p-4">
                          <p className="mb-3 text-[11px] font-bold text-amber-700">Câu hỏi & Câu trả lời</p>
                          <div className="flex flex-col gap-3">
                            {partResults.map((pr) => {
                              const pq = questionsByPart[pr.questionId]
                              if (!pq) return null
                              return (
                                <div key={pr.questionId} className="rounded-lg border border-amber-100 bg-amber-50/30 px-3 py-2">
                                  <div className="mb-1 flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-amber-600">Q{pr.questionId}.</span>
                                    {pr.score !== undefined && (
                                      <span className={`ml-auto text-[10px] font-bold ${
                                        pr.score >= 8 ? "text-emerald-600" : pr.score >= 5 ? "text-amber-600" : "text-red-600"
                                      }`}>
                                        {pr.score}/10
                                      </span>
                                    )}
                                  </div>
                                  <p className="mb-1 text-xs font-medium text-primary-900">{pq.question}</p>
                                  <p className="text-xs text-primary-600">
                                    <span className="font-medium">Bạn: </span>
                                    <span className={pr.userAnswer ? "text-primary-700" : "text-red-400 italic"}>
                                      {pr.userAnswer || "(Để trống)"}
                                    </span>
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        {combinedExplanation && (
                          <div className="p-4">
                            <p className="mb-2 text-[11px] font-bold text-amber-700">Chấm điểm & Nhận xét</p>
                            <div className="rounded-lg bg-amber-50/50 px-3 py-2">
                              <p className="whitespace-pre-wrap text-xs leading-relaxed text-primary-700">
                                {combinedExplanation}
                              </p>
                            </div>
                          </div>
                        )}
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
                      <p>
                        <span className="font-medium text-primary-600">Your answer: </span>
                        <span className={r.isCorrect ? "text-emerald-600" : "text-red-500"}>
                          {r.userAnswer || "(empty)"}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium text-emerald-600">Correct: </span>
                        <span className="text-emerald-700">{r.correctAnswer}</span>
                      </p>
                      <p className="mt-1 rounded-lg bg-primary-50 px-3 py-2 text-primary-600">
                        {r.explanation}
                      </p>
                      {q.meaningVi && (
                        <div className="mt-2 rounded-lg bg-indigo-50 px-3 py-2">
                          <p className="text-[11px] font-bold text-indigo-600">Nghĩa tiếng Việt</p>
                          <p className="text-xs text-primary-700">{q.meaningVi}</p>
                        </div>
                      )}
                      {q.optionExplanations && q.options && (
                        <div className="mt-2 rounded-lg bg-primary-50/70 px-3 py-2">
                          <p className="text-[11px] font-bold text-primary-600">Các đáp án</p>
                          <ul className="mt-1 flex flex-col gap-1 text-xs text-primary-600">
                            {q.options.map((opt, i) => (
                              <li key={i} className="flex flex-wrap items-baseline gap-x-1.5">
                                <span className={opt === r.correctAnswer ? "font-bold text-emerald-600" : ""}>{opt}</span>
                                {q.optionExplanations![i] && (
                                  <span className="text-primary-400">— {q.optionExplanations![i]}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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

function WeakItemsPanel({ items }: { items: { itemId: string; term: string; definition: string; type: "vocabulary" | "grammar"; timesSeen: number; timesCorrect: number; correctRate: number }[] }) {
  const weak = items.filter((it) => it.correctRate < 0.7).slice(0, 10)
  if (weak.length === 0) return null
  return (
    <div className="rounded-2xl border border-red-100 bg-white p-4 text-left shadow-sm">
      <p className="mb-3 text-xs font-bold text-red-600">⚠ Những mục cần ôn lại</p>
      <div className="flex flex-col gap-1.5">
        {weak.map((it) => (
          <div key={it.itemId} className="flex items-center justify-between gap-2 rounded-lg bg-red-50/60 px-3 py-1.5">
            <span className={`text-xs font-medium text-primary-900 ${it.type === "grammar" ? "text-amber-700" : ""}`}>
              {it.term}
            </span>
            <span className="text-[10px] font-bold text-red-500">
              {it.timesCorrect}/{it.timesSeen} ({Math.round(it.correctRate * 100)}%)
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-primary-400">Tổng hợp từ các lần làm đề trước của Set này.</p>
    </div>
  )
}

function BreakdownCard({ breakdown }: { breakdown: { part: Record<number, { c: number; t: number }>; type: Record<"vocabulary" | "grammar", { c: number; t: number }> } }) {
  const partLabels: Record<number, string> = {
    1: "Phần 1 · Chọn đáp án",
    2: "Phần 2 · Chia từ",
    3: "Phần 3 · Đồng nghĩa",
    4: "Phần 4 · Dịch",
  }
  return (
    <div className="rounded-2xl border border-primary-100 bg-white p-4 text-left shadow-sm">
      <p className="mb-3 text-xs font-bold text-primary-700">Phân tích kết quả</p>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((p) => {
          const b = breakdown.part[p]
          if (!b || b.t === 0) return null
          const pct = Math.round((b.c / b.t) * 100)
          const color = pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-red-600"
          return (
            <div key={p} className="rounded-xl bg-primary-50 px-3 py-2">
              <p className="text-[10px] text-primary-500">{partLabels[p]}</p>
              <p className="text-sm font-bold text-primary-900">
                {b.c}/{b.t} <span className={`text-xs font-medium ${color}`}>{pct}%</span>
              </p>
            </div>
          )
        })}
        {(["vocabulary", "grammar"] as const).map((t) => {
          const b = breakdown.type[t]
          if (!b || b.t === 0) return null
          const pct = Math.round((b.c / b.t) * 100)
          const color = pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-red-600"
          return (
            <div key={t} className="rounded-xl bg-primary-50 px-3 py-2">
              <p className="text-[10px] text-primary-500">{t === "vocabulary" ? "Từ vựng" : "Ngữ pháp"}</p>
              <p className="text-sm font-bold text-primary-900">
                {b.c}/{b.t} <span className={`text-xs font-medium ${color}`}>{pct}%</span>
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
