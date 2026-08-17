import { z } from "zod"
import { router, publicProcedure } from "../trpc"
import { calculateSRS } from "@/lib/srs"
import type { SrsCard } from "@/lib/srs"

export const cardProgressRouter = router({
  getBySet: publicProcedure
    .input(z.object({ setId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId && !ctx.deviceId) return {} as Record<string, number>
      const records = await ctx.prisma.cardProgress.findMany({
        where: ctx.userId
          ? { setId: input.setId, userId: ctx.userId }
          : { setId: input.setId, deviceId: ctx.deviceId },
      })
      const result: Record<string, number> = {}
      for (const r of records) {
        result[r.cardId] = r.rememberedCount
      }
      return result
    }),

  // Lấy SRS data cho toàn bộ cards trong một Set
  getSrsBySet: publicProcedure
    .input(z.object({ setId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId && !ctx.deviceId) return {} as Record<string, SrsCard & { srsDue: Date }>
      const records = await ctx.prisma.cardProgress.findMany({
        where: ctx.userId
          ? { setId: input.setId, userId: ctx.userId }
          : { setId: input.setId, deviceId: ctx.deviceId },
      })
      const result: Record<string, SrsCard & { srsDue: Date }> = {}
      for (const r of records) {
        result[r.cardId] = {
          srsInterval: r.srsInterval,
          srsEase: r.srsEase,
          srsLapses: r.srsLapses,
          srsState: r.srsState as SrsCard["srsState"],
          srsDue: r.srsDue,
        }
      }
      return result
    }),

  increment: publicProcedure
    .input(z.object({ setId: z.string(), cardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId && !ctx.deviceId) return
      const deviceId = ctx.deviceId || "anonymous"
      await ctx.prisma.cardProgress.upsert({
        where: {
          deviceId_cardId: {
            deviceId,
            cardId: input.cardId,
          },
        },
        create: {
          deviceId,
          cardId: input.cardId,
          setId: input.setId,
          rememberedCount: 1,
          ...(ctx.userId ? { userId: ctx.userId } : {}),
        },
        update: {
          rememberedCount: { increment: 1 },
          ...(ctx.userId ? { userId: ctx.userId } : {}),
        },
      })
    }),

  // Đánh giá thẻ với SRS (Again/Hard/Good/Easy)
  review: publicProcedure
    .input(
      z.object({
        setId: z.string(),
        cardId: z.string(),
        rating: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId && !ctx.deviceId) return
      const deviceId = ctx.deviceId || "anonymous"

      // Lấy trạng thái SRS hiện tại (nếu chưa có, dùng default)
      const existing = await ctx.prisma.cardProgress.findUnique({
        where: {
          deviceId_cardId: {
            deviceId,
            cardId: input.cardId,
          },
        },
      })

      const currentCard: SrsCard = existing
        ? {
            srsInterval: existing.srsInterval,
            srsEase: existing.srsEase,
            srsLapses: existing.srsLapses,
            srsState: existing.srsState as SrsCard["srsState"],
          }
        : {
            srsInterval: 0,
            srsEase: 2.5,
            srsLapses: 0,
            srsState: "new",
          }

      const srsResult = calculateSRS(currentCard, input.rating)

      // Nếu Good hoặc Easy → tăng rememberedCount như cũ để tương thích
      const rememberIncrement = input.rating >= 2 ? 1 : 0

      await ctx.prisma.cardProgress.upsert({
        where: {
          deviceId_cardId: {
            deviceId,
            cardId: input.cardId,
          },
        },
        create: {
          deviceId,
          cardId: input.cardId,
          setId: input.setId,
          rememberedCount: rememberIncrement,
          srsInterval: srsResult.srsInterval,
          srsEase: srsResult.srsEase,
          srsLapses: srsResult.srsLapses,
          srsState: srsResult.srsState,
          srsDue: srsResult.srsDue,
          ...(ctx.userId ? { userId: ctx.userId } : {}),
        },
        update: {
          rememberedCount: { increment: rememberIncrement },
          srsInterval: srsResult.srsInterval,
          srsEase: srsResult.srsEase,
          srsLapses: srsResult.srsLapses,
          srsState: srsResult.srsState,
          srsDue: srsResult.srsDue,
          ...(ctx.userId ? { userId: ctx.userId } : {}),
        },
      })

      return srsResult
    }),

  // Lấy tất cả thẻ đến hạn ôn (cho Daily Review - R-08)
  getDueByDevice: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId && !ctx.deviceId) return []
      const now = new Date()
      return ctx.prisma.cardProgress.findMany({
        where: ctx.userId
          ? { userId: ctx.userId, srsDue: { lte: now }, srsState: { not: "new" } }
          : { deviceId: ctx.deviceId, srsDue: { lte: now }, srsState: { not: "new" } },
        orderBy: { srsDue: "asc" },
      })
    }),

  // Lấy cards due kèm đầy đủ term/definition/setTitle (Daily Review Dashboard)
  getDueWithDetails: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId && !ctx.deviceId) return []
      const now = new Date()
      const records = await ctx.prisma.cardProgress.findMany({
        where: ctx.userId
          ? { userId: ctx.userId, srsDue: { lte: now }, srsState: { not: "new" } }
          : { deviceId: ctx.deviceId, srsDue: { lte: now }, srsState: { not: "new" } },
        include: {
          card: {
            include: {
              set: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { srsDue: "asc" },
      })
      return records.map((r) => ({
        cardId: r.cardId,
        setId: r.setId,
        setTitle: r.card.set.title,
        term: r.card.term,
        definition: r.card.definition,
        srsInterval: r.srsInterval,
        srsEase: r.srsEase,
        srsLapses: r.srsLapses,
        srsState: r.srsState,
        srsDue: r.srsDue,
      }))
    }),
})
