import { z } from "zod"
import { router, publicProcedure } from "../trpc"
import { env } from "@/lib/env"

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent"

const buildTestPrompt = (prompt: string) => `You are a TOPIK II test generator. Create a Korean language test based on the user's request.

User request: "${prompt}"

Generate a test with EXACTLY 12 questions mixing these types:
- "multiple-choice": Grammar/vocabulary MC with 4 options
- "conjugation": Fill blank with correct verb conjugation
- "synonym": Choose the synonym or similar expression
- "translation": Translate a Korean sentence (English or Vietnamese)

Respond with VALID JSON ONLY. No markdown, no code fences, no extra text.
{
  "title": "<test title>",
  "description": "<brief description>",
  "questions": [
    {
      "id": 1,
      "type": "multiple-choice" | "conjugation" | "synonym" | "translation",
      "question": "<question text in Korean, with ___ for blanks>",
      "options": ["<for multiple-choice: 4 options>"],
      "correctAnswer": "<correct answer>",
      "explanation": "<why this answer is correct in English or Vietnamese based on context>"
    }
  ]
}

Rules:
- All question text must be in Korean
- Each question must have a clear single correct answer
- "translation" questions: show Korean sentence, ask for translation
- "conjugation" questions: show a sentence with ___ for the blank
- "synonym" questions: show a phrase, ask for the closest synonym
- Explanations should help the learner understand WHY
- Use TOPIK II level appropriate grammar and vocabulary
- Include a mix of grammar, vocabulary, and expression questions`

async function callGemini(systemPrompt: string) {
  const res = await fetch(`${GEMINI_API_URL}?key=${env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
      },
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    if (res.status === 429) {
      throw new Error("AI quota exceeded. Please wait and try again.")
    }
    throw new Error(`Gemini API error (${res.status}): ${errorText}`)
  }

  const data = await res.json()
  const candidate = data?.candidates?.[0]
  if (!candidate) {
    const finishReason = candidate?.finishReason ?? "unknown"
    throw new Error(`Empty Gemini response (finishReason: ${finishReason})`)
  }
  let text = candidate?.content?.parts?.[0]?.text
  if (!text) throw new Error("Empty content from Gemini")

  text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace !== -1) {
    text = text.slice(firstBrace, lastBrace + 1)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON from Gemini (${text.length} chars): ${text.slice(0, 300)}`)
  }
}

const testOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(
    z.object({
      id: z.number(),
      type: z.enum(["multiple-choice", "conjugation", "synonym", "translation"]),
      question: z.string(),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string(),
      explanation: z.string(),
    }),
  ),
})

export const testRouter = router({
  generate: publicProcedure
    .input(z.object({ prompt: z.string().min(1, "Prompt is required") }))
    .mutation(async ({ input }) => {
      const raw = await callGemini(buildTestPrompt(input.prompt))
      const parsed = testOutputSchema.parse(raw)
      return parsed
    }),
})
