"use client"

import { useState } from "react"
import { RotateCw, ChevronDown, ChevronUp, CheckCircle, AlertCircle, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { WongojipEditor } from "@/components/writing/WongojipEditor"
import { deserializeCells } from "@/lib/writing-serializer"
import type { WritingGrade } from "@/lib/writing-types"

type Props = {
  grade: WritingGrade
  answer: string
  viewCells?: string[] | null
  onWriteAgain: () => void
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = Math.round((score / max) * 100)
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-bold text-primary-900">
        {score}/{max}
      </span>
    </div>
  )
}

export function WritingResult({ grade, answer, viewCells, onWriteAgain }: Props) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [showSample, setShowSample] = useState(false)
  // Use exact cells (if available) otherwise fall back to deserializing the text
  const answerCells = viewCells ?? deserializeCells(answer)

  const totalPct = Math.round((grade.totalScore / grade.maxScore) * 100)
  const totalColor =
    totalPct >= 70 ? "text-emerald-600" : totalPct >= 40 ? "text-amber-600" : "text-red-600"

  return (
    <div className="space-y-4">
      {/* Total Score */}
      <div className="rounded-2xl border border-primary-100 bg-white p-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-400">
          AI 예상 점수 · Điểm tham khảo do AI đánh giá
        </p>
        <div className="mt-3 flex items-end justify-center gap-1">
          <span className={`font-display text-5xl font-bold ${totalColor}`}>
            {grade.totalScore}
          </span>
          <span className="mb-2 text-2xl font-medium text-primary-300">/ {grade.maxScore}</span>
        </div>
        <p className={`mt-1 text-sm font-semibold ${totalColor}`}>{totalPct}%</p>
      </div>

      {/* Criteria */}
      <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-bold uppercase tracking-wide text-primary-500">평가 기준</p>
        <div className="space-y-4">
          {(
            [
              { key: "content", label: "내용 및 과제 수행", sub: "Nội dung & hoàn thành yêu cầu" },
              { key: "organization", label: "글의 전개 구조", sub: "Bố cục & mạch lạc" },
              { key: "language", label: "언어 사용", sub: "Ngữ pháp & từ vựng" },
            ] as const
          ).map(({ key, label, sub }) => {
            const c = grade.criteria[key]
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-900">{label}</p>
                    <p className="text-[11px] text-primary-400">{sub}</p>
                  </div>
                </div>
                <ScoreBar score={c.score} max={c.maxScore} />
                <p className="mt-1.5 text-xs leading-relaxed text-primary-600">{c.feedback}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Overall Feedback */}
      {grade.overallFeedback && (
        <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary-500">
            전체 피드백
          </p>
          <p className="text-sm leading-relaxed text-primary-800">{grade.overallFeedback}</p>
        </div>
      )}

      {/* Strengths */}
      {grade.strengths.length > 0 && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
            잘한 점 · Điểm mạnh
          </p>
          <ul className="space-y-1.5">
            {grade.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grammar Corrections */}
      {grade.grammarCorrections.length > 0 && (
        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-red-600">
            수정하면 좋은 부분 · Lỗi cần sửa
          </p>
          <div className="space-y-4">
            {grade.grammarCorrections.map((c, i) => (
              <div key={i} className="rounded-xl bg-red-50 p-3 text-sm">
                <div className="mb-1 flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span className="text-red-600 line-through">{c.original}</span>
                </div>
                <p className="ml-6 font-medium text-emerald-700">→ {c.corrected}</p>
                <p className="ml-6 mt-1 text-[11px] text-primary-500">{c.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vocabulary Corrections */}
      {grade.vocabularyCorrections.length > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-600">
            추천 표현 · Từ vựng đề xuất
          </p>
          <div className="space-y-3">
            {grade.vocabularyCorrections.map((c, i) => (
              <div key={i} className="rounded-xl bg-amber-50 p-3 text-sm">
                <p className="text-amber-700">
                  <span className="line-through opacity-60">{c.original}</span>
                  <span className="mx-2">→</span>
                  <span className="font-semibold">{c.suggested}</span>
                </p>
                <p className="mt-1 text-[11px] text-primary-500">{c.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Your Answer (collapsible) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setShowAnswer((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50"
        >
          <p className="text-sm font-semibold text-slate-700">내 답안 보기 · Bài viết của bạn</p>
          {showAnswer ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>
        {showAnswer && (
          <div className="border-t border-slate-200 px-5 pb-5 pt-4">
            <WongojipEditor disabled initialCells={answerCells} />
          </div>
        )}
      </div>

      {/* Sample Answer (collapsible) */}
      {grade.sampleAnswer && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <button
            onClick={() => setShowSample((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary-500" />
              <p className="text-sm font-semibold text-slate-700">모범 답안 · Bài mẫu tham khảo</p>
            </div>
            {showSample ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>
          {showSample && (
            <div className="border-t border-slate-200 px-5 pb-5 pt-4">
              <WongojipEditor disabled initialCells={deserializeCells(grade.sampleAnswer, true)} />
            </div>
          )}
        </div>
      )}

      {/* Write Again */}
      <Button onClick={onWriteAgain} variant="secondary" className="w-full">
        <RotateCw className="h-4 w-4" />
        Viết lại
      </Button>
    </div>
  )
}
