import { z } from "zod"
import { router, publicProcedure } from "../trpc"

export const cardProgressRouter = router({
  getBySet: publicProcedure
    .input(z.object({ setId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.deviceId) return {} as Record<string, number>
      const records = await ctx.prisma.cardProgress.findMany({
        where: { setId: input.setId, deviceId: ctx.deviceId },
      })
      const result: Record<string, number> = {}
      for (const r of records) {
        result[r.cardId] = r.rememberedCount
      }
      return result
    }),

  increment: publicProcedure
    .input(z.object({ setId: z.string(), cardId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.deviceId) return
      await ctx.prisma.cardProgress.upsert({
        where: {
          deviceId_cardId: {
            deviceId: ctx.deviceId,
            cardId: input.cardId,
          },
        },
        create: {
          deviceId: ctx.deviceId,
          cardId: input.cardId,
          setId: input.setId,
          rememberedCount: 1,
        },
        update: {
          rememberedCount: { increment: 1 },
        },
      })
    }),
})
