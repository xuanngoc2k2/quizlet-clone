import { z } from "zod"
import { router, publicProcedure } from "../trpc"
import { prisma } from "../db"
import type { Prisma } from "@prisma/client"

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

const testDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  sections: z.array(sectionSchema),
})

const resultItemSchema = z.object({
  questionId: z.number(),
  isCorrect: z.boolean(),
  score: z.number().min(0).max(10).optional(),
  userAnswer: z.string(),
  correctAnswer: z.string(),
  explanation: z.string(),
})

export const testHistoryRouter = router({
  save: publicProcedure
    .input(z.object({ test: testDataSchema }))
    .mutation(async ({ input, ctx }) => {
      const deviceId = ctx.deviceId || "anonymous"
      const history = await prisma.testHistory.create({
        data: {
          deviceId,
          title: input.test.title,
          description: input.test.description,
          sections: input.test.sections as unknown as Prisma.InputJsonValue,
        },
      })
      return { id: history.id }
    }),

  saveAttempt: publicProcedure
    .input(z.object({
      testHistoryId: z.string(),
      answers: z.record(z.string()),
      results: z.array(resultItemSchema),
      totalCorrect: z.number(),
      totalQuestions: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const deviceId = ctx.deviceId || "anonymous"
      const attempt = await prisma.testAttempt.create({
        data: {
          testHistoryId: input.testHistoryId,
          deviceId,
          answers: input.answers as unknown as Prisma.InputJsonValue,
          results: input.results as unknown as Prisma.InputJsonValue,
          totalCorrect: input.totalCorrect,
          totalQuestions: input.totalQuestions,
        },
      })
      return { id: attempt.id }
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    const deviceId = ctx.deviceId || "anonymous"
    const histories = await prisma.testHistory.findMany({
      where: { deviceId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: { select: { attempts: true } },
      },
    })
    return histories.map((h) => ({
      id: h.id,
      title: h.title,
      description: h.description,
      createdAt: h.createdAt,
      attemptCount: h._count.attempts,
    }))
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const history = await prisma.testHistory.findUnique({
        where: { id: input.id },
        include: { attempts: { orderBy: { createdAt: "desc" } } },
      })
      return history
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deviceId = ctx.deviceId || "anonymous"
      await prisma.testHistory.deleteMany({
        where: { id: input.id, deviceId },
      })
      return { success: true }
    }),
})
