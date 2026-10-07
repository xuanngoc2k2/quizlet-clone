"use client"

import { useCallback, useRef, useState } from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeft, Clock, Grid, Loader2, Send } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/Button"
import { WongojipEditor, type WongojipEditorHandle } from "@/components/writing/WongojipEditor"
import { Writing54Question } from "@/components/writing/Writing54Question"
import { Writing54Result } from "@/components/writing/Writing54Result"
import { HandwrittenSubmission54 } from "@/components/writing/HandwrittenSubmission54"
import { api } from "@/lib/trpc-provider"
import { countCells, serializeCells, validateWongojip } from "@/lib/writing-serializer"
import type { WritingGrade54 } from "@/lib/writing-types"

type Props = { params: { id: string } }

export default function Writing54PracticePage({ params }: Props) {
  const editorRef = useRef<WongojipEditorHandle>(null)
  const { data: question, isLoading, error } = api.writing54.getQuestion.useQuery({ id: params.id })
  const { data: attempts } = api.writing54.listAttempts.useQuery({ questionId: params.id })
  const gradeMutation = api.writing54.gradeWriting54.useMutation()
  const saveAttemptMutation = api.writing54.saveAttempt.useMutation()
  const [cells, setCells] = useState<string[]>(Array(700).fill(""))
  const [grade, setGrade] = useState<WritingGrade54 | null>(null)
  const [answer, setAnswer] = useState("")
  const [viewCells, setViewCells] = useState<string[] | null>(null)
  const [handwrittenImage, setHandwrittenImage] = useState<string | null>(null)
  const [formatErrors, setFormatErrors] = useState<Record<number, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleCellsChange = useCallback((value: string[]) => {
    setCells(value)
    setFormatErrors({})
  }, [])
  async function submit() {
    if (countCells(cells) === 0) return
    setSubmitError(null)
    setHandwrittenImage(null)
    const serialized = serializeCells(cells, 700)
    setAnswer(serialized)
    setViewCells([...cells])
    try {
      const result = await gradeMutation.mutateAsync({ questionId: params.id, answer: serialized })
      setGrade(result as WritingGrade54)
      saveAttemptMutation.mutate({
        questionId: params.id,
        answer: serialized,
        cells: [...cells],
        grade: result,
      })
    } catch (submissionError) {
      setSubmitError(
        submissionError instanceof Error ? submissionError.message : "Có lỗi xảy ra khi chấm bài",
      )
    }
  }
  function reset() {
    setGrade(null)
    setAnswer("")
    setViewCells(null)
    setHandwrittenImage(null)
    setFormatErrors({})
    gradeMutation.reset()
    editorRef.current?.reset()
  }

  if (isLoading)
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
        <BottomNav />
      </div>
    )
  if (error || !question)
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 px-4 pt-8 text-center">
          <p className="text-red-600">Không tìm thấy đề bài</p>
          <Link href="/writing/54" className="mt-4 inline-block text-sm text-primary-600">
            Quay lại danh sách
          </Link>
        </main>
        <BottomNav />
      </div>
    )

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-8">
        <Link
          href="/writing/54"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-orange-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách câu 54
        </Link>
        {grade ? (
          <Writing54Result
            grade={grade}
            answer={answer}
            viewCells={viewCells}
            handwrittenImage={handwrittenImage}
            onWriteAgain={reset}
          />
        ) : (
          <>
            <Writing54Question question={question} />
            {attempts && attempts.length > 0 && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <Clock className="h-4 w-4" />
                Bạn đã làm {attempts.length} lần · Cao nhất:{" "}
                {Math.max(...attempts.map((item) => item.totalScore ?? 0))}/50
              </div>
            )}
            <div className="mb-4">
              <p className="mb-2 text-center text-xs font-semibold text-slate-500">
                원고지 · 25 ô × 28 dòng · tối đa 700 ô
              </p>
              <WongojipEditor
                ref={editorRef}
                maxCells={700}
                onCellsChange={handleCellsChange}
                disabled={gradeMutation.isLoading}
                errors={formatErrors}
              />
            </div>
            <HandwrittenSubmission54
              questionId={params.id}
              onGraded={({
                grade: resultGrade,
                answer: resultAnswer,
                cells: resultCells,
                imageSrc,
              }) => {
                setGrade(resultGrade)
                setAnswer(resultAnswer)
                setViewCells(resultCells)
                setHandwrittenImage(imageSrc)
              }}
            />
            {countCells(cells) > 0 && (
              <p className="my-4 text-center text-xs font-semibold text-slate-500">
                Đã dùng {countCells(cells)} ô · yêu cầu {question.rangeMin}~{question.rangeMax} ký
                tự
              </p>
            )}
            {submitError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {submitError}
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setFormatErrors(validateWongojip(cells, 700))}
                disabled={countCells(cells) === 0}
              >
                <Grid className="h-5 w-5" />
                Kiểm tra trình bày
              </Button>
              <Button
                variant="gradient"
                size="lg"
                className="flex-1"
                onClick={() => void submit()}
                disabled={countCells(cells) === 0 || gradeMutation.isLoading}
                loading={gradeMutation.isLoading}
              >
                <Send className="h-5 w-5" />
                {gradeMutation.isLoading ? "Đang chấm..." : "Chấm bài"}
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">
              Bài gõ hoặc ảnh viết tay đều được chấm theo barem tham khảo 50 điểm.
            </p>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
