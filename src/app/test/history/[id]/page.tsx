"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/Button"
import { Loader2, Clock, RotateCw, ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react"

export default function TestHistoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data, isLoading, error } = api.testHistory.get.useQuery({ id })
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex-1 px-4 pb-24 pt-4">
          <div className="flex flex-col items-center py-16">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary-400" />
            <p className="text-sm text-primary-500">Đang tải...</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex-1 px-4 pb-24 pt-4">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error?.message || "Không tìm thấy bài test"}
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  const sections = data.sections as { name: string; instruction: string; questions: { id: number; question: string; type: string }[] }[] | null
  const totalQuestions = sections?.reduce((sum, s) => sum + s.questions.length, 0) ?? 0

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <button
          onClick={() => router.push("/test/history")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          &larr; Back
        </button>

        <div className="mb-6">
          <h1 className="font-display text-xl font-bold text-primary-900">{data.title}</h1>
          <p className="mt-1 text-sm text-primary-500">{data.description}</p>
          <p className="mt-1 text-xs text-primary-400">{totalQuestions} câu • {data.attempts.length} lần làm</p>
          <Button
            onClick={() => router.push(`/test?retake=${id}`)}
            variant="gradient"
            size="sm"
            className="mt-3"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Làm lại
          </Button>
        </div>

        {data.attempts.length === 0 && (
          <div className="rounded-xl border border-primary-100 bg-white p-6 text-center text-sm text-primary-500">
            Chưa có lần làm nào
          </div>
        )}

        <div className="flex flex-col gap-3">
          {data.attempts.map((attempt) => {
            const results = attempt.results as { questionId: number; isCorrect: boolean; score?: number; userAnswer: string; correctAnswer: string; explanation: string }[]
            const correctCount = results.filter((r) => r.isCorrect).length
            const totalCount = results.length
            const percent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
            const isExpanded = expandedAttempt === attempt.id

            return (
              <div
                key={attempt.id}
                className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-sm"
              >
                <button
                  onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary-400" />
                      <span className="text-xs text-primary-500">
                        {new Date(attempt.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-primary-900">{correctCount}/{totalCount}</span>
                      <span className={`text-xs font-medium ${
                        percent >= 70 ? "text-emerald-600" : percent >= 40 ? "text-amber-600" : "text-red-600"
                      }`}>
                        ({percent}%)
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-primary-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-primary-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-primary-100">
                    {sections?.map((section, si) => {
                      const partNum = si + 1
                      const partResults = results.filter((r) => {
                        const q = section.questions.find((sq) => sq.id === r.questionId)
                        return q
                      })
                      if (partResults.length === 0) return null
                      return (
                        <div key={si} className="divide-y divide-primary-50">
                          <div className="bg-primary-50/50 px-4 py-2">
                            <p className="text-[11px] font-bold text-primary-600">{section.name}</p>
                          </div>
                          {partResults.map((r) => {
                            const q = section.questions.find((sq) => sq.id === r.questionId)
                            if (!q) return null
                            return (
                              <div key={r.questionId} className="px-4 py-3">
                                <div className="mb-1 flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-primary-400">Q{r.questionId}.</span>
                                  {r.isCorrect ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                                  )}
                                </div>
                                <p className="mb-1 text-xs font-medium text-primary-900">{q.question}</p>
                                <div className="flex flex-col gap-0.5 text-[11px]">
                                  <p>
                                    <span className="font-medium text-primary-600">Bạn: </span>
                                    <span className={r.isCorrect ? "text-emerald-600" : "text-red-500"}>
                                      {r.userAnswer || "(empty)"}
                                    </span>
                                  </p>
                                  {!r.isCorrect && (
                                    <p>
                                      <span className="font-medium text-emerald-600">Đúng: </span>
                                      <span className="text-emerald-700">{r.correctAnswer}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
