"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { api } from "@/lib/trpc-provider"
import type { WritingAnswer51, WritingQuestion51 } from "@/lib/writing-types"
import type { WritingGrade51 } from "@/lib/writing-question-51"
import { WritingQuestion51Card } from "./WritingQuestion51Card"
import { WritingQuestion51Result } from "./WritingQuestion51Result"

type Props = { question: WritingQuestion51 }

export function WritingQuestion51Practice({ question }: Props) {
  const [answers, setAnswers] = useState<WritingAnswer51>({})
  const [grade, setGrade] = useState<WritingGrade51 | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const checkMutation = api.writing51.checkAnswer.useMutation()

  useEffect(() => {
    setAnswers({})
    setGrade(null)
    setError(null)
  }, [question.id])

  function updateAnswer(blankId: string, value: string) {
    setAnswers((current) => ({ ...current, [blankId]: value }))
    setGrade(null)
  }

  async function checkAnswers() {
    setError(null)
    try {
      const result = await checkMutation.mutateAsync({ questionId: question.id, answers })
      setGrade(result as WritingGrade51)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kiểm tra đáp án")
    }
  }

  return (
    <div className="space-y-5">
      <WritingQuestion51Card question={question} />
      {!grade && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="space-y-3">
            {question.blanks.map((blank, index) => (
              <label key={blank.id} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="shrink-0 text-sm font-bold text-primary-700">({blank.label})</span>
                <input
                  ref={(element) => { inputRefs.current[blank.id] = element }}
                  value={answers[blank.id] ?? ""}
                  onChange={(event) => updateAnswer(blank.id, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return
                    event.preventDefault()
                    const nextBlank = question.blanks[index + 1]
                    if (nextBlank) inputRefs.current[nextBlank.id]?.focus()
                  }}
                  placeholder={`Điền ô (${blank.label})...`}
                  aria-label={`Đáp án ô ${blank.label}`}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </label>
            ))}
          </div>
          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
          <Button onClick={checkAnswers} variant="gradient" size="lg" className="mt-5 w-full sm:w-auto" disabled={checkMutation.isLoading}>
            {checkMutation.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            {checkMutation.isLoading ? "AI đang chấm..." : "Kiểm tra đáp án"}
          </Button>
          {checkMutation.isLoading && <p className="mt-2 text-xs text-slate-500">Gemini đang đối chiếu câu trả lời với đáp án chuẩn và ngữ cảnh câu.</p>}
        </section>
      )}
      {grade && <WritingQuestion51Result grade={grade} />}
      {grade && (
        <Button variant="secondary" onClick={() => setGrade(null)} className="w-full sm:w-auto">
          Làm lại câu này
        </Button>
      )}
    </div>
  )
}