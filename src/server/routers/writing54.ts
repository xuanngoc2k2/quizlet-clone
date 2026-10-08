import { z } from "zod"
import { router, publicProcedure, aiProcedure } from "../trpc"
import { callGeminiJSON, callGeminiVisionJSON } from "../lib/gemini"

const buildExtractPrompt = () => `Bạn đang xem ảnh đề thi TOPIK II Câu 54 (쓰기 54번).

Hãy trích xuất chính xác và trả về JSON thuần túy:
{
  "examRef": "<kỳ thi/câu nếu nhìn thấy, hoặc null>",
  "instruction": "<toàn bộ hướng dẫn tiếng Hàn>",
  "imageAlt": "<mô tả tiếng Việt đầy đủ nội dung đề, các gợi ý và yêu cầu>",
  "rangeMin": 600,
  "rangeMax": 700
}

Nếu ảnh không ghi rõ số ký tự, dùng 600 và 700. Không thêm markdown.`

const buildGradePrompt = (
  instruction: string,
  imageAlt: string | null,
  answer: string,
  handwritingContext = "",
) => `Bạn là giám khảo chấm TOPIK II 쓰기 54번.

ĐỀ BÀI:
${instruction}
${imageAlt ? `\nMÔ TẢ NỘI DUNG ĐỀ:\n${imageAlt}\n` : ""}
BÀI VIẾT:
${answer}
${handwritingContext}

Chấm đúng barem tham khảo sau, tổng tối đa 50 điểm:
1. 내용 (Nội dung): 15 điểm. Đúng chủ đề 5, trả lời đủ yêu cầu 5, phát triển ý và ví dụ 5.
2. 구성 (Bố cục): 15 điểm. Đủ 4 đoạn 5, phân đoạn đúng chức năng 5, logic/mạch lạc 5.
3. 표현 (Biểu đạt): 10 điểm. Từ nối phù hợp 4, đa dạng cấu trúc câu 3, có câu nâng cao 3.
4. 정확성 (Chính xác): 10 điểm. Ngữ pháp đúng 5, từ vựng phù hợp 3, chính tả/chia câu 2.

Quy tắc: feedback bằng tiếng Việt; giữ nguyên câu Hàn khi sửa; không bịa lỗi; không trừ lỗi OCR hoặc nét chữ. Tổng điểm phải bằng tổng 4 tiêu chí và không vượt quá 50.
Trả về JSON thuần túy, không markdown:
{
  "totalScore": 0,
  "maxScore": 50,
  "criteria": {
    "content": { "score": 0, "maxScore": 15, "feedback": "" },
    "organization": { "score": 0, "maxScore": 15, "feedback": "" },
    "expression": { "score": 0, "maxScore": 10, "feedback": "" },
    "accuracy": { "score": 0, "maxScore": 10, "feedback": "" }
  },
  "overallFeedback": "",
  "strengths": [],
  "grammarCorrections": [{ "original": "", "corrected": "", "explanation": "" }],
  "vocabularyCorrections": [{ "original": "", "suggested": "", "explanation": "" }],
  "sampleAnswer": "<bài mẫu tiếng Hàn 600-700 ký tự>"
}`

const extractedSchema = z.object({
  examRef: z.string().nullable(),
  instruction: z.string().min(1),
  imageAlt: z.string(),
  rangeMin: z.number().int().min(1).default(600),
  rangeMax: z.number().int().min(1).default(700),
})

const criterionSchema = (maxScore: number) => z.object({
  score: z.number().min(0).max(maxScore),
  maxScore: z.literal(maxScore),
  feedback: z.string(),
})

const gradeSchema = z.object({
  totalScore: z.number().min(0).max(50),
  maxScore: z.literal(50),
  criteria: z.object({
    content: criterionSchema(15),
    organization: criterionSchema(15),
    expression: criterionSchema(10),
    accuracy: criterionSchema(10),
  }),
  overallFeedback: z.string(),
  strengths: z.array(z.string()),
  grammarCorrections: z.array(z.object({ original: z.string(), corrected: z.string(), explanation: z.string() })),
  vocabularyCorrections: z.array(z.object({ original: z.string(), suggested: z.string(), explanation: z.string() })),
  sampleAnswer: z.string(),
  handwriting: z.object({
    ocrConfidence: z.number().min(0).max(1),
    spacingScore: z.number().min(0).max(10),
    spacingFeedback: z.string(),
    spellingErrors: z.array(z.object({ original: z.string(), corrected: z.string(), explanation: z.string() })),
    layoutWarnings: z.array(z.string()),
  }).optional(),
}).superRefine((grade, context) => {
  const criteriaTotal = Object.values(grade.criteria).reduce((sum, criterion) => sum + criterion.score, 0)
  if (criteriaTotal !== grade.totalScore) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Tổng điểm không khớp tổng điểm các tiêu chí" })
  }
})

const handwrittenOcrSchema = z.object({
  text: z.string(),
  cells: z.array(z.string()).length(700),
  ocrConfidence: z.number().min(0).max(1),
  spacingScore: z.number().min(0).max(10),
  spacingFeedback: z.string(),
  spellingErrors: z.array(z.object({ original: z.string(), corrected: z.string(), explanation: z.string() })),
  layoutWarnings: z.array(z.string()),
})

const buildHandwrittenOcrPrompt = (rangeMin: number, rangeMax: number) => `Bạn là OCR chuyên đọc bài tiếng Hàn viết tay trên giấy 원고지 câu 54.
Đọc toàn bộ một trang ảnh và trả về JSON thuần túy:
{
  "text": "<bài viết giữ nguyên dấu câu>",
  "cells": ["<đúng 700 ô, trái sang phải, trên xuống dưới; ô trống là chuỗi rỗng>"],
  "ocrConfidence": 0,
  "spacingScore": 0,
  "spacingFeedback": "",
  "spellingErrors": [],
  "layoutWarnings": []
}
Bài yêu cầu ${rangeMin}-${rangeMax} ký tự. Không tự cắt bài. Mảng cells bắt buộc đúng 700 phần tử.`

export const writing54Router = router({
  listQuestions: publicProcedure
    .input(z.object({ page: z.number().int().min(1).default(1) }))
    .query(async ({ input, ctx }) => {
      const pageSize = 10
      const [rows, total] = await Promise.all([
        ctx.prisma.writingQuestion54.findMany({
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true, examRef: true, instruction: true, imageAlt: true,
            rangeMin: true, rangeMax: true, createdAt: true,
            _count: { select: { attempts: true } },
            attempts: { orderBy: { createdAt: "desc" }, take: 1, select: { totalScore: true } },
          },
        }),
        ctx.prisma.writingQuestion54.count(),
      ])
      return {
        questions: rows.map(({ attempts, ...question }) => ({
          ...question,
          latestScore: attempts[0]?.totalScore ?? null,
        })),
        total,
        page: input.page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      }
    }),

  getQuestion: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const question = await ctx.prisma.writingQuestion54.findUnique({ where: { id: input.id } })
    if (!question) throw new Error("Question not found")
    return question
  }),

  extractFromImage: aiProcedure
    .input(z.object({ imageBase64: z.string().min(1), imageMimeType: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const raw = await callGeminiVisionJSON(buildExtractPrompt(), input.imageBase64, input.imageMimeType, {
        temperature: 0.1,
        maxTokens: 2048,
      })
      return extractedSchema.parse(raw)
    }),

  saveQuestion: publicProcedure
    .input(z.object({
      examRef: z.string().optional(),
      instruction: z.string().min(1),
      imageBase64: z.string().optional(),
      imageMimeType: z.string().optional(),
      imageAlt: z.string().optional(),
      rangeMin: z.number().int().min(1).default(600),
      rangeMax: z.number().int().min(1).default(700),
    }))
    .mutation(async ({ input, ctx }) => {
      const question = await ctx.prisma.writingQuestion54.create({
        data: {
          examRef: input.examRef ?? null,
          instruction: input.instruction,
          imageData: input.imageBase64 ?? null,
          imageMimeType: input.imageMimeType ?? null,
          imageAlt: input.imageAlt ?? null,
          rangeMin: input.rangeMin,
          rangeMax: input.rangeMax,
          deviceId: ctx.deviceId || "anonymous",
          ...(ctx.userId ? { userId: ctx.userId } : {}),
        },
      })
      return { id: question.id }
    }),

  gradeWriting54: aiProcedure
    .input(z.object({ questionId: z.string(), answer: z.string().min(1, "Bài viết không được để trống") }))
    .mutation(async ({ input, ctx }) => {
      const question = await ctx.prisma.writingQuestion54.findUnique({ where: { id: input.questionId } })
      if (!question) throw new Error("Question not found")
      const prompt = buildGradePrompt(question.instruction, question.imageAlt, input.answer)
      const raw = question.imageData && question.imageMimeType
        ? await callGeminiVisionJSON(prompt, question.imageData, question.imageMimeType, { temperature: 0.2, maxTokens: 4096 })
        : await callGeminiJSON(prompt, { temperature: 0.2, maxTokens: 4096 })
      return gradeSchema.parse(raw)
    }),

  gradeHandwritten54: aiProcedure
    .input(z.object({ questionId: z.string(), imageBase64: z.string().min(1), imageMimeType: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const question = await ctx.prisma.writingQuestion54.findUnique({ where: { id: input.questionId } })
      if (!question) throw new Error("Question not found")
      const ocr = handwrittenOcrSchema.parse(await callGeminiVisionJSON(
        buildHandwrittenOcrPrompt(question.rangeMin, question.rangeMax),
        input.imageBase64,
        input.imageMimeType,
        { temperature: 0.1, maxTokens: 8192 },
      ))
      const handwritingContext = `\nOCR: độ tin cậy ${ocr.ocrConfidence}; điểm khoảng cách ô ${ocr.spacingScore}/10; ${ocr.spacingFeedback}; cảnh báo: ${ocr.layoutWarnings.join("; ") || "không có"}`
      const raw = await callGeminiJSON(buildGradePrompt(question.instruction, question.imageAlt, ocr.text, handwritingContext), {
        temperature: 0.2,
        maxTokens: 4096,
      })
      const grade = gradeSchema.parse({
        ...(raw as Record<string, unknown>),
        handwriting: {
          ocrConfidence: ocr.ocrConfidence,
          spacingScore: ocr.spacingScore,
          spacingFeedback: ocr.spacingFeedback,
          spellingErrors: ocr.spellingErrors,
          layoutWarnings: ocr.layoutWarnings,
        },
      })
      const attempt = await ctx.prisma.writingAttempt54.create({
        data: {
          questionId: input.questionId,
          deviceId: ctx.deviceId || "anonymous",
          ...(ctx.userId ? { userId: ctx.userId } : {}),
          answer: ocr.text,
          cellsJson: ocr.cells,
          submissionType: "handwritten",
          imageData: input.imageBase64,
          imageMimeType: input.imageMimeType,
          ocrText: ocr.text,
          ocrCellsJson: ocr.cells,
          gradeJson: grade,
          totalScore: grade.totalScore,
        },
      })
      return { id: attempt.id, grade, answer: ocr.text, cells: ocr.cells, ocr }
    }),

  saveAttempt: publicProcedure
    .input(z.object({
      questionId: z.string(),
      answer: z.string(),
      cells: z.array(z.string()).optional(),
      submissionType: z.enum(["typed", "handwritten"]).default("typed"),
      grade: gradeSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const attempt = await ctx.prisma.writingAttempt54.create({
        data: {
          questionId: input.questionId,
          deviceId: ctx.deviceId || "anonymous",
          ...(ctx.userId ? { userId: ctx.userId } : {}),
          answer: input.answer,
          cellsJson: input.cells,
          submissionType: input.submissionType,
          gradeJson: input.grade,
          totalScore: input.grade.totalScore,
        },
      })
      return { id: attempt.id }
    }),

  listAttempts: publicProcedure
    .input(z.object({ questionId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId && !ctx.deviceId) return []
      return ctx.prisma.writingAttempt54.findMany({
        where: { questionId: input.questionId, ...(ctx.userId ? { userId: ctx.userId } : { deviceId: ctx.deviceId }) },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, totalScore: true, createdAt: true, answer: true, gradeJson: true, cellsJson: true, imageData: true, imageMimeType: true, submissionType: true },
      })
    }),
})
