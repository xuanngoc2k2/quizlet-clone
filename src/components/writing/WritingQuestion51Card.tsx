import type { WritingQuestion51 } from "@/lib/writing-types"

type Props = {
  question: WritingQuestion51
}

export function WritingQuestion51Card({ question }: Props) {
  return (
    <section className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-emerald-500 text-sm font-bold text-white shadow-sm">
          {question.questionNumber}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-400">
              TOPIK II · 쓰기
            </p>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
              {question.score}점
            </span>
          </div>
          <h1 className="mt-1 text-lg font-bold text-slate-900">{question.title}</h1>
        </div>
      </div>

      <p className="mb-5 whitespace-pre-wrap text-sm leading-relaxed text-primary-900">
        {question.instruction}
      </p>

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-6">
        <p className="mb-4 text-xs font-semibold text-slate-500">
          Câu {String(question.questionNumber).padStart(2, "0")} · {question.blanks.length} chỗ
          trống
        </p>
        <p className="whitespace-pre-wrap break-words text-base leading-8 text-slate-800 sm:text-lg">
          {question.passage.map((segment) =>
            segment.type === "text" ? (
              <span key={`${segment.type}-${segment.content}`}>{segment.content}</span>
            ) : (
              <span
                key={segment.id}
                className="mx-1 inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800 ring-1 ring-amber-300"
              >
                ({segment.label})
              </span>
            ),
          )}
        </p>
      </div>
    </section>
  )
}
