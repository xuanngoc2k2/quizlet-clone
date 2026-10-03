// ─── Writing Question ────────────────────────────────────────────────────────

export type WritingQuestion53 = {
  id: string
  examRef: string | null
  instruction: string
  imageData: string | null      // raw base64 (no data: prefix)
  imageMimeType: string | null
  imageAlt: string | null
  rangeMin: number
  rangeMax: number
  createdAt: Date
}

// Summary for list pages (excludes imageData for performance)
export type WritingQuestion53Summary = Omit<WritingQuestion53, "imageData" | "imageMimeType">

// ─── Writing Grade ────────────────────────────────────────────────────────────

export type GradingCriterion = {
  score: number
  maxScore: 10
  feedback: string
}

export type GrammarCorrection = {
  original: string
  corrected: string
  explanation: string
}

export type VocabularyCorrection = {
  original: string
  suggested: string
  explanation: string
}

export type WritingGrade = {
  totalScore: number         // 0–30
  maxScore: 30
  criteria: {
    content: GradingCriterion       // 내용 및 과제 수행, max 10
    organization: GradingCriterion  // 글의 전개 구조, max 10
    language: GradingCriterion      // 언어 사용, max 10
  }
  overallFeedback: string
  strengths: string[]
  grammarCorrections: GrammarCorrection[]
  vocabularyCorrections: VocabularyCorrection[]
  sampleAnswer: string
}

// ─── Extract Result (from AI vision) ─────────────────────────────────────────

export type ExtractedQuestion = {
  examRef: string | null
  instruction: string
  imageAlt: string
  rangeMin: number
  rangeMax: number
}

// ─── Writing Attempt ──────────────────────────────────────────────────────────

export type WritingAttempt53 = {
  id: string
  questionId: string
  deviceId: string
  userId: string | null
  answer: string
  gradeJson: WritingGrade | null
  totalScore: number | null
  createdAt: Date
}
