import type { WritingAnswer51, WritingBlank51, WritingQuestion51, WritingPassageSegment51 } from "@/lib/writing-types"

export const WRITING_QUESTION_51_TOTAL_SCORE = 10
export const WRITING_QUESTION_51_BLANK_SCORE = 5

export type WritingBlankResult51 = {
  blankId: string
  label: WritingBlank51["label"]
  answer: string
  status: "correct" | "partial" | "incorrect" | "unanswered"
  acceptedAnswers: string[]
  vocabularyScore: number
  grammarScore: number
  score: number
  maxScore: number
  explanation?: string
}

export type WritingGrade51 = {
  results: WritingBlankResult51[]
  correctCount: number
  totalCount: number
  score: number
  maxScore: number
}

export function normalizeWritingAnswer51(answer: string): string {
  return answer.trim().replace(/\s+/g, " ")
}

export function gradeWritingQuestion51(
  question: Pick<WritingQuestion51, "blanks" | "score">,
  answers: WritingAnswer51,
): WritingGrade51 {
  const results = question.blanks.map((blank) => {
    const answer = answers[blank.id] ?? ""
    const normalizedAnswer = normalizeWritingAnswer51(answer)
    const acceptedAnswers = blank.answer.map(normalizeWritingAnswer51)
    const isAccepted = Boolean(normalizedAnswer && acceptedAnswers.includes(normalizedAnswer))
    const vocabularyScore = isAccepted ? 2 : 0
    const grammarScore = isAccepted ? 3 : 0
    const score = vocabularyScore + grammarScore
    const status: WritingBlankResult51["status"] = !normalizedAnswer
      ? "unanswered"
      : isAccepted
        ? "correct"
        : "incorrect"

    return {
      blankId: blank.id,
      label: blank.label,
      answer,
      status,
      acceptedAnswers: blank.answer,
      vocabularyScore,
      grammarScore,
      score,
      maxScore: WRITING_QUESTION_51_BLANK_SCORE,
      ...(blank.explanation ? { explanation: blank.explanation } : {}),
    }
  })

  const correctCount = results.filter((result) => result.status === "correct").length
  const maxScore = question.score

  return {
    results,
    correctCount,
    totalCount: results.length,
    score: results.reduce((total, result) => total + result.score, 0),
    maxScore,
  }
}

export function validateWritingQuestion51Content(input: {
  title: string
  instruction: string
  passage: WritingPassageSegment51[]
  blanks: WritingBlank51[]
  score: number
}): string[] {
  const errors: string[] = []
  const passageBlankIds = input.passage
    .filter((segment) => segment.type === "blank")
    .map((segment) => segment.id)
  const blankIds = input.blanks.map((blank) => blank.id)

  if (!input.title.trim()) errors.push("Tiêu đề không được để trống")
  if (!input.instruction.trim()) errors.push("Hướng dẫn không được để trống")
  if (input.score !== WRITING_QUESTION_51_TOTAL_SCORE) errors.push("Câu 51 phải có tổng 10 điểm")
  if (input.blanks.length !== 2) errors.push("Câu 51 phải có đúng 2 blank, mỗi blank 5 điểm")
  if (new Set(blankIds).size !== blankIds.length) errors.push("ID blank không được trùng")
  if (input.blanks.some((blank) => blank.answer.length === 0 || blank.answer.every((answer) => !answer.trim()))) {
    errors.push("Mỗi blank phải có ít nhất một đáp án")
  }
  if (new Set(passageBlankIds).size !== passageBlankIds.length) errors.push("Blank trong passage không được trùng")
  if (passageBlankIds.some((id) => !blankIds.includes(id))) errors.push("Passage có blank chưa được định nghĩa")
  if (blankIds.some((id) => !passageBlankIds.includes(id))) errors.push("Có blank chưa được chèn vào passage")

  return errors
}