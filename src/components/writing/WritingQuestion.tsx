"use client"

import Image from "next/image"
import type { WritingQuestion53 } from "@/lib/writing-types"

type Props = {
  question: WritingQuestion53
}

export function WritingQuestion({ question }: Props) {
  const imgSrc =
    question.imageData && question.imageMimeType
      ? `data:${question.imageMimeType};base64,${question.imageData}`
      : null

  return (
    <div className="mb-6 rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-emerald-500 text-sm font-bold text-white shadow-sm">
          53
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-400">
            TOPIK II · 쓰기
          </p>
          {question.examRef && (
            <p className="text-xs text-primary-500">{question.examRef}</p>
          )}
        </div>
      </div>

      {/* Instruction */}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-primary-900">
        {question.instruction}
      </p>

      {/* Image / Chart */}
      {imgSrc && (
        <div className="mt-4 overflow-hidden rounded-xl border border-primary-100 bg-primary-50">
          {/* eslint-disable-next-line */}
          <img
            src={imgSrc}
            alt={question.imageAlt ?? "TOPIK 53번 자료"}
            className="mx-auto block max-h-80 w-full object-contain"
          />
          {question.imageAlt && (
            <p className="border-t border-primary-100 px-3 py-2 text-[11px] text-primary-400">
              📊 {question.imageAlt}
            </p>
          )}
        </div>
      )}

      {/* Recommended range */}
      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
          권장 분량 {question.rangeMin}~{question.rangeMax}자
        </span>
      </div>
    </div>
  )
}
