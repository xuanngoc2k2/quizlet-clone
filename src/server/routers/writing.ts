import { z } from "zod"
import { router, publicProcedure, aiProcedure, adminProcedure } from "../trpc"
import { callGeminiVisionJSON } from "../lib/gemini"
import { ADMIN_EMAIL } from "@/lib/auth"
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
  handwritingContext = "",
) => `Bạn là giám khảo chuyên chấm bài viết kỳ thi TOPIK II (쓰기 53번).

ĐỀ BÀI:
${instruction}
${imageAlt ? `\nMÔ TẢ BIỂU ĐỒ/DỮ LIỆU:\n${imageAlt}\n` : ""}
BÀI VIẾT CỦA THÍ SINH:
${answer}
${handwritingContext}

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
- Nếu bài là OCR từ ảnh viết tay, không trừ điểm chỉ vì nét chữ xấu hoặc OCR không chắc chắn.

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
  "sampleAnswer": "<bài mẫu tham khảo 200-300 ký tự bằng tiếng Hàn>",
  "handwriting": {
    "ocrConfidence": <0-1>,
    "spacingScore": <0-10>,
    "spacingFeedback": "<nhận xét khoảng cách và bố cục ô>",
    "spellingErrors": [{ "original": "<từ OCR>", "corrected": "<từ đúng>", "explanation": "<giải thích>" }],
    "layoutWarnings": ["<cảnh báo nếu có>"]
  }
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
  handwriting: z
    .object({
      ocrConfidence: z.number().min(0).max(1),
      spacingScore: z.number().min(0).max(10),
      spacingFeedback: z.string(),
      spellingErrors: z.array(
        z.object({ original: z.string(), corrected: z.string(), explanation: z.string() }),
      ),
      layoutWarnings: z.array(z.string()),
    })
    .optional(),
})

const handwrittenOcrSchema = z.object({
  text: z.string(),
  cells: z.array(z.string()).length(300),
  ocrConfidence: z.number().min(0).max(1),
  spacingScore: z.number().min(0).max(10),
  spacingFeedback: z.string(),
  spellingErrors: z.array(
    z.object({ original: z.string(), corrected: z.string(), explanation: z.string() }),
  ),
  layoutWarnings: z.array(z.string()),
})

const buildHandwrittenOcrPrompt = (rangeMin: number, rangeMax: number) => `Bạn là công cụ OCR chuyên đọc bài viết tiếng Hàn viết tay trên giấy 원고지.

Hãy đọc ảnh và trả về JSON thuần túy (không markdown):
{
  "text": "<toàn bộ bài viết, giữ nguyên dấu câu và khoảng cách có ý nghĩa>",
  "cells": ["<đúng 300 phần tử, mỗi phần tử là nội dung một ô; ô trống là chuỗi rỗng>"],
  "ocrConfidence": <0-1, độ chắc chắn khi đọc chữ>,
  "spacingScore": <0-10, chấm riêng việc dùng ô và khoảng cách 원고지>,
  "spacingFeedback": "<nhận xét tiếng Việt>",
  "spellingErrors": [{ "original": "<từ đọc được>", "corrected": "<từ đúng>", "explanation": "<tiếng Việt>" }],
  "layoutWarnings": ["<cảnh báo tiếng Việt>"]
}

Quy tắc:
- Đếm từng ô theo thứ tự trái sang phải, trên xuống dưới; không tự dồn chữ.
- Khoảng trắng thật trong ảnh phải được giữ bằng ô trống.
- Nếu không chắc một ký tự, giữ ký tự gần nhất và thêm cảnh báo.
- Bài chuẩn có khoảng ${rangeMin}-${rangeMax} ký tự; không tự cắt bài.
- Mảng cells bắt buộc có đúng 300 phần tử.`

// ─── Router ───────────────────────────────────────────────────────────────────

export const writingRouter = router({
  /** List questions (no imageData for performance) */
  listQuestions: publicProcedure
    .input(z.object({ page: z.number().int().min(1).default(1) }))
    .query(async ({ input, ctx }) => {
      const pageSize = 10
      const attemptScope = ctx.userId ? { userId: ctx.userId } : { deviceId: ctx.deviceId }
      const [rows, total] = await Promise.all([
        ctx.prisma.writingQuestion53.findMany({
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            examRef: true,
            instruction: true,
            imageAlt: true,
            rangeMin: true,
            rangeMax: true,
            createdAt: true,
            _count: { select: { attempts: { where: attemptScope } } },
            attempts: {
              where: attemptScope,
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { totalScore: true, createdAt: true },
            },
          },
        }),
        ctx.prisma.writingQuestion53.count(),
      ])

      const isAdmin = ctx.user?.role === "ADMIN" || ctx.user?.email?.toLowerCase() === ADMIN_EMAIL
      const participantCounts = new Map<string, number>()
      if (isAdmin && rows.length > 0) {
        const participants = await ctx.prisma.writingAttempt53.groupBy({
          by: ["questionId", "userId", "deviceId"],
          where: { questionId: { in: rows.map((row) => row.id) } },
        })
        for (const participant of participants) {
          participantCounts.set(
            participant.questionId,
            (participantCounts.get(participant.questionId) ?? 0) + 1,
          )
        }
      }

      return {
        questions: rows.map((row) => {
          const { attempts, ...question } = row
          return {
            ...question,
            latestScore: attempts[0]?.totalScore ?? null,
            participantCount: participantCounts.get(row.id) ?? 0,
          }
        }),
        total,
        page: input.page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      }
    }),

  /** Get one question with full imageData */
  getQuestion: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const q = await ctx.prisma.writingQuestion53.findUnique({
      where: { id: input.id },
    })
    if (!q) throw new Error("Question not found")
    return q
  }),

  /** Use Gemini Vision to extract question data from an uploaded image */
  extractFromImage: adminProcedure
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
  saveQuestion: adminProcedure
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
  gradeWriting53: aiProcedure
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
        raw = await callGeminiVisionJSON(prompt, question.imageData, question.imageMimeType, {
          temperature: 0.2,
          maxTokens: 4096,
        })
      } else {
        const { callGeminiJSON } = await import("../lib/gemini")
        raw = await callGeminiJSON(prompt, { temperature: 0.2, maxTokens: 4096 })
      }

      const grade = gradeSchema.parse(raw) as WritingGrade
      return grade
    }),

  /** OCR and grade a handwritten submission, keeping the original image for review. */
  gradeHandwritten53: aiProcedure
    .input(
      z.object({
        questionId: z.string(),
        imageBase64: z.string().min(1),
        imageMimeType: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const question = await ctx.prisma.writingQuestion53.findUnique({
        where: { id: input.questionId },
      })
      if (!question) throw new Error("Question not found")

      const ocrRaw = await callGeminiVisionJSON(
        buildHandwrittenOcrPrompt(question.rangeMin, question.rangeMax),
        input.imageBase64,
        input.imageMimeType,
        { temperature: 0.1, maxTokens: 4096 },
      )
      const ocr = handwrittenOcrSchema.parse(ocrRaw)
      const handwritingContext = `\nTHÔNG TIN OCR BÀI VIẾT TAY:\n- Độ tin cậy OCR: ${ocr.ocrConfidence}\n- Điểm khoảng cách ô: ${ocr.spacingScore}/10\n- Nhận xét khoảng cách: ${ocr.spacingFeedback}\n- Cảnh báo bố cục: ${ocr.layoutWarnings.join("; ") || "Không có"}\n- Lỗi chính tả do OCR phát hiện: ${ocr.spellingErrors.map((item) => `${item.original} → ${item.corrected}`).join(", ") || "Không có"}`
      const prompt = buildGradePrompt(question.instruction, question.imageAlt, ocr.text, handwritingContext)
      const { callGeminiJSON } = await import("../lib/gemini")
      const raw = await callGeminiJSON(prompt, { temperature: 0.2, maxTokens: 4096 })
      const grade = gradeSchema.parse({
        ...(raw as Record<string, unknown>),
        handwriting: {
          ocrConfidence: ocr.ocrConfidence,
          spacingScore: ocr.spacingScore,
          spacingFeedback: ocr.spacingFeedback,
          spellingErrors: ocr.spellingErrors,
          layoutWarnings: ocr.layoutWarnings,
        },
      }) as WritingGrade
      const deviceId = ctx.deviceId || "anonymous"
      await ctx.prisma.writingAttempt53.create({
        data: {
          questionId: input.questionId,
          deviceId,
          ...(ctx.userId ? { userId: ctx.userId } : {}),
          answer: ocr.text,
          cellsJson: ocr.cells,
          submissionType: "handwritten",
          imageData: input.imageBase64,
          imageMimeType: input.imageMimeType,
          ocrText: ocr.text,
          ocrCellsJson: ocr.cells,
          gradeJson: grade as object,
          totalScore: grade.totalScore,
        },
      })
      return { grade, answer: ocr.text, cells: ocr.cells, ocr }
    }),

  /** Save a completed attempt to DB */
  saveAttempt: publicProcedure
    .input(
      z.object({
        questionId: z.string(),
        answer: z.string(),
        cells: z.array(z.string()).optional(),
        submissionType: z.enum(["typed", "handwritten"]).default("typed"),
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
          submissionType: input.submissionType,
          gradeJson: input.grade as object,
          totalScore: input.grade.totalScore,
        },
      })
      return { id: attempt.id }
    }),

  /** List attempts for a question; admins can review attempts from all users. */
  listAttempts: publicProcedure
    .input(z.object({ questionId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId && !ctx.deviceId) return []
      const isAdmin =
        ctx.user?.role === "ADMIN" || ctx.user?.email?.toLowerCase() === ADMIN_EMAIL
      const rows = await ctx.prisma.writingAttempt53.findMany({
        where: {
          questionId: input.questionId,
          ...(isAdmin
            ? {}
            : ctx.userId
              ? { userId: ctx.userId }
              : { deviceId: ctx.deviceId }),
        },
        orderBy: { createdAt: "desc" },
        ...(isAdmin ? {} : { take: 10 }),
        select: {
          id: true,
          totalScore: true,
          createdAt: true,
          answer: true,
          gradeJson: true,
          cellsJson: true,
          imageData: true,
          imageMimeType: true,
          submissionType: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })
      return rows
    }),
})
