export type TestResultLike = {
  questionId: number
  isCorrect: boolean
  score?: number
}

export function isAnswerCorrect(r: TestResultLike): boolean {
  return r.isCorrect || (r.score !== undefined && r.score >= 5)
}

export function isAnswerWrong(r: TestResultLike): boolean {
  return !isAnswerCorrect(r)
}