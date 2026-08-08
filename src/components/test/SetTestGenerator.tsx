"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/trpc-provider"
import { Button } from "@/components/ui/Button"
import { TestViewer } from "@/components/test/TestViewer"
import { BookMarked, Loader2, Sparkles, Layers } from "lucide-react"

type TestViewerQuestion = {
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

export function SetTestGenerator({ presetSetId }: { presetSetId?: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(presetSetId ?? null)
  const [testData, setTestData] = useState<{ title: string; description: string; sections: { name: string; instruction: string; questions: TestViewerQuestion[] }[] } | null>(null)
  const [testHistoryId, setTestHistoryId] = useState<string | null>(null)

  const sets = api.sets.list.useQuery({ search: "" })
  const generate = api.setTest.generate.useMutation()

  useEffect(() => {
    if (presetSetId) setSelectedId(presetSetId)
  }, [presetSetId])

  async function handleGenerate() {
    if (!selectedId) return
    try {
      const res = await generate.mutateAsync({ setId: selectedId })
      setTestData(res.test)
      setTestHistoryId(res.id)
    } catch {
      // error shown via generate.error
    }
  }

  function handleReset() {
    setTestData(null)
    setTestHistoryId(null)
    generate.reset()
  }

  if (testData) {
    return (
      <div>
        <button
          onClick={handleReset}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          &larr; Back
        </button>
        <TestViewer test={testData} testHistoryId={testHistoryId ?? undefined} onReset={handleReset} setId={selectedId ?? undefined} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg">
          <BookMarked className="h-6 w-6 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold text-primary-900">TOPIK Set Test</h1>
        <p className="mt-1 text-sm text-primary-500">
          Chọn một Set — hệ thống tự tạo đề kiểm tra bao phủ toàn bộ item trong Set
        </p>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary-400" />
        <p className="text-sm font-semibold text-primary-700">Chọn Set</p>
      </div>

      {sets.isLoading ? (
        <div className="flex flex-col items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
        </div>
      ) : sets.data && sets.data.length > 0 ? (
        <div className="mb-5 flex flex-col gap-2">
          {sets.data.map((set) => {
            const count = (set as { _count?: { cards: number } })._count?.cards ?? 0
            const selected = set.id === selectedId
            return (
              <button
                key={set.id}
                onClick={() => setSelectedId(set.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  selected
                    ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-500/20"
                    : "border-primary-100 bg-white hover:border-primary-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-primary-900">{set.title}</p>
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-600">
                    {count} item
                  </span>
                </div>
                {set.description && <p className="mt-0.5 text-xs text-primary-400">{set.description}</p>}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-primary-200 bg-primary-50/50 p-6 text-center text-sm text-primary-400">
          Chưa có Set nào. Hãy tạo một Set trước.
        </div>
      )}

      <Button
        variant="gradient"
        className="w-full"
        onClick={handleGenerate}
        disabled={!selectedId || generate.isLoading}
        loading={generate.isLoading}
      >
        {generate.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Tạo đề mới
      </Button>

      {generate.isLoading && (
        <div className="mt-4 flex flex-col items-center gap-2 py-6">
          <Loader2 className="h-7 w-7 animate-spin text-primary-400" />
          <p className="text-sm text-primary-500">Đang tạo đề theo Set...</p>
          <p className="text-xs text-primary-400">Mỗi item sẽ được kiểm tra, tránh lặp đề cũ</p>
        </div>
      )}

      {generate.error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {generate.error.message}
        </div>
      )}
    </div>
  )
}
