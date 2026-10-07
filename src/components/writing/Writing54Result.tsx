"use client"

import { useState } from "react"
import { AlertCircle, BookOpen, ChevronDown, ChevronUp, CheckCircle, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { WongojipEditor } from "@/components/writing/WongojipEditor"
import { deserializeCells } from "@/lib/writing-serializer"
import type { WritingGrade54 } from "@/lib/writing-types"

type Props = {
  grade: WritingGrade54
  answer: string
  viewCells: string[] | null
  handwrittenImage: string | null
  onWriteAgain: () => void
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-orange-500"
          style={{ width: `${Math.round((score / max) * 100)}%` }}
        />
      </div>
      <span className="w-12 text-right text-sm font-bold text-slate-900">
        {score}/{max}
      </span>
    </div>
  )
}

export function Writing54Result({
  grade,
  answer,
  viewCells,
  handwrittenImage,
  onWriteAgain,
}: Props) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [showSample, setShowSample] = useState(false)
  const labels = [
    { key: "content", title: "내용 · Nội dung", max: 15 },
    { key: "organization", title: "구성 · Bố cục", max: 15 },
    { key: "expression", title: "표현 · Biểu đạt", max: 10 },
    { key: "accuracy", title: "정확성 · Chính xác", max: 10 },
  ] as const
  const cells = viewCells ?? deserializeCells(answer, false, 700)
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-orange-100 bg-white p-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
          AI 예상 점수 · Điểm tham khảo
        </p>
        <div className="mt-3 flex items-end justify-center gap-1">
          <span className="font-display text-5xl font-bold text-orange-600">
            {grade.totalScore}
          </span>
          <span className="mb-2 text-2xl text-slate-400">/ 50</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-orange-600">
          {Math.round((grade.totalScore / 50) * 100)}%
        </p>
      </div>
      <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-bold uppercase tracking-wide text-orange-600">
          평가 기준 · Barem tham khảo
        </p>
        <div className="space-y-4">
          {labels.map(({ key, title, max }) => (
            <div key={key}>
              <div className="mb-1 flex justify-between">
                <p className="text-sm font-medium text-slate-900">{title}</p>
              </div>
              <ScoreBar score={grade.criteria[key].score} max={max} />
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                {grade.criteria[key].feedback}
              </p>
            </div>
          ))}
        </div>
      </div>
      {grade.handwriting && (
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
          <div className="flex gap-4">
            {handwrittenImage && (
              <img
                src={handwrittenImage}
                alt="Ảnh bài viết tay"
                className="h-32 w-24 rounded-lg border border-orange-200 object-cover"
              />
            )}
            <div className="text-sm text-orange-900">
              <p className="font-bold">OCR bài viết tay</p>
              <p className="mt-2">
                Độ tin cậy: {Math.round(grade.handwriting.ocrConfidence * 100)}% · Khoảng cách ô:{" "}
                {grade.handwriting.spacingScore}/10
              </p>
              <p className="mt-1 text-xs">{grade.handwriting.spacingFeedback}</p>
              {grade.handwriting.layoutWarnings.map((warning) => (
                <p key={warning} className="mt-1 text-xs text-amber-800">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
          Nhận xét tổng quát
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{grade.overallFeedback}</p>
      </div>
      {grade.strengths.length > 0 && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="mb-2 text-xs font-bold text-emerald-700">Điểm mạnh</p>
          {grade.strengths.map((item) => (
            <p key={item} className="flex gap-2 text-sm text-emerald-800">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {item}
            </p>
          ))}
        </div>
      )}{" "}
      {grade.grammarCorrections.length > 0 && (
        <div className="rounded-2xl border border-red-100 bg-white p-5">
          <p className="mb-3 text-xs font-bold text-red-600">Lỗi cần sửa</p>
          {grade.grammarCorrections.map((item) => (
            <div
              key={`${item.original}-${item.corrected}`}
              className="mb-3 rounded-xl bg-red-50 p-3 text-sm"
            >
              <p className="text-red-600 line-through">
                <AlertCircle className="mr-1 inline h-4 w-4" />
                {item.original}
              </p>
              <p className="mt-1 text-emerald-700">→ {item.corrected}</p>
              <p className="mt-1 text-xs text-slate-600">{item.explanation}</p>
            </div>
          ))}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          className="flex w-full items-center justify-between px-5 py-4 text-left"
          onClick={() => setShowAnswer((value) => !value)}
        >
          <span className="text-sm font-semibold">Bài viết của bạn</span>
          {showAnswer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showAnswer && (
          <div className="border-t border-slate-200 px-5 pb-5 pt-4">
            <WongojipEditor disabled initialCells={cells} maxCells={700} />
          </div>
        )}
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          className="flex w-full items-center justify-between px-5 py-4 text-left"
          onClick={() => setShowSample((value) => !value)}
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4 text-orange-500" />
            Bài mẫu tham khảo
          </span>
          {showSample ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showSample && (
          <div className="border-t border-slate-200 px-5 pb-5 pt-4">
            <WongojipEditor
              disabled
              initialCells={deserializeCells(grade.sampleAnswer, true, 700)}
              maxCells={700}
            />
          </div>
        )}
      </div>
      <Button onClick={onWriteAgain} variant="secondary" className="w-full">
        <RotateCw className="h-4 w-4" />
        Viết lại
      </Button>
    </div>
  )
}
