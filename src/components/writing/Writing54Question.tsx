"use client"

import type { WritingQuestion54 } from "@/lib/writing-types"

type Props = { question: WritingQuestion54 }

export function Writing54Question({ question }: Props) {
  const image = question.imageData && question.imageMimeType ? `data:${question.imageMimeType};base64,${question.imageData}` : null
  return <section className="mb-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-sm font-bold text-white">54</div><div><p className="text-[11px] font-semibold uppercase tracking-wide text-orange-500">TOPIK II · 쓰기</p>{question.examRef && <p className="text-xs text-orange-600">{question.examRef}</p>}</div></div><p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-900">{question.instruction}</p>{image && <div className="mt-4 overflow-hidden rounded-xl border border-orange-100 bg-orange-50"><img src={image} alt={question.imageAlt ?? "TOPIK 54번 đề bài"} className="mx-auto block max-h-[32rem] w-full object-contain" />{question.imageAlt && <p className="border-t border-orange-100 px-3 py-2 text-[11px] text-orange-700">{question.imageAlt}</p>}</div>}<div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-700">권장 분량 {question.rangeMin}~{question.rangeMax}자</span><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">Barem 50 điểm</span></div></section>
}
