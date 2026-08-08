import { z } from "zod"
import { BLANK_RE } from "./set-test-validation"

export const BASE_WORD_RE = /\(([^)]+)\)/

export function normalizeConjugationAnswer(s: string): string {
  return s.normalize("NFC").trim().replace(/\s+/g, " ")
}

export function extractBaseWord(question: string): string | null {
  const m = question.match(BASE_WORD_RE)
  return m ? m[1].trim() : null
}

export function needsConjugationValidation(part: number, question?: string | null): boolean {
  return part === 2 && !!question && BASE_WORD_RE.test(question) && BLANK_RE.test(question)
}

export function reconstructConjugationSentence(question: string, answer: string): string {
  return question
    .replace(/\s*\([^)]*\)\s*/, " ")
    .split(BLANK_RE)
    .join(answer)
    .replace(/\s{2,}/g, " ")
    .trim()
}

export function conjugationAnswerLeaks(question: string, answer: string): boolean {
  const clean = question.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim()
  const parts = clean.split(BLANK_RE)
  if (parts.length < 2) return false
  const ans = normalizeConjugationAnswer(answer)
  if (!ans) return false
  const left = parts[0].trim()
  const right = parts[1].trim()
  return left.endsWith(ans) || right.startsWith(ans)
}

export function parseAcceptableAnswers(correctAnswer: string): string[] {
  return correctAnswer
    .split(/[;|]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export type ConjugationReferenceEntry = { base: string; target: string; correct: string }

export const CONJUGATION_REFERENCE: ConjugationReferenceEntry[] = [
  { base: "하다", target: "-는", correct: "하는" },
  { base: "하다", target: "-ㄴ", correct: "한" },
  { base: "하다", target: "-아서/어서", correct: "해서" },
  { base: "하다", target: "-려고", correct: "하려고" },
  { base: "먹다", target: "-는", correct: "먹는" },
  { base: "먹다", target: "-ㄴ", correct: "먹은" },
  { base: "먹다", target: "-아서/어서", correct: "먹어서" },
  { base: "먹다", target: "-다가", correct: "먹다가" },
  { base: "가다", target: "-는", correct: "가는" },
  { base: "가다", target: "-ㄴ", correct: "간" },
  { base: "가다", target: "-아서/어서", correct: "가서" },
  { base: "가다", target: "-려고", correct: "가려고" },
  { base: "그렇다", target: "-ㄴ", correct: "그런" },
  { base: "그렇다", target: "-ㄴ지", correct: "그런지" },
  { base: "그렇다", target: "-아서/어서", correct: "그래서" },
  { base: "맑다", target: "-은", correct: "맑은" },
  { base: "맑다", target: "-다가", correct: "맑다가" },
  { base: "맑다", target: "-아서/어서", correct: "맑아서" },
  { base: "듣다", target: "-는", correct: "듣는" },
  { base: "듣다", target: "-은", correct: "들은" },
  { base: "듣다", target: "-아서/어서", correct: "들어서" },
  { base: "걷다", target: "-는", correct: "걷는" },
  { base: "걷다", target: "-은", correct: "걸은" },
  { base: "걷다", target: "-아서/어서", correct: "걸어서" },
  { base: "돕다", target: "-는", correct: "돕는" },
  { base: "돕다", target: "-은", correct: "도운" },
  { base: "돕다", target: "-아서/어서", correct: "도와서" },
]

export function findReferenceConjugation(base: string, target: string): ConjugationReferenceEntry | undefined {
  const nb = normalizeConjugationAnswer(base)
  const nt = normalizeConjugationAnswer(target)
  return CONJUGATION_REFERENCE.find((r) => normalizeConjugationAnswer(r.base) === nb && normalizeConjugationAnswer(r.target) === nt)
}

export type MorphologyCheck = { known: boolean; ok: boolean; expected?: string }

export function checkConjugationMorphology(base: string, target: string, answer: string): MorphologyCheck {
  const ref = findReferenceConjugation(base, target)
  if (!ref) return { known: false, ok: false }
  return { known: true, ok: normalizeConjugationAnswer(answer) === ref.correct, expected: ref.correct }
}

export function buildTransformation(base: string, target: string, correct: string): string {
  return `${base} + ${target} → ${correct}`
}

export type ConjugationValidationOutcome = {
  isValid: boolean
  correctAnswer: string
  expectedAnswers: string[]
  issues: string[]
}

export type ConjugationValidationItem = {
  itemKey: string
  question: string
  baseWord: string
  targetGrammar: string
  correctAnswer: string
}

export const conjugationValidationResultSchema = z.object({
  itemKey: z.string(),
  isValid: z.boolean(),
  correctAnswer: z.string().optional(),
  expectedAnswers: z.array(z.string()).optional(),
  issues: z.array(z.string()).optional().default([]),
})

export const conjugationValidationBatchSchema = z.object({
  results: z.array(conjugationValidationResultSchema),
})

export function buildConjugationValidationPrompt(items: ConjugationValidationItem[]): string {
  const refBlock = CONJUGATION_REFERENCE.map((r) => `${r.base} + ${r.target} → ${r.correct}`).join("\n")

  const blocks = items.map((it) => {
    const reconstructed = reconstructConjugationSentence(it.question, it.correctAnswer)
    return [
      `### itemKey: ${it.itemKey}`,
      `câu hỏi: ${it.question}`,
      `base word: ${it.baseWord}`,
      `target grammar: ${it.targetGrammar}`,
      `expected answer: ${it.correctAnswer}`,
      `câu hoàn chỉnh sau khi điền: ${reconstructed}`,
    ].join("\n")
  })

  return `You are a strict TOPIK Korean morphology examiner. You validate Part 2 conjugation questions, where the word in parentheses is the BASE FORM and the student must conjugate it to fit the sentence (blank "____").

Ground truth — các phép biến đổi mẫu (phải tuân thủ tuyệt đối):
${refBlock}

For each item verify:
1. MORPHOLOGY: base word + target grammar MUST yield exactly the expected answer. Reject any wrong conjugation of the base word. Ví dụ: 그렇다 + -ㄴ지 chỉ được "그런지", KHÔNG chấp nhận "그렇는지"/"그렇은지"/"그렇지"; 맑다 + -다가 chỉ được "맑다가", KHÔNG chấp nhận "맑는다"/"맑아서"/"맑으면".
2. COMPLETE SENTENCE: the fully reconstructed sentence (base word replaced by the conjugated answer) must be grammatically correct, natural TOPIK Korean, semantically coherent, and genuinely require the target grammar.
3. ACCEPTABLE ANSWERS: if the target grammar/context allows legitimate alternative conjugations, list them in expectedAnswers (canonical first). If only one form is acceptable, expectedAnswers = [that single form].
4. DUPLICATION: the expected answer (conjugated form) must NOT already appear in the sentence adjacent to the blank — neither right before the parenthetical base word nor right after the blank. The base word in parentheses "(...)" is allowed, but the conjugated answer must appear ONLY as the blank. Reconstruct must never duplicate the answer (VD SAI: "…배우면 (배우다) ____…" vì điền thành "…배우면 배우면…"; ĐÚNG: "…(배우다) ____…"). If the answer already sits next to the blank → isValid = false.
5. If correctAnswer is empty, does not follow from base word + target grammar, or the reconstructed sentence is ungrammatical → isValid = false.

For each item respond with exactly:
{ "itemKey": "...", "isValid": true/false, "correctAnswer": "<canonical answer>", "expectedAnswers": ["..."], "issues": ["..."] }

Return a JSON object: { "results": [ ... ] }
No markdown, no code fences, no extra text.

Questions:
${blocks.join("\n\n")}`
}

export function conjugationQuestionIsValid(
  question: string,
  correctAnswer: string,
  outcome: ConjugationValidationOutcome | undefined,
): boolean {
  if (!outcome) return false
  if (!outcome.isValid) return false
  if (!needsConjugationValidation(2, question)) return false
  if (!outcome.correctAnswer) return false
  if (conjugationAnswerLeaks(question, correctAnswer)) return false
  return normalizeConjugationAnswer(outcome.correctAnswer) === normalizeConjugationAnswer(correctAnswer)
}
