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
- Include a "grammarHint" field for each question — suggest relevant grammar structures (e.g. "-자마자", "-(으)ㄹ 줄 알다") to help the learner

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
          "grammarHint": "<grammar structure hint e.g. -(으)ㄹ 줄 알다, -자마자>",
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
  grammarHint: z.string().optional(),
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
  `You are a TOPIK writing teacher (giảng viên chuyên luyện thi TOPIK II). Grade the student's test and give detailed feedback.

Original test questions:
${questions}

Student's answers:
${userAnswers}

Grade each answer. Rules:
- Part 1-3 (multiple-choice, conjugation, synonym): strict grading — exact match required. Short explanation. Set score to 10 if correct, 0 if wrong.
- Part 4 (translation Vi→Ko): Grade generously but thoroughly. Assign a score from 0-10 based on accuracy, grammar, vocab, and style. The "explanation" field MUST contain detailed feedback in this EXACT format:

Trong kỳ thi TOPIK II (đặc biệt là phần Viết), việc sử dụng đúng ngữ pháp, văn phong (trang trọng/văn viết) và chính tả là yếu tố then chốt để đạt điểm cao.

---

### **Câu {questionId}**
**Đề bài:** "{question text}"
**Học sinh dịch:** "{user answer or (Để trống)}"

1. **Đáp án của bạn:** **{score}/10 điểm.**
2. **Nhận xét/Sửa lỗi:**
- **Về ngữ pháp:** <analyze grammar usage, point out specific errors>
- **Về văn phong:** <analyze politeness level, suggest TOPIK-appropriate style>
- **Lưu ý:** <any additional notes, common mistakes, spelling issues>
3. **Câu mẫu đề xuất (Văn phong TOPIK):**
- **Văn nói trang trọng:** <natural polite version>
- **Văn viết (Dạng văn xuôi/biểu đồ):** <formal written TOPIK version>

Also include a final section at the end of the LAST question's explanation:

---

### **Tổng kết lời khuyên cho học sinh:**
1. <tip 1>
2. <tip 2>
3. <tip 3>

This overall advice should only appear in the last question (highest questionId) of Part 4.

Respond with VALID JSON ONLY. No markdown, no code fences, no extra text.
{
  "results": [
    {
      "questionId": 1,
      "isCorrect": true/false,
      "score": 0-10,
      "userAnswer": "<what the student wrote>",
      "correctAnswer": "<the correct answer>",
      "explanation": "<For Part 4: full structured feedback with all sections above. For Parts 1-3: short explanation.>"
    }
  ],
  "totalCorrect": 0,
  "totalQuestions": 0
}`

const buildRefinePrompt = (prompt: string) =>
  `You are a Korean language test prompt optimizer. The user wants a test but their prompt may be vague or refer to textbook units without listing specifics.

User prompt: "${prompt}"

If the prompt mentions a textbook (like "Korean Grammar in Use") and unit numbers, EXPAND with the exact grammar points from those units.
If the prompt is vague (e.g. "intermediate grammar"), make reasonable assumptions about what topics to include.

Return ONLY the expanded prompt text — a detailed, specific test specification. No JSON, no markdown, no extra text.`

const gradeInputSchema = z.object({
  questions: z.array(
    z.object({
      id: z.number(),
      type: z.enum(["multiple-choice", "conjugation", "synonym", "translation"]),
      part: z.number().min(1).max(4),
      question: z.string(),
      options: z.array(z.string()).optional(),
      grammarHint: z.string().optional(),
      correctAnswer: z.string(),
      explanation: z.string(),
    }),
  ),
  answers: z.record(z.string()),
})

async function callGeminiText(systemPrompt: string) {
  const res = await fetch(`${GEMINI_API_URL}?key=${env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
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
    throw new Error(`Empty Gemini response (finishReason: ${candidate?.finishReason ?? "unknown"})`)
  }
  const text = candidate?.content?.parts?.[0]?.text
  if (!text) throw new Error("Empty content from Gemini")
  return text.trim()
}

export const testRouter = router({
  refinePrompt: publicProcedure
    .input(z.object({ prompt: z.string().min(1, "Prompt is required") }))
    .mutation(async ({ input }) => {
      const refined = await callGeminiText(buildRefinePrompt(input.prompt))
      return { refined }
    }),

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
          score: z.number().min(0).max(10).optional(),
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
