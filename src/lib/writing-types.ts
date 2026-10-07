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

export type WritingPassageSegment51 =
  | { type: "text"; content: string }
  | { type: "blank"; id: string; label: "ㄱ" | "ㄴ" }

export type WritingBlank51 = {
  id: string
  label: "ㄱ" | "ㄴ"
  answer: string[]
  explanation?: string
}

export type WritingQuestion51 = {
  id: string
  questionNumber: number
  title: string
  instruction: string
  passage: WritingPassageSegment51[]
  blanks: WritingBlank51[]
  score: number
  difficulty: string | null
  source: string | null
  createdAt: Date
  updatedAt: Date
}

export type WritingAnswer51 = Record<string, string>

export type WritingAttempt51 = {
  id: string
  questionId: string
  deviceId: string
  userId: string | null
  answers: WritingAnswer51
  score: number
  maxScore: number
  createdAt: Date
}

// Summary for list pages (excludes imageData for performance)
export type WritingQuestion53Summary = Omit<WritingQuestion53, "imageData" | "imageMimeType">

export type WritingQuestion54 = {
  id: string
  examRef: string | null
  instruction: string
  imageData: string | null
  imageMimeType: string | null
  imageAlt: string | null
  rangeMin: number
  rangeMax: number
  createdAt: Date
}

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
  handwriting?: {
    ocrConfidence: number
    spacingScore: number
    spacingFeedback: string
    spellingErrors: Array<{
      original: string
      corrected: string
      explanation: string
    }>
    layoutWarnings: string[]
  }
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

export type WritingGrade54 = {
  totalScore: number
  maxScore: 50
  criteria: {
    content: GradingCriterion & { maxScore: 15 }
    organization: GradingCriterion & { maxScore: 15 }
    expression: GradingCriterion
    accuracy: GradingCriterion
  }
  overallFeedback: string
  strengths: string[]
  grammarCorrections: GrammarCorrection[]
  vocabularyCorrections: VocabularyCorrection[]
  sampleAnswer: string
  handwriting?: WritingGrade["handwriting"]
}
