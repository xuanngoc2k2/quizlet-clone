import { z } from "zod"
import { router, publicProcedure } from "../trpc"
import { env } from "@/lib/env"

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent"

const buildTestPrompt = (prompt: string) => `You are a TOPIK test generator. Create a Korean language test based on the user's request.

User request: "${prompt}"

Generate a test with EXACTLY 4 sections and 30 total questions.

## Section structure

### Phần 1: Trắc nghiệm khách quan (10 câu)
- Type: "multiple-choice"
- Grammar/vocabulary gap-fill with 4 options
- Question text in Korean with ___ for the blank
- Options in KOREAN ONLY — absolutely NO Vietnamese or English translations next to options
- The Vietnamese meaning should ONLY appear in the "explanation" field

### Phần 2: Chia dạng từ trong ngoặc (10 câu)
- Type: "conjugation"
- Show a Korean sentence with a verb/adjective in parentheses ()
- User must conjugate the word to fit the sentence
- Example: "날씨가 점점 (따뜻하다) ___." → correctAnswer: "따뜻해지고 있어요"

### Phần 3: Tìm câu đồng nghĩa (5 câu)
- Type: "synonym"
- Show a Korean sentence
- 4 options are FULL KOREAN SENTENCES
- User picks the option with the SAME meaning as the original
- Important for language proficiency exams

### Phần 4: Dịch câu tự luận (5 câu)
- Type: "translation"
- Show a Vietnamese sentence
- User writes a full translation in Korean
- Accept any reasonable Korean translation

Respond with VALID JSON ONLY. No markdown, no code fences, no extra text.
{
  "title": "<test title>",
  "description": "<brief description>",
  "sections": [
    {
      "name": "Phần 1: Trắc nghiệm khách quan",
      "instruction": "Chọn đáp án đúng nhất điền vào khoảng trống.",
      "questions": [
        {
          "id": 1,
          "type": "multiple-choice",
          "part": 1,
          "question": "<Korean sentence with ___ for blank>",
          "options": ["<option 1>", "<option 2>", "<option 3>", "<option 4>"],
          "correctAnswer": "<correct option>",
          "explanation": "<explain why + include Vietnamese meaning here>"
        }
      ]
    },
    {
      "name": "Phần 2: Chia dạng từ trong ngoặc",
      "instruction": "Chia dạng đúng của từ trong ngoặc.",
      "questions": [
        {
          "id": 11,
          "type": "conjugation",
          "part": 2,
          "question": "<Korean sentence with (word) to conjugate>",
          "correctAnswer": "<conjugated form>",
          "explanation": "<explanation in English or Vietnamese>"
        }
      ]
    },
    {
      "name": "Phần 3: Tìm câu đồng nghĩa",
      "instruction": "Chọn câu có nghĩa tương đương với câu đã cho.",
      "questions": [
        {
          "id": 21,
          "type": "synonym",
          "part": 3,
          "question": "<original Korean sentence>",
          "options": ["<full sentence A>", "<full sentence B>", "<full sentence C>", "<full sentence D>"],
          "correctAnswer": "<correct full sentence>",
          "explanation": "<explain why this sentence has the same meaning>"
        }
      ]
    },
    {
      "name": "Phần 4: Dịch câu tự luận",
      "instruction": "Dịch câu sau sang tiếng Việt.",
      "questions": [
        {
          "id": 26,
          "type": "translation",
          "part": 4,
          "question": "<Vietnamese sentence to translate into Korean>",
          "correctAnswer": "<reference translation in Korean>",
          "explanation": "<grammar notes or alternative translations>"
        }
      ]
    }
  ]
}

Rules:
- Question IDs must be sequential across all sections: Part 1 = 1-10, Part 2 = 11-20, Part 3 = 21-25, Part 4 = 26-30
- Parts 1-3: question text and options must be in Korean only
- Part 4: question text in Vietnamese, correctAnswer in Korean
- Part 1 options: Korean only, NO Vietnamese/English translations
- Explanations can be in Vietnamese or English (learner's preferred language)
- Use TOPIK level-appropriate grammar and vocabulary
- Each question must have a clear single correct answer`

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

const questionSchema = z.object({
  id: z.number(),
  type: z.enum(["multiple-choice", "conjugation", "synonym", "translation"]),
  part: z.number().min(1).max(4),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string(),
})

const sectionSchema = z.object({
  name: z.string(),
  instruction: z.string(),
  questions: z.array(questionSchema),
})

const testOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  sections: z.array(sectionSchema),
})

const gradePrompt = (questions: string, userAnswers: string) =>
  `You are a Korean language teacher grading a student's test.

Original test questions:
${questions}

Student's answers:
${userAnswers}

Grade each answer. Rules:
- Part 1-3 (multiple-choice, conjugation, synonym): strict grading — exact match required
- Part 4 (translation Vi→Ko): GENEROUS — accept any reasonable Korean translation that captures the meaning of the Vietnamese sentence. Check for correct grammar particles, verb endings, and sentence structure
- If wrong: explain WHY the answer is wrong and give a hint
- If correct: brief confirmation

Respond with VALID JSON ONLY. No markdown, no code fences, no extra text.
{
  "results": [
    {
      "questionId": 1,
      "isCorrect": true/false,
      "userAnswer": "<what the student wrote>",
      "correctAnswer": "<the correct answer>",
      "explanation": "<personalized feedback — detailed if wrong, brief if correct>"
    }
  ],
  "totalCorrect": 0,
  "totalQuestions": 0
}`

const gradeInputSchema = z.object({
  questions: z.array(
    z.object({
      id: z.number(),
      type: z.enum(["multiple-choice", "conjugation", "synonym", "translation"]),
      part: z.number().min(1).max(4),
      question: z.string(),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string(),
      explanation: z.string(),
    }),
  ),
  answers: z.record(z.string()),
})

export const testRouter = router({
  generate: publicProcedure
    .input(z.object({ prompt: z.string().min(1, "Prompt is required") }))
    .mutation(async ({ input }) => {
      const raw = await callGemini(buildTestPrompt(input.prompt))
      const parsed = testOutputSchema.parse(raw)
      return parsed
    }),

  grade: publicProcedure
    .input(gradeInputSchema)
    .mutation(async ({ input }) => {
      const questionsStr = JSON.stringify(input.questions.map((q) => ({
        id: q.id, type: q.type, part: q.part, question: q.question,
        options: q.options, correctAnswer: q.correctAnswer,
      })), null, 2)
      const answersStr = JSON.stringify(input.answers, null, 2)
      const raw = await callGemini(gradePrompt(questionsStr, answersStr))
      const parsed = z.object({
        results: z.array(z.object({
          questionId: z.number(),
          isCorrect: z.boolean(),
          userAnswer: z.string(),
          correctAnswer: z.string(),
          explanation: z.string(),
        })),
        totalCorrect: z.number(),
        totalQuestions: z.number(),
      }).parse(raw)
      return parsed
    }),
})
