import { z } from "zod"
import { router, publicProcedure } from "../trpc"
import { callGeminiVisionJSON } from "../lib/gemini"
import type { WritingGrade, ExtractedQuestion } from "@/lib/writing-types"

// ─── Prompts ─────────────────────────────────────────────────────────────────

const buildExtractPrompt = () =>
  `Bạn đang xem ảnh đề thi TOPIK II Câu 53 (쓰기 53번).

Hãy trích xuất thông tin từ ảnh và trả về JSON thuần túy (KHÔNG có markdown, KHÔNG có code fence):
{
  "examRef": "<ví dụ: TOPIK 83회 53번, hoặc null nếu không rõ>",
  "instruction": "<toàn bộ đoạn văn yêu cầu viết bằng tiếng Hàn, đọc chính xác từng chữ>",
  "imageAlt": "<mô tả chi tiết biểu đồ/bảng/hình ảnh trong đề bằng tiếng Việt — bao gồm tiêu đề biểu đồ, tên trục, số liệu cụ thể, xu hướng>",
  "rangeMin": <số ký tự tối thiểu yêu cầu, thường là 200>,
  "rangeMax": <số ký tự tối đa yêu cầu, thường là 300>
}

Nếu không đọc được rõ phần nào, hãy ghi chú [không rõ] trong trường đó.`

const buildGradePrompt = (
  instruction: string,
  imageAlt: string | null,
  answer: string,
) => `Bạn là giám khảo chuyên chấm bài viết kỳ thi TOPIK II (쓰기 53번).

ĐỀ BÀI:
${instruction}
${imageAlt ? `\nMÔ TẢ BIỂU ĐỒ/DỮ LIỆU:\n${imageAlt}\n` : ""}
BÀI VIẾT CỦA THÍ SINH:
${answer}

---
Hãy đánh giá bài viết theo thang điểm TOPIK II 쓰기 53번 (tổng 30 điểm):

1. NỘI DUNG & HOÀN THÀNH YÊU CẦU (내용 및 과제 수행): tối đa 10 điểm
   - Có đề cập đủ thông tin từ đề bài/biểu đồ không?
   - Trả lời đúng yêu cầu của đề không?
   - Thông tin có chính xác theo dữ liệu biểu đồ không?

2. BỐ CỤC & MẠCH LẠC (글의 전개 구조): tối đa 10 điểm
   - Cấu trúc rõ ràng (mở đầu - thân bài - kết luận) không?
   - Các ý có liên kết mạch lạc không?
   - Sử dụng từ nối phù hợp không?

3. NGỮ PHÁP & TỪ VỰNG (언어 사용): tối đa 10 điểm
   - Ngữ pháp có chính xác không?
   - Từ vựng có phong phú và phù hợp không?
   - Chính tả có đúng không?

NGUYÊN TẮC CHẤM:
- Feedback bằng tiếng Việt để học viên dễ hiểu
- Giữ nguyên câu tiếng Hàn gốc trong phần sửa lỗi
- Chỉ sửa lỗi thực sự — không sửa vì "có thể nói cách khác"
- Không bịa ra lỗi không có. Nếu câu đúng, isCorrect = true
- content.score + organization.score + language.score = totalScore
- Điểm tối đa 30, KHÔNG được vượt quá

Trả về JSON thuần túy (KHÔNG có markdown, KHÔNG có code fence):
{
  "totalScore": <0-30>,
  "maxScore": 30,
  "criteria": {
    "content":      { "score": <0-10>, "maxScore": 10, "feedback": "<tiếng Việt>" },
    "organization": { "score": <0-10>, "maxScore": 10, "feedback": "<tiếng Việt>" },
    "language":     { "score": <0-10>, "maxScore": 10, "feedback": "<tiếng Việt>" }
  },
  "overallFeedback": "<nhận xét tổng quát tiếng Việt>",
  "strengths": ["<điểm mạnh 1>", "<điểm mạnh 2>"],
  "grammarCorrections": [
    { "original": "<câu gốc tiếng Hàn>", "corrected": "<câu đã sửa tiếng Hàn>", "explanation": "<giải thích tiếng Việt>" }
  ],
  "vocabularyCorrections": [
    { "original": "<từ/cụm từ gốc>", "suggested": "<đề xuất>", "explanation": "<giải thích tiếng Việt>" }
  ],
  "sampleAnswer": "<bài mẫu tham khảo 200-300 ký tự bằng tiếng Hàn>"
}`

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const extractedSchema = z.object({
  examRef: z.string().nullable(),
  instruction: z.string(),
  imageAlt: z.string(),
  rangeMin: z.number().int().min(0),
  rangeMax: z.number().int().min(0),
})

const criterionSchema = z.object({
  score: z.number().min(0).max(10),
  maxScore: z.literal(10),
  feedback: z.string(),
})

const gradeSchema = z.object({
  totalScore: z.number().min(0).max(30),
  maxScore: z.literal(30),
  criteria: z.object({
    content: criterionSchema,
    organization: criterionSchema,
    language: criterionSchema,
  }),
  overallFeedback: z.string(),
  strengths: z.array(z.string()),
  grammarCorrections: z.array(
    z.object({ original: z.string(), corrected: z.string(), explanation: z.string() }),
  ),
  vocabularyCorrections: z.array(
    z.object({ original: z.string(), suggested: z.string(), explanation: z.string() }),
  ),
  sampleAnswer: z.string(),
})

// ─── Router ───────────────────────────────────────────────────────────────────

export const writingRouter = router({
  /** List questions (no imageData for performance) */
  listQuestions: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.prisma.writingQuestion53.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        examRef: true,
        instruction: true,
        imageAlt: true,
        rangeMin: true,
        rangeMax: true,
        createdAt: true,
        _count: { select: { attempts: true } },
      },
    })
    return rows
  }),

  /** Get one question with full imageData */
  getQuestion: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const q = await ctx.prisma.writingQuestion53.findUnique({
        where: { id: input.id },
      })
      if (!q) throw new Error("Question not found")
      return q
    }),

  /** Use Gemini Vision to extract question data from an uploaded image */
  extractFromImage: publicProcedure
    .input(
      z.object({
        imageBase64: z.string().min(1),
        imageMimeType: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const raw = await callGeminiVisionJSON(
        buildExtractPrompt(),
        input.imageBase64,
        input.imageMimeType,
        { temperature: 0.1, maxTokens: 2048 },
      )
      const parsed = extractedSchema.parse(raw) as ExtractedQuestion
      return parsed
    }),

  /** Save a new question to DB */
  saveQuestion: publicProcedure
    .input(
      z.object({
        examRef: z.string().optional(),
        instruction: z.string().min(1),
        imageBase64: z.string().optional(),
        imageMimeType: z.string().optional(),
        imageAlt: z.string().optional(),
        rangeMin: z.number().int().default(200),
        rangeMax: z.number().int().default(300),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const deviceId = ctx.deviceId || "anonymous"
      const q = await ctx.prisma.writingQuestion53.create({
        data: {
          examRef: input.examRef ?? null,
          instruction: input.instruction,
          imageData: input.imageBase64 ?? null,
          imageMimeType: input.imageMimeType ?? null,
          imageAlt: input.imageAlt ?? null,
          rangeMin: input.rangeMin,
          rangeMax: input.rangeMax,
          deviceId,
          ...(ctx.userId ? { userId: ctx.userId } : {}),
        },
      })
      return { id: q.id }
    }),

  /** Grade a writing submission with AI */
  gradeWriting53: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        answer: z.string().min(1, "Bài viết không được để trống"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Fetch question (including image for vision grading)
      const question = await ctx.prisma.writingQuestion53.findUnique({
        where: { id: input.questionId },
      })
      if (!question) throw new Error("Question not found")

      const prompt = buildGradePrompt(question.instruction, question.imageAlt, input.answer)

      let raw: unknown
      if (question.imageData && question.imageMimeType) {
        raw = await callGeminiVisionJSON(
          prompt,
          question.imageData,
          question.imageMimeType,
          { temperature: 0.2, maxTokens: 4096 },
        )
      } else {
        const { callGeminiJSON } = await import("../lib/gemini")
        raw = await callGeminiJSON(prompt, { temperature: 0.2, maxTokens: 4096 })
      }

      const grade = gradeSchema.parse(raw) as WritingGrade
      return grade
    }),

  /** Save a completed attempt to DB */
  saveAttempt: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        answer: z.string(),
        cells: z.array(z.string()).optional(),
        grade: gradeSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const deviceId = ctx.deviceId || "anonymous"
      const attempt = await ctx.prisma.writingAttempt53.create({
        data: {
          questionId: input.questionId,
          deviceId,
          ...(ctx.userId ? { userId: ctx.userId } : {}),
          answer: input.answer,
          cellsJson: input.cells ? (input.cells as string[]) : undefined,
          gradeJson: input.grade as object,
          totalScore: input.grade.totalScore,
        },
      })
      return { id: attempt.id }
    }),

  /** List attempts for a question (for the current device/user) */
  listAttempts: publicProcedure
    .input(z.object({ questionId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId && !ctx.deviceId) return []
      const rows = await ctx.prisma.writingAttempt53.findMany({
        where: {
          questionId: input.questionId,
          ...(ctx.userId ? { userId: ctx.userId } : { deviceId: ctx.deviceId }),
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, totalScore: true, createdAt: true, answer: true, gradeJson: true, cellsJson: true },
      })
      return rows
    }),
})
