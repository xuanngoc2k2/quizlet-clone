"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/Button"
import { TestViewer } from "@/components/test/TestViewer"
import { SetTestGenerator } from "@/components/test/SetTestGenerator"
import { isAnswerWrong } from "@/lib/test-results"
import { Sparkles, Loader2, BookOpen, PenTool, BookMarked, Languages, Wand2, X, Clock } from "lucide-react"

function TestContent() {
  const searchParams = useSearchParams()
  const retakeId = searchParams.get("retake")
  const retakeAttemptId = searchParams.get("attemptId")
  const presetMode = searchParams.get("mode")
  const presetSetId = searchParams.get("setId") ?? undefined

  const [mode, setMode] = useState<"prompt" | "set">(presetMode === "set" ? "set" : "prompt")
  const [prompt, setPrompt] = useState("")
  const [refinedPrompt, setRefinedPrompt] = useState<string | null>(null)
  const [editingPrompt, setEditingPrompt] = useState("")
  const [testData, setTestData] = useState<unknown>(null)
  const [testHistoryId, setTestHistoryId] = useState<string | null>(null)
  const generate = api.test.generate.useMutation()
  const refine = api.test.refinePrompt.useMutation()
  const saveHistory = api.testHistory.save.useMutation()

  const [localRetakeId, setLocalRetakeId] = useState<string | null>(null)
  const [localAttemptId, setLocalAttemptId] = useState<string | null>(null)
  useEffect(() => {
    if (retakeId) setLocalRetakeId(retakeId)
  }, [retakeId])

  useEffect(() => {
    if (retakeAttemptId) setLocalAttemptId(retakeAttemptId)
  }, [retakeAttemptId])

  const { data: retakeData } = api.testHistory.get.useQuery(
    { id: localRetakeId! },
    { enabled: !!localRetakeId },
  )

  useEffect(() => {
    if (retakeData) {
      const sections = retakeData.sections as unknown as { name: string; instruction: string; questions: { id: number; type: string; question: string; options?: string[]; correctAnswer: string; explanation: string }[] }[]
      if (localAttemptId) {
        const attempt = retakeData.attempts.find((a) => a.id === localAttemptId)
        const wrongIds = new Set(
          (attempt?.results as { questionId: number; isCorrect: boolean; score?: number }[] | undefined)
            ?.filter((r) => isAnswerWrong(r))
            .map((r) => r.questionId) ?? [],
        )
        const filteredSections = sections
          .map((s) => ({ ...s, questions: s.questions.filter((q) => wrongIds.has(q.id)) }))
          .filter((s) => s.questions.length > 0)
        if (filteredSections.length > 0) {
          setTestData({
            title: retakeData.title,
            description: retakeData.description,
            sections: filteredSections,
          })
          setTestHistoryId(localRetakeId)
          return
        }
      }
      setTestData({
        title: retakeData.title,
        description: retakeData.description,
        sections,
      })
      setTestHistoryId(localRetakeId)
    }
  }, [retakeData, localRetakeId, localAttemptId])

  async function handleRefine() {
    if (!prompt.trim()) return
    try {
      const result = await refine.mutateAsync({ prompt: prompt.trim() })
      setRefinedPrompt(result.refined)
      setEditingPrompt(result.refined)
    } catch {
      // error displayed via refine.error
    }
  }

  async function handleGenerate() {
    if (!editingPrompt.trim()) return
    try {
      const result = await generate.mutateAsync({ prompt: editingPrompt.trim() })
      setTestData(result)
      const saved = await saveHistory.mutateAsync({ test: result })
      setTestHistoryId(saved.id)
    } catch {
      // error displayed via generate.error
    }
  }

  function handleReset() {
    setTestData(null)
    setTestHistoryId(null)
    setRefinedPrompt(null)
    setEditingPrompt("")
    setPrompt("")
    setLocalRetakeId(null)
    setLocalAttemptId(null)
    generate.reset()
    refine.reset()
    saveHistory.reset()
  }

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-primary-50 p-1">
          <button
            onClick={() => setMode("prompt")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              mode === "prompt" ? "bg-white text-primary-900 shadow-sm" : "text-primary-400 hover:text-primary-600"
            }`}
          >
            Generator
          </button>
          <button
            onClick={() => setMode("set")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              mode === "set" ? "bg-white text-primary-900 shadow-sm" : "text-primary-400 hover:text-primary-600"
            }`}
          >
            Set Test
          </button>
        </div>

        {mode === "set" ? (
          <SetTestGenerator presetSetId={presetSetId} />
        ) : !testData ? (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-amber-500 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-display text-2xl font-bold text-primary-900">Test Generator</h1>
              <p className="mt-1 text-sm text-primary-500">
                30 câu — 4 phần: Trắc nghiệm, Chia từ, Đồng nghĩa, Dịch Việt→Hàn
              </p>
              <button
                onClick={() => window.location.href = "/test/history"}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-700"
              >
                <Clock className="h-3 w-3" />
                Lịch sử bài test
              </button>
            </div>

            {!refinedPrompt ? (
              <>
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-medium text-primary-400">Ví dụ:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "TOPIK II ngữ pháp trung cấp",
                      "Từ vựng chủ đề cuộc sống hàng ngày TOPIK I",
                      "Ngữ pháp ~지만, ~고, ~서",
                      "Unit 4-7 Korean Grammar in Use Beginning",
                    ].map((ex) => (
                      <button
                        key={ex}
                        onClick={() => setPrompt(ex)}
                        className="rounded-full border border-primary-200 bg-white px-3 py-1 text-[11px] text-primary-500 transition-colors hover:border-primary-300 hover:text-primary-700"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-2">
                  {[
                    { icon: BookOpen, label: "Trắc nghiệm", desc: "10 câu", color: "text-blue-600 bg-blue-50" },
                    { icon: PenTool, label: "Chia từ", desc: "10 câu", color: "text-emerald-600 bg-emerald-50" },
                    { icon: BookMarked, label: "Đồng nghĩa", desc: "5 câu", color: "text-violet-600 bg-violet-50" },
                    { icon: Languages, label: "Dịch Việt→Hàn", desc: "5 câu", color: "text-amber-600 bg-amber-50" },
                  ].map((item) => (
                    <div key={item.label} className={`flex items-center gap-2 rounded-xl border p-3 ${item.color}`}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">{item.label}</p>
                        <p className="text-[10px] opacity-70">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-3 flex gap-2">
                  <input
                    placeholder="VD: Unit 4-7 Korean Grammar in Use Beginning..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRefine()}
                    className="flex-1 rounded-xl border border-primary-200 bg-white px-4 py-3 text-sm outline-none transition-all placeholder:text-primary-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                  />
                  <Button
                    onClick={handleRefine}
                    variant="gradient"
                    disabled={!prompt.trim() || refine.isLoading}
                    loading={refine.isLoading}
                  >
                    {refine.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Optimize
                  </Button>
                </div>

                {refine.isLoading && (
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="mb-3 h-6 w-6 animate-spin text-primary-400" />
                    <p className="text-sm text-primary-500">Optimizing prompt...</p>
                  </div>
                )}

                {refine.error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    {refine.error.message}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-primary-400">
                      Refined Prompt — bạn có thể chỉnh sửa trước khi Generate
                    </p>
                    <button
                      onClick={() => { setRefinedPrompt(null); setEditingPrompt(""); refine.reset() }}
                      className="text-xs font-medium text-primary-500 hover:text-primary-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={editingPrompt}
                    onChange={(e) => setEditingPrompt(e.target.value)}
                    rows={6}
                    className="w-full resize-none rounded-xl border border-primary-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerate}
                    variant="gradient"
                    className="flex-1"
                    disabled={!editingPrompt.trim() || generate.isLoading}
                    loading={generate.isLoading}
                  >
                    {generate.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate
                  </Button>
                </div>

                {generate.isLoading && (
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary-400" />
                    <p className="text-sm text-primary-500">Generating your test...</p>
                  </div>
                )}

                {generate.error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    {generate.error.message}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleReset}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
            >
              &larr; Back
            </button>
            <TestViewer
              test={testData as { title: string; description: string; sections: { name: string; instruction: string; questions: { id: number; type: "multiple-choice" | "conjugation" | "synonym" | "translation"; part: number; question: string; options?: string[]; grammarHint?: string; correctAnswer: string; explanation: string }[] }[] }}
              testHistoryId={testHistoryId ?? undefined}
              onReset={handleReset}
            />
          </>
        )}
      </main>
      <BottomNav />
    </div>
  )
}

export default function TestPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex-1 px-4 pb-24 pt-4">
          <div className="flex flex-col items-center py-16">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary-400" />
          </div>
        </main>
        <BottomNav />
      </div>
    }>
      <TestContent />
    </Suspense>
  )
}
