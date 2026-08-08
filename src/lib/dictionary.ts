import { z } from "zod"

export type Lang = "ko" | "vi"

export const meaningSchema = z.object({
  partOfSpeech: z.string().optional(),
  meaning: z.string().min(1),
  example: z.string().optional(),
  exampleTranslation: z.string().optional(),
})

export const exampleSchema = z.object({
  sentence: z.string().min(1),
  translation: z.string().min(1),
})

export const grammarPointSchema = z.object({
  pattern: z.string().min(1),
  meaning: z.string().min(1),
  usage: z.string().optional(),
  examples: z.array(exampleSchema).optional(),
})

export const dictionaryResultSchema = z.object({
  mode: z.enum(["word", "phrase", "sentence", "grammar"]),
  sourceText: z.string().min(1),
  targetText: z.string().min(1),
  romanization: z.string().optional(),
  meanings: z.array(meaningSchema).optional(),
  translation: z.string().optional(),
  grammarPoints: z.array(grammarPointSchema).optional(),
  exampleSentences: z.array(exampleSchema).optional(),
  synonyms: z.array(z.string()).optional(),
  antonyms: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

export type DictionaryResult = z.infer<typeof dictionaryResultSchema>

const HANGUL_RE = /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/

export function normalizeCacheKey(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase()
}

export function hasHangul(text: string): boolean {
  return HANGUL_RE.test(text)
}

export function detectDirection(text: string): { from: Lang; to: Lang } {
  return hasHangul(text) ? { from: "ko", to: "vi" } : { from: "vi", to: "ko" }
}

export function buildDictionaryPrompt(text: string, from: Lang, to: Lang): string {
  const fromLabel = from === "ko" ? "Korean" : "Vietnamese"
  const toLabel = to === "ko" ? "Korean" : "Vietnamese"

  return `You are a Korean–Vietnamese bilingual dictionary and language assistant for Vietnamese TOPIK learners.

Input text: "${text}"
Direction: translate from ${fromLabel} into ${toLabel}.
Context-aware: a single word → dictionary entry; a short multi-word expression → idiom/collocation; a full clause/sentence → natural sentence translation + key grammar; a grammar pattern (e.g. -았/었더니, -(으)ㄹ 테니까, -는 중이다) → thorough grammar explanation.

First classify the input and set "mode" to exactly one of:
- "word": a single vocabulary word
- "phrase": an idiom, collocation, or short multi-word expression (2–5 words)
- "sentence": a full clause or sentence
- "grammar": a grammar pattern/connective/ending

Respond with VALID JSON ONLY. No markdown, no code fences, no extra text. Use this exact schema:
{
  "mode": "word",
  "sourceText": "<exact input>",
  "targetText": "<primary translation in ${toLabel} — required>",
  "romanization": "<Romanization ONLY if source is Korean, else omit>",
  "meanings": [
    {
      "partOfSpeech": "noun|verb|adjective|adverb|particle|...",
      "meaning": "<meaning in Vietnamese>",
      "example": "<Korean example sentence>",
      "exampleTranslation": "<Vietnamese translation of the example>"
    }
  ],
  "translation": "<natural sentence translation in ${toLabel}, ONLY for mode=sentence>",
  "grammarPoints": [
    {
      "pattern": "<the pattern, e.g. -았/었더니>",
      "meaning": "<meaning in Vietnamese>",
      "usage": "<when/how to use, in Vietnamese>",
      "examples": [{ "sentence": "<Korean>", "translation": "<Vietnamese>" }]
    }
  ],
  "exampleSentences": [{ "sentence": "<Korean>", "translation": "<Vietnamese>" }],
  "synonyms": ["<Korean synonyms or equivalent expressions>"],
  "antonyms": ["<opposites, if any>"],
  "notes": "<usage tips, register formal/informal, cultural notes — in Vietnamese>"
}

Rules:
- All meanings, explanations and notes MUST be in Vietnamese. Korean example sentences stay in Korean.
- targetText is the translation in the target language (${toLabel}).
- mode "word": fill meanings (1–4 senses), exampleSentences (2–3), synonyms, antonyms.
- mode "phrase": fill meanings (idiom meaning + literal hint), exampleSentences (2), notes.
- mode "sentence": fill translation (natural, context-appropriate), grammarPoints (key grammar only), notes if needed.
- mode "grammar": fill grammarPoints (1–3 points), exampleSentences (2–3), notes.
- Provide high-quality, natural, TOPIK-level Korean.`
}
