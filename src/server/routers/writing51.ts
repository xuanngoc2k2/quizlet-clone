import { z } from "zod"
import { router, publicProcedure } from "../trpc"
import { callGeminiJSON, callGeminiVisionJSON } from "../lib/gemini"
import {
  gradeWritingQuestion51,
  WRITING_QUESTION_51_BLANK_SCORE,
  WRITING_QUESTION_51_TOTAL_SCORE,
  validateWritingQuestion51Content,
} from "@/lib/writing-question-51"
import type { WritingBlank51 } from "@/lib/writing-types"

const passageSegmentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), content: z.string() }),
  z.object({
    type: z.literal("blank"),
    id: z.string().min(1),
    label: z.enum(["ㄱ", "ㄴ"]),
  }),
])

const blankSchema = z.object({
  id: z.string().min(1),
  label: z.enum(["ㄱ", "ㄴ"]),
  answer: z.array(z.string()).default([]),
  explanation: z.string().optional(),
})

const contentSchema = z.object({
  questionNumber: z.number().int().default(51),
  title: z.string().trim().min(1),
  instruction: z.string().trim().min(1),
  passage: z.array(passageSegmentSchema).min(1),
  blanks: z.array(blankSchema).min(1),
  score: z.literal(WRITING_QUESTION_51_TOTAL_SCORE).default(WRITING_QUESTION_51_TOTAL_SCORE),
  difficulty: z.string().optional(),
  source: z.string().optional(),
})

const answerSchema = z.record(z.string())

const extractionSchema = z.object({
  questionNumber: z.number().int().default(51),
  title: z.string().min(1),
  instruction: z.string().min(1),
  passage: z.array(passageSegmentSchema).min(1),
  blanks: z.array(blankSchema).min(1),
  score: z.literal(WRITING_QUESTION_51_TOTAL_SCORE).default(WRITING_QUESTION_51_TOTAL_SCORE),
  source: z.string().optional(),
})

const aiGradeSchema = z.object({
  results: z.array(z.object({
    blankId: z.string(),
    status: z.enum(["correct", "partial", "incorrect", "unanswered"]),
    vocabularyScore: z.number().int().min(0).max(2),
    grammarScore: z.number().int().min(0).max(3),
    explanation: z.string().optional(),
  })),
})

const buildExtractionPrompt = () => `Bạn là công cụ OCR đề TOPIK II Writing Question 51.

Đọc ảnh đề thi và trả về JSON thuần túy, không markdown, theo schema:
{
  "questionNumber": 51,
  "title": "tiêu đề đề bài bằng tiếng Việt hoặc tiếng Hàn",
  "instruction": "hướng dẫn nguyên văn",
  "passage": [
    { "type": "text", "content": "..." },
    { "type": "blank", "id": "blank-1", "label": "ㄱ" }
  ],
  "blanks": [
    { "id": "blank-1", "label": "ㄱ", "answer": ["đáp án hợp lệ 1"], "explanation": "giải thích ngắn" }
  ],
  "score": 10,
  "source": "nguồn đề nếu nhìn thấy, nếu không dùng chuỗi rỗng"
}

Quy tắc bắt buộc:
- Giữ nguyên tiếng Hàn, dấu câu và xuống dòng trong passage.
- Mỗi vị trí (ㄱ), (ㄴ) phải là một segment blank inline, không đưa marker vào text.
- ID blank phải duy nhất và khớp tuyệt đối giữa passage và blanks.
- Không tự bịa đáp án; chỉ ghi đáp án nhìn thấy rõ hoặc suy luận chắc chắn từ ngữ cảnh.
- Nếu đề có hai cách trả lời hợp lệ, đưa cả hai vào answer.
`

const buildAiGradePrompt = (
  title: string,
  instruction: string,
  passage: unknown,
  blanks: WritingBlank51[],
  answers: Record<string, string>,
) => `Bạn là giám khảo TOPIK II Writing Question 51.

ĐỀ: ${title}
HƯỚNG DẪN: ${instruction}
PASSAGE STRUCTURED: ${JSON.stringify(passage)}
ĐÁP ÁN CHUẨN THEO BLANK: ${JSON.stringify(blanks.map((blank) => ({ id: blank.id, label: blank.label, answers: blank.answer })))}
BÀI LÀM: ${JSON.stringify(answers)}

Trả về JSON thuần túy:
{
  "results": [
    { "blankId": "blank-1", "status": "correct|partial|incorrect|unanswered", "vocabularyScore": 0, "grammarScore": 0, "explanation": "giải thích bằng tiếng Việt" }
  ]
}

Quy tắc:
- Phải trả đúng một result cho từng blankId, không đổi ID.
- Trim khoảng trắng; chấp nhận cách diễn đạt tương đương khi vẫn đúng ngữ pháp và ý nghĩa.
- Câu trả lời rỗng là unanswered.
- Mỗi blank tối đa ${WRITING_QUESTION_51_BLANK_SCORE} điểm: vocabularyScore từ 0 đến 2, grammarScore từ 0 đến 3. Điểm blank là tổng hai trường này.
- Chỉ dùng correct khi đạt đủ 5 điểm; dùng partial khi đạt từ 1 đến 4 điểm.
- Không được đánh dấu correct nếu câu trả lời trái nghĩa, sai ngữ pháp trọng yếu hoặc không hoàn thành yêu cầu.
- explanation ngắn, rõ, bằng tiếng Việt.
`

function parseQuestionContent(question: { passage: unknown; blanks: unknown }) {
  return {
    passage: z.array(passageSegmentSchema).parse(question.passage),
    blanks: z.array(blankSchema).parse(question.blanks),
  }
}

export const writing51Router = router({
  extractFromImage: publicProcedure
    .input(z.object({ imageBase64: z.string().min(1), imageMimeType: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const raw = await callGeminiVisionJSON(
        buildExtractionPrompt(),
        input.imageBase64,
        input.imageMimeType,
        { temperature: 0.1, maxTokens: 4096 },
      )
      const extracted = extractionSchema.parse(raw)
      const validationErrors = validateWritingQuestion51Content(extracted)
      if (validationErrors.length) throw new Error(validationErrors.join("; "))
      return extracted
    }),

  listQuestions: publicProcedure
    .input(z.object({ page: z.number().int().min(1).default(1) }))
    .query(async ({ input, ctx }) => {
      const pageSize = 10
      const [questions, total] = await Promise.all([
        ctx.prisma.writingQuestion51.findMany({
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            questionNumber: true,
            title: true,
            instruction: true,
            score: true,
            difficulty: true,
            source: true,
            createdAt: true,
            blanks: true,
            _count: { select: { attempts: true } },
            attempts: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { score: true, maxScore: true },
            },
          },
        }),
        ctx.prisma.writingQuestion51.count(),
      ])

      return {
        questions: questions.map(({ attempts, ...question }) => ({
          ...question,
          blankCount: z.array(blankSchema).parse(question.blanks).length,
          latestScore: attempts[0]?.score ?? null,
          latestMaxScore: attempts[0]?.maxScore ?? question.score,
        })),
        total,
        page: input.page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      }
    }),

  getQuestion: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const question = await ctx.prisma.writingQuestion51.findUnique({ where: { id: input.id } })
    if (!question) throw new Error("Question not found")
    const content = parseQuestionContent(question)
    return { ...question, ...content }
  }),

  saveQuestion: publicProcedure.input(contentSchema).mutation(async ({ input, ctx }) => {
    const validationErrors = validateWritingQuestion51Content(input)
    if (validationErrors.length) {
      throw new Error(validationErrors.join("; "))
    }

    const deviceId = ctx.deviceId || "anonymous"
    const question = await ctx.prisma.writingQuestion51.create({
      data: {
        questionNumber: input.questionNumber,
        title: input.title,
        instruction: input.instruction,
        passage: input.passage,
        blanks: input.blanks,
        score: input.score,
        difficulty: input.difficulty ?? null,
        source: input.source ?? null,
        deviceId,
        ...(ctx.userId ? { userId: ctx.userId } : {}),
      },
    })
    return { id: question.id }
  }),

  checkAnswer: publicProcedure
    .input(z.object({ questionId: z.string(), answers: answerSchema }))
    .mutation(async ({ input, ctx }) => {
      const question = await ctx.prisma.writingQuestion51.findUnique({ where: { id: input.questionId } })
      if (!question) throw new Error("Question not found")
      const { blanks } = parseQuestionContent(question)
      const fallbackGrade = gradeWritingQuestion51(
        { blanks: blanks as WritingBlank51[], score: question.score },
        input.answers,
      )

      let grade = fallbackGrade
      try {
        const raw = await callGeminiJSON(
          buildAiGradePrompt(question.title, question.instruction, question.passage, blanks as WritingBlank51[], input.answers),
          { temperature: 0.1, maxTokens: 2048 },
        )
        const aiGrade = aiGradeSchema.parse(raw)
        const aiResults = new Map(aiGrade.results.map((result) => [result.blankId, result]))
        const results = (blanks as WritingBlank51[]).map((blank) => {
          const aiResult = aiResults.get(blank.id)
          const answer = input.answers[blank.id] ?? ""
          const vocabularyScore = aiResult?.vocabularyScore ?? 0
          const grammarScore = aiResult?.grammarScore ?? 0
          const score = vocabularyScore + grammarScore
          return {
            blankId: blank.id,
            label: blank.label,
            answer,
            status: !answer.trim()
              ? "unanswered" as const
              : score === 5
                ? "correct" as const
                : score > 0
                  ? "partial" as const
                  : "incorrect" as const,
            acceptedAnswers: blank.answer,
            vocabularyScore,
            grammarScore,
            score,
            maxScore: WRITING_QUESTION_51_BLANK_SCORE,
            ...(aiResult?.explanation || blank.explanation
              ? { explanation: aiResult?.explanation ?? blank.explanation }
              : {}),
          }
        })
        const correctCount = results.filter((result) => result.status === "correct").length
        grade = {
          results,
          correctCount,
          totalCount: results.length,
          score: results.reduce((total, result) => total + result.score, 0),
          maxScore: question.score,
        }
      } catch {
        // Deterministic grading keeps submissions usable when Gemini is unavailable.
      }

      await ctx.prisma.writingAttempt51.create({
        data: {
          questionId: question.id,
          deviceId: ctx.deviceId || "anonymous",
          ...(ctx.userId ? { userId: ctx.userId } : {}),
          answers: input.answers,
          score: grade.score,
          maxScore: grade.maxScore,
        },
      })

      return grade
    }),

  listAttempts: publicProcedure
    .input(z.object({ questionId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId && !ctx.deviceId) return []
      return ctx.prisma.writingAttempt51.findMany({
        where: {
          questionId: input.questionId,
          ...(ctx.userId ? { userId: ctx.userId } : { deviceId: ctx.deviceId }),
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, answers: true, score: true, maxScore: true, createdAt: true },
      })
    }),
})