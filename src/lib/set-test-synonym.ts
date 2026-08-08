import { z } from "zod"

export function normalizePlain(s: string): string {
  return s.replace(/\s+/g, " ").trim()
}

export function stripAll(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase()
}

export function canonicalGrammarKey(s: string): string {
  return s.replace(/[\s\-()]/g, "").toLowerCase()
}

export function getOptionIndex(options: string[] | undefined, answer: string | undefined): number {
  if (!options || !answer) return -1
  return options.findIndex((o) => o === answer)
}

export function needsSynonymValidation(part: number, underlinedText?: string | null): boolean {
  return part === 3 && !!underlinedText && underlinedText.trim().length > 0
}

export type UnderlineCheck = { found: boolean; wholeSentence: boolean }

export function checkUnderlinePosition(question: string, underlinedText: string): UnderlineCheck {
  const ut = normalizePlain(underlinedText)
  if (!ut) return { found: false, wholeSentence: false }
  const found = question.includes(ut)
  const wholeSentence = stripAll(question) === stripAll(ut)
  return { found, wholeSentence }
}

export type SynonymValidationOutcome = {
  isValid: boolean
  correctAnswerIndex: number
  issues: string[]
}

export type SynonymValidationItem = {
  itemKey: string
  question: string
  underlinedText: string
  targetGrammar: string
  options: string[]
  correctAnswer: string
}

export const synonymValidationResultSchema = z.object({
  itemKey: z.string(),
  isValid: z.boolean(),
  correctAnswerIndex: z.number().int().min(-1),
  issues: z.array(z.string()).optional().default([]),
})

export const synonymValidationBatchSchema = z.object({
  results: z.array(synonymValidationResultSchema),
})

export function buildSynonymValidationPrompt(items: SynonymValidationItem[]): string {
  const blocks = items.map((it) => {
    const lines = [
      `### itemKey: ${it.itemKey}`,
      `câu gốc: ${it.question}`,
      `underlinedText (phần gạch chân): ${it.underlinedText}`,
      `targetGrammar (ngữ pháp mục tiêu): ${it.targetGrammar}`,
      ...it.options.map((o, i) => `option ${i}: ${o}`),
    ]
    return lines.join("\n")
  })

  return `You are a strict TOPIK Korean synonym examiner. You validate Part 3 synonym questions: the learner must choose the ONLY option whose meaning is equivalent to the MEANING OF THE UNDERLINED PART (underlinedText) in the original sentence.

Your job is to catch REAL defects, NOT to second-guess standard synonym pairs. Accept a correct option when it conveys the SAME MEANING/SITUATION as the underlined part in context, even if the nuance or form differs slightly.

For each item verify:
1. UNDERLINE POSITION: underlinedText must be an EXACT substring of the original question (question.includes(underlinedText) === true), must be a natural Korean grammar expression that conveys the targetGrammar, and must NOT be the whole sentence.
2. MEANING ANALYSIS: determine the meaning of the underlined part (the grammar + the words it attaches to) AS USED IN the original sentence, then the meaning of EVERY option.
3. EXACTLY ONE equivalent: check how many options clearly convey the same meaning/situation as the underlined part in context. Standard synonym pairs (below) ARE equivalent even when the grammatical form differs. Set isValid = false ONLY when: (a) NO option conveys the same meaning, or (b) TWO OR MORE options clearly convey the same meaning. Do NOT mark invalid for subtle stylistic/nuance differences.
4. DISTRACTORS: reject when a distractor is essentially the same meaning as the correct option (2+ correct). Distractors with clearly different timing/condition/purpose/reason/concession are fine.
5. CORRECT OPTION MATCH: the option the question marks as correct (correctAnswer) must convey the same meaning as the underlined part. If correctAnswer is NOT equivalent → isValid = false and report which option (index) IS the unique equivalent in correctAnswerIndex. If 2+ are equivalent or none → correctAnswerIndex = -1.
6. NATURALNESS: reject only clearly ungrammatical, incoherent, or machine-translated Korean.
7. Known acceptable synonym pairs (full-sentence meaning match): -아/어서 ↔ -기 때문에; -고 나서 ↔ -(으)ㄴ 후에; -는 길에 ↔ -다가; -아/어야 (phải làm) ↔ -지 않으면 안 되다 / -아/어야만; -네요 ↔ -군요; -거든요 ↔ -기 때문이에요; -아/어도 ↔ -더라도; -는 동안 ↔ -는 사이에; -지만 ↔ -는데; -(으)면 ↔ -는 경우에 / -(으)ㄴ다면; -기 전에 ↔ -기 이전에 / -(으)ㄹ 때 앞서; -아/어 보니까 ↔ -(으)ㄴ 것을 알게 되다; -아/어서 그런지 ↔ -기 때문인지; -고 있다 ↔ -는 중이다; -(으)려고 ↔ -(으)러 / -려는 참에. Accept these and similar well-known equivalents.

For each item respond with exactly:
{ "itemKey": "...", "isValid": true/false, "correctAnswerIndex": <index of the ONLY equivalent option; -1 if none or ambiguous>, "issues": ["..."] }

Return a JSON object: { "results": [ ... ] }
No markdown, no code fences, no extra text.

Questions:
${blocks.join("\n\n")}`
}

export function synonymQuestionIsValid(
  question: string,
  options: string[],
  correctAnswer: string,
  underlinedText: string,
  outcome: SynonymValidationOutcome | undefined,
): boolean {
  if (!outcome) return false
  if (!outcome.isValid) return false
  const pos = checkUnderlinePosition(question, underlinedText)
  if (!pos.found || pos.wholeSentence) return false
  if (!options || options.length < 4) return false
  if (new Set(options).size !== options.length) return false
  const expected = getOptionIndex(options, correctAnswer)
  return expected !== -1 && outcome.correctAnswerIndex === expected
}
