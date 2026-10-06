import { Check, CircleAlert, CircleX } from "lucide-react"
import type { WritingGrade51 } from "@/lib/writing-question-51"

type Props = { grade: WritingGrade51 }

export function WritingQuestion51Result({ grade }: Props) {
  return (
    <section aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">Kết quả</h2>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-bold text-primary-700">
          {grade.score} / {grade.maxScore} điểm
        </span>
      </div>
      <div className="space-y-3">
        {grade.results.map((result) => {
          const isCorrect = result.status === "correct"
          const isPartial = result.status === "partial"
          const isUnanswered = result.status === "unanswered"
          return (
            <div
              key={result.blankId}
              className={`rounded-xl border p-4 ${
                isCorrect
                  ? "border-emerald-200 bg-emerald-50"
                  : isPartial || isUnanswered
                    ? "border-amber-200 bg-amber-50"
                    : "border-rose-200 bg-rose-50"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                {isCorrect ? <Check className="h-4 w-4 text-emerald-600" /> : isPartial || isUnanswered ? <CircleAlert className="h-4 w-4 text-amber-600" /> : <CircleX className="h-4 w-4 text-rose-600" />}
                <span>({result.label})</span>
                <span>{isCorrect ? "Đúng" : isPartial ? "Đúng một phần" : isUnanswered ? "Chưa trả lời" : "Chưa chính xác"}</span>
                <span className="ml-auto font-normal">{result.score}/{result.maxScore} điểm</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Từ vựng: {result.vocabularyScore}/2 · Ngữ pháp: {result.grammarScore}/3
              </p>
              {!isCorrect && (
                <p className="mt-2 text-sm text-slate-700">Đáp án: {result.acceptedAnswers.join(" / ")}</p>
              )}
              {result.explanation && <p className="mt-1 text-sm text-slate-600">Giải thích: {result.explanation}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}