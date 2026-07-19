"use client"

import { useState } from "react"
import { api } from "@/lib/trpc-provider"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/Button"
import { TestViewer } from "@/components/test/TestViewer"
import { Sparkles, Loader2, BookOpen, PenTool, BookMarked, Languages } from "lucide-react"

export default function TestPage() {
  const [prompt, setPrompt] = useState("")
  const [testData, setTestData] = useState<unknown>(null)
  const generate = api.test.generate.useMutation()

  async function handleGenerate() {
    if (!prompt.trim()) return
    try {
      const result = await generate.mutateAsync({ prompt: prompt.trim() })
      setTestData(result)
    } catch {
      // error displayed via generate.error
    }
  }

  function handleReset() {
    setTestData(null)
    setPrompt("")
    generate.reset()
  }

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        {!testData ? (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-amber-500 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-display text-2xl font-bold text-primary-900">Test Generator</h1>
              <p className="mt-1 text-sm text-primary-500">
                30 câu — 4 phần: Trắc nghiệm, Chia từ, Đồng nghĩa, Dịch Việt→Hàn
              </p>
            </div>

            <div className="mb-4 space-y-2">
              <p className="text-xs font-medium text-primary-400">Ví dụ:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "TOPIK II ngữ pháp trung cấp",
                  "Từ vựng chủ đề cuộc sống hàng ngày TOPIK I",
                  "Ngữ pháp ~지만, ~고, ~서",
                  "Luyện thi TOPIK II đọc hiểu",
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
                placeholder="VD: Tạo đề thi TOPIK II ngữ pháp trung cấp..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                className="flex-1 rounded-xl border border-primary-200 bg-white px-4 py-3 text-sm outline-none transition-all placeholder:text-primary-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />
              <Button
                onClick={handleGenerate}
                variant="gradient"
                disabled={!prompt.trim() || generate.isLoading}
                loading={generate.isLoading}
              >
                {generate.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate
              </Button>
            </div>

            {generate.isLoading && (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary-400" />
                <p className="text-sm text-primary-500">Generating your test...</p>
              </div>
            )}

            {generate.error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {generate.error.message}
              </div>
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
              test={testData as { title: string; description: string; sections: { name: string; instruction: string; questions: { id: number; type: "multiple-choice" | "conjugation" | "synonym" | "translation"; part: number; question: string; options?: string[]; correctAnswer: string; explanation: string }[] }[] }}
              onReset={handleReset}
            />
          </>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
