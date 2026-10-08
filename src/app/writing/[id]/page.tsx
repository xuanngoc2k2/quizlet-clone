"use client"

import { useRef, useState, useCallback } from "react"
import { ArrowLeft, Send, Loader2, AlertCircle, Clock, Grid } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { WongojipEditor, type WongojipEditorHandle } from "@/components/writing/WongojipEditor"
import { WritingQuestion } from "@/components/writing/WritingQuestion"
import { WritingResult } from "@/components/writing/WritingResult"
import { HandwrittenSubmission } from "@/components/writing/HandwrittenSubmission"
import { api } from "@/lib/trpc-provider"
import { serializeCells, countCells, validateWongojip } from "@/lib/writing-serializer"
import type { WritingGrade } from "@/lib/writing-types"

type QuestionLayout = "top" | "left"

type PageProps = {
  params: { id: string }
}

export default function WritingPracticePage({ params }: PageProps) {
  const { id } = params

  const { data: question, isLoading, error } = api.writing.getQuestion.useQuery({ id })

  const editorRef = useRef<WongojipEditorHandle>(null)
  const [cells, setCells] = useState<string[]>(Array(300).fill(""))
  const [formatErrors, setFormatErrors] = useState<Record<number, string>>({})
  const [grade, setGrade] = useState<WritingGrade | null>(null)
  const [answer, setAnswer] = useState("")
  const [viewCells, setViewCells] = useState<string[] | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [questionLayout, setQuestionLayout] = useState<QuestionLayout>("top")
  const [handwrittenImage, setHandwrittenImage] = useState<string | null>(null)

  const gradeMutation = api.writing.gradeWriting53.useMutation()
  const saveAttemptMutation = api.writing.saveAttempt.useMutation()
  const { data: attempts } = api.writing.listAttempts.useQuery({ questionId: id })

  const cellCount = countCells(cells)

  const handleCellsChange = useCallback((newCells: string[]) => {
    setCells(newCells)
    setFormatErrors({})
  }, [])

  async function handleSubmit() {
    if (cellCount === 0) return
    setSubmitError(null)
    setHandwrittenImage(null)

    const serialized = serializeCells(cells)
    setAnswer(serialized)
    setViewCells([...cells])

    try {
      const result = await gradeMutation.mutateAsync({
        questionId: id,
        answer: serialized,
      })
      setGrade(result as WritingGrade)

      // Save attempt in background (don't block UI)
      saveAttemptMutation.mutate({
        questionId: id,
        answer: serialized,
        cells: [...cells],
        grade: result as WritingGrade,
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Có lỗi xảy ra khi chấm bài")
    }
  }

  function handleWriteAgain() {
    setGrade(null)
    setAnswer("")
    setSubmitError(null)
    setHandwrittenImage(null)
    setFormatErrors({})
    editorRef.current?.reset()
    gradeMutation.reset()
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </main>
        <BottomNav />
      </div>
    )
  }

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (error || !question) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 px-4 pt-8 text-center">
          <p className="text-red-600">Không tìm thấy đề bài</p>
          <Link
            href="/writing/53"
            className="mt-4 inline-block text-sm text-primary-600 hover:underline"
          >
            ← Quay lại danh sách
          </Link>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        className={[
          "mx-auto w-full flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-8",
          questionLayout === "left" ? "max-w-[1600px]" : "max-w-5xl",
        ].join(" ")}
      >
        {/* Back nav */}
        <Link
          href="/writing/53"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách đề
        </Link>

        {/* Result view */}
        {grade ? (
          <>
            <WritingResult
              grade={grade}
              answer={answer}
              viewCells={viewCells}
              handwrittenImage={handwrittenImage}
              onWriteAgain={handleWriteAgain}
            />
          </>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <div
                role="tablist"
                aria-label="Layout đề bài"
                className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm"
              >
                {(["top", "left"] as const).map((layout) => {
                  const isActive = questionLayout === layout
                  return (
                    <button
                      key={layout}
                      type="button"
                      role="tab"
                      aria-label={layout === "top" ? "Đề trên" : "Đề bên trái"}
                      aria-selected={isActive}
                      onClick={() => setQuestionLayout(layout)}
                      className={[
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-white text-primary-700 shadow-sm ring-1 ring-primary-200"
                          : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
                      ].join(" ")}
                    >
                      {layout === "top" ? "Đề trên" : "Đề bên trái"}
                    </button>
                  )
                })}
              </div>
            </div>

            <div
              className={
                questionLayout === "left"
                  ? "grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]"
                  : "flex w-full flex-col gap-6"
              }
            >
              <div className="min-w-0">
                <WritingQuestion question={question} />
              </div>

              <div className="min-w-0">
                {/* Attempt history badge */}
                {attempts && attempts.length > 0 && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <p className="flex-1 text-xs text-slate-600">
                      Bạn đã làm <span className="font-semibold">{attempts.length} lần</span>
                      {" · "}Cao nhất:{" "}
                      <span className="font-semibold text-emerald-600">
                        {Math.max(...attempts.map((a) => a.totalScore ?? 0))} / 30
                      </span>
                    </p>
                    <button
                      onClick={() => setShowHistory(true)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-primary-600 shadow-sm hover:bg-slate-50"
                    >
                      Xem lịch sử
                    </button>
                  </div>
                )}

                {/* 원고지 Editor — with right-side margin for markers */}
                <div className="mb-4 pr-10">
                  <p className="mb-2 text-center text-xs font-semibold text-slate-500">
                    ✏️ 원고지 — nhấp vào ô để bắt đầu viết
                  </p>
                  <WongojipEditor
                    ref={editorRef}
                    onCellsChange={handleCellsChange}
                    disabled={gradeMutation.isLoading}
                    errors={formatErrors}
                  />
                </div>
                <HandwrittenSubmission
                  questionId={id}
                  onGraded={({
                    grade: handwrittenGrade,
                    answer: ocrAnswer,
                    cells: ocrCells,
                    imageSrc,
                  }) => {
                    setGrade(handwrittenGrade)
                    setAnswer(ocrAnswer)
                    setViewCells(ocrCells)
                    setHandwrittenImage(imageSrc)
                  }}
                />
              </div>
            </div>

            {/* Char count reminder */}
            {cellCount > 0 && (
              <div className="mb-4 text-center">
                <span
                  className={[
                    "rounded-full px-4 py-1.5 text-xs font-semibold",
                    cellCount < question.rangeMin
                      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      : cellCount > question.rangeMax
                        ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                        : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
                  ].join(" ")}
                >
                  {cellCount} ô
                  {cellCount < question.rangeMin &&
                    ` · cần thêm ${question.rangeMin - cellCount} ô`}
                  {cellCount > question.rangeMax && ` · vượt ${cellCount - question.rangeMax} ô`}
                  {cellCount >= question.rangeMin &&
                    cellCount <= question.rangeMax &&
                    ` · trong phạm vi yêu cầu ✓`}
                </span>
              </div>
            )}

            {/* Submit error */}
            {submitError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {submitError}
              </div>
            )}

            {/* Submit buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setFormatErrors(validateWongojip(cells))}
                variant="secondary"
                size="lg"
                className="flex-1"
                disabled={cellCount === 0 || gradeMutation.isLoading}
                title="Kiểm tra quy tắc trình bày 원고지"
              >
                <Grid className="h-5 w-5" />
                Kiểm tra trình bày
              </Button>

              <Button
                onClick={handleSubmit}
                variant="gradient"
                size="lg"
                className="flex-1"
                disabled={cellCount === 0 || gradeMutation.isLoading}
                loading={gradeMutation.isLoading}
              >
                {gradeMutation.isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Đang chấm...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Chấm bài
                  </>
                )}
              </Button>
            </div>

            {gradeMutation.isLoading && (
              <p className="mt-2 text-center text-xs text-slate-500">
                Gemini AI đang đọc và đánh giá bài của bạn...
              </p>
            )}
          </>
        )}
      </main>
      <BottomNav />

      <Modal open={showHistory} onClose={() => setShowHistory(false)} title="Lịch sử làm bài">
        <div className="flex flex-col gap-3">
          {attempts?.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{a.totalScore} / 30 điểm</p>
                <p className="text-[11px] text-slate-500">
                  {new Date(a.createdAt).toLocaleString("vi-VN")}
                </p>
                <p className="mt-1 text-[11px] font-medium text-primary-600">
                  Người làm: {a.user?.name || a.user?.email || "Khách chưa đăng nhập"}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setGrade(a.gradeJson as WritingGrade)
                  setAnswer(a.answer)
                  setViewCells(Array.isArray(a.cellsJson) ? (a.cellsJson as string[]) : null)
                  setHandwrittenImage(
                    a.imageData && a.imageMimeType
                      ? `data:${a.imageMimeType};base64,${a.imageData}`
                      : null,
                  )
                  setShowHistory(false)
                }}
              >
                Xem kết quả
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
