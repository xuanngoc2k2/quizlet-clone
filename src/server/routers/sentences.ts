import { z } from "zod"
import { router, publicProcedure } from "../trpc"
import { callGeminiJSON } from "../lib/gemini"

const langLabels = {
  en: { name: "English", flag: "en" },
  vi: { name: "Vietnamese", flag: "vi" },
} as const

type Lang = keyof typeof langLabels

function buildCheckPrompt(lang: Lang) {
  const instr = lang === "vi"
    ? "Tất cả giải thích và nhận xét phải bằng tiếng Việt."
    : "All explanations and notes must be in English."
  return `You are a Korean language teacher. Given a Korean sentence, evaluate it and respond with VALID JSON ONLY. No markdown, no code fences, no extra text.

${instr}
{
  "grammar_score": <1-10>,
  "naturalness_score": <1-10>,
  "errors": [{"error": "<name>", "explanation": "<why wrong>", "correction": "<fixed version>"}],
  "improved_sentence": "<corrected Korean sentence>",
  "translation": "<English translation>",
  "vocabulary_notes": "<brief notes>"
}`
}

function buildExplainPrompt(lang: Lang) {
  const instr = lang === "vi"
    ? "Tất cả giải thích phải bằng tiếng Việt."
    : "All explanations must be in English."
  return `You are a Korean language teacher. Explain the Korean sentence below. Respond with VALID JSON ONLY. No markdown, no code fences, no extra text.

${instr}
{
  "meaning": "<English translation>",
  "grammar": "<grammar breakdown>",
  "vocabulary": "<key words with meanings>",
  "usage_notes": "<when to use>"
}`
}

function buildExamplesPrompt(word: string, definition: string | undefined, lang: Lang) {
  const instr = lang === "vi"
    ? "Phần translation và grammar_notes phải bằng tiếng Việt."
    : "Translation and grammar notes must be in English."
  return `You are a Korean language teacher. Provide example sentences using the word "${word}"${definition ? ` (meaning: ${definition})` : ""}. ${instr}

Respond with VALID JSON ONLY. No markdown, no code fences, no extra text.
{
  "examples": [
    {"sentence": "<Korean>", "translation": "<translation>", "grammar_notes": "<notes>"}
  ]
}
Provide 3 example sentences at different difficulty levels (easy, intermediate, advanced).`
}

type GeminiResponse = {
  grammar_score: number
  naturalness_score: number
  errors: { error: string; explanation: string; correction: string }[]
  improved_sentence: string
  translation: string
  vocabulary_notes: string
}

type ExplainResponse = {
  meaning: string
  grammar: string
  vocabulary: string
  usage_notes: string
}

type ExamplesResponse = {
  examples: { sentence: string; translation: string; grammar_notes: string }[]
}

export const sentencesRouter = router({
  check: publicProcedure
    .input(
      z.object({
        sentence: z.string().min(1, "Sentence is required"),
        language: z.enum(["en", "vi"]).default("en"),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await callGeminiJSON(
        buildCheckPrompt(input.language),
        { userText: `Sentence: "${input.sentence}"` },
      ) as GeminiResponse
      return {
        grammarScore: result.grammar_score,
        naturalnessScore: result.naturalness_score,
        errors: result.errors,
        improvedSentence: result.improved_sentence,
        translation: result.translation,
        vocabularyNotes: result.vocabulary_notes,
      }
    }),

  explain: publicProcedure
    .input(
      z.object({
        sentence: z.string().min(1, "Sentence is required"),
        language: z.enum(["en", "vi"]).default("en"),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await callGeminiJSON(
        buildExplainPrompt(input.language),
        { userText: `Sentence: "${input.sentence}"` },
      ) as ExplainResponse
      return {
        meaning: result.meaning,
        grammar: result.grammar,
        vocabulary: result.vocabulary,
        usageNotes: result.usage_notes,
      }
    }),

  examples: publicProcedure
    .input(
      z.object({
        word: z.string().min(1, "Word is required"),
        definition: z.string().optional(),
        language: z.enum(["en", "vi"]).default("en"),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await callGeminiJSON(
        buildExamplesPrompt(input.word, input.definition, input.language),
        { temperature: 0.4 },
      ) as ExamplesResponse
      return { examples: result.examples }
    }),
})
