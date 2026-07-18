import { z } from "zod"
import { router, publicProcedure } from "../trpc"
import { env } from "@/lib/env"

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

const prompt = `You are a Korean language teacher. Given a Korean sentence, evaluate it and respond in valid JSON only (no markdown, no code fences).

Evaluate these aspects:
1. grammar_score (1-10): How grammatically correct is the sentence?
2. naturalness_score (1-10): How natural does it sound to a native speaker?
3. errors: Array of { error: string, explanation: string, correction: string }
4. improved_sentence: A corrected/natural version of the sentence
5. translation: English translation
6. vocabulary_notes: Brief notes on key vocabulary usage (max 2 sentences)`

type GeminiResponse = {
  grammar_score: number
  naturalness_score: number
  errors: { error: string; explanation: string; correction: string }[]
  improved_sentence: string
  translation: string
  vocabulary_notes: string
}

export const sentencesRouter = router({
  check: publicProcedure
    .input(
      z.object({
        sentence: z.string().min(1, "Sentence is required"),
      }),
    )
    .mutation(async ({ input }) => {
      const res = await fetch(`${GEMINI_API_URL}?key=${env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { text: `Sentence: "${input.sentence}"` },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Gemini API error (${res.status}): ${errorText}`)
      }

      const data = await res.json()

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error("Empty response from Gemini")

      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
      const result: GeminiResponse = JSON.parse(cleaned)

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
      }),
    )
    .mutation(async ({ input }) => {
      const res = await fetch(`${GEMINI_API_URL}?key=${env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a Korean language teacher. Explain the following Korean sentence in detail. Respond in valid JSON only (no markdown, no code fences).

Explain:
1. meaning: English translation
2. grammar: Break down the grammar structure (particles, verb endings, etc.)
3. vocabulary: List key words with their meanings
4. usage_notes: When/how to use this sentence naturally (max 3 sentences)`,
                },
                { text: `Sentence: "${input.sentence}"` },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Gemini API error (${res.status}): ${errorText}`)
      }

      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error("Empty response from Gemini")

      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
      const result = JSON.parse(cleaned)

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
      }),
    )
    .mutation(async ({ input }) => {
      const res = await fetch(`${GEMINI_API_URL}?key=${env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a Korean language teacher. Provide example sentences using the word "${input.word}"${input.definition ? ` (meaning: ${input.definition})` : ""}.

Respond in valid JSON only (no markdown, no code fences):
{
  "examples": [
    {
      "sentence": "Korean sentence",
      "translation": "English translation",
      "grammar_notes": "Brief grammar explanation for this sentence (max 2 sentences)"
    }
  ]
}

Provide 3 example sentences at different difficulty levels (easy, intermediate, advanced).`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Gemini API error (${res.status}): ${errorText}`)
      }

      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error("Empty response from Gemini")

      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
      const result = JSON.parse(cleaned)

      return { examples: result.examples }
    }),
})
