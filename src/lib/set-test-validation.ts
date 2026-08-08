import { z } from "zod"

export const BLANK_RE = /_{3,}/

export function reconstructSentence(question: string, option: string): string {
  return question.split(BLANK_RE).join(option)
}

export function getOptionIndex(options: string[] | undefined, answer: string | undefined): number {
  if (!options || !answer) return -1
  return options.findIndex((o) => o === answer)
}

export function needsBlankValidation(part: number, options?: string[] | null, question?: string): boolean {
  return part === 1 && !!options && options.length > 0 && !!question && BLANK_RE.test(question)
}

export type ValidationOutcome = {
  isValid: boolean
  correctAnswerIndex: number
  issues: string[]
}

export function questionIsValid(
  question: string,
  options: string[],
  correctAnswer: string,
  outcome: ValidationOutcome,
): boolean {
  if (!outcome.isValid) return false
  if (!BLANK_RE.test(question)) return false
  if (new Set(options).size !== options.length) return false
  const expected = getOptionIndex(options, correctAnswer)
  return expected !== -1 && outcome.correctAnswerIndex === expected
}

export type ValidationItem = {
  itemKey: string
  question: string
  options: string[]
  target: string
}

export const validationResultSchema = z.object({
  itemKey: z.string(),
  isValid: z.boolean(),
  correctAnswerIndex: z.number().int().min(-1),
  issues: z.array(z.string()).optional().default([]),
})

export const validationBatchSchema = z.object({
  results: z.array(validationResultSchema),
})

export function buildValidationPrompt(items: ValidationItem[]): string {
  const blocks = items.map((it) => {
    const lines = [
      `### itemKey: ${it.itemKey}`,
      `target (item cần kiểm tra): ${it.target}`,
      `câu có blank: ${it.question}`,
      ...it.options.map((o, i) => `option ${i}: ${o}`),
      ...it.options.map((o, i) => `reconstructed ${i}: ${reconstructSentence(it.question, o)}`),
    ]
    return lines.join("\n")
  })

  return `You are a strict TOPIK Korean language examiner. You validate multiple-choice blank-fill questions. For each question, the blank "____" has ALREADY been replaced by EACH option to form complete sentences (the "reconstructed N" lines). Judge every reconstructed sentence on: (a) grammatical correctness, (b) semantic meaning, (c) natural TOPIK-level Korean, (d) coherence in context.

Rules:
1. A correct answer is an option whose FULL reconstructed sentence is grammatical, meaningful, natural and context-coherent.
2. There must be EXACTLY ONE correct answer. If 0 or 2+ options are acceptable → isValid = false.
3. The correct option MUST genuinely test the target grammar/item — not merely be the only word that fits by vocabulary/context while bypassing the target.
4. Distractors must be the same grammatical category as the target, plausible TOPIK confusions, and each must make its reconstructed sentence clearly WRONG (grammar, meaning, or unnatural). Reject distractors that are obviously wrong, cannot combine with the sentence, or are nonsensical.
5. The blank position must let the target grammar combine naturally with the whole sentence. If inserting the target creates a conflict with the final ending or the rest of the sentence (e.g. "쉬거나 ... 만나거나 만나요"), isValid = false.
6. Reject word-by-word translations from Vietnamese or forced/unnatural structures.
7. If options are duplicated, or the correct option is missing from the options, isValid = false.

For each item respond with exactly:
{ "itemKey": "...", "isValid": true/false, "correctAnswerIndex": <index of the ONLY valid option; -1 if none or ambiguous>, "issues": ["..."] }

Return a JSON object: { "results": [ ... ] }
No markdown, no code fences, no extra text.

Questions:
${blocks.join("\n\n")}`
}
