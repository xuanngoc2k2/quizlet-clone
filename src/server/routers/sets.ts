import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, publicProcedure, protectedProcedure } from "../trpc"
import { prisma } from "../db"

async function attachProgressToSets(sets: any[], ctx: any) {
  if (sets.length === 0) return sets
  
  const setIds = sets.map((s: any) => s.id)
  const progressCounts = await prisma.cardProgress.groupBy({
    by: ['setId'],
    where: {
      setId: { in: setIds },
      srsState: 'graduated',
      ...(ctx.userId ? { userId: ctx.userId } : { deviceId: ctx.deviceId })
    },
    _count: {
      _all: true
    }
  })
  
  const countMap = new Map(progressCounts.map(p => [p.setId, p._count._all]))
  
  return sets.map(set => ({
    ...set,
    graduatedCount: countMap.get(set.id) || 0
  }))
}

const cardInput = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
  type: z.enum(["vocabulary", "grammar"]).default("vocabulary"),
})

export const setsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search } = input
      const sets = await prisma.flashcardSet.findMany({
        where: {
          // Browse Sets only shows public, unowned sets (managed later by admins)
          userId: null,
          ...(search
            ? {
                OR: [
                  { title: { contains: search } },
                  { description: { contains: search } },
                  { cards: { some: { term: { contains: search } } } },
                ],
              }
            : {}),
        },
        include: {
          _count: { select: { cards: true } },
        },
        orderBy: { updatedAt: "desc" },
      })
      return attachProgressToSets(sets, ctx)
    }),

  my: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) return []
    const sets = await prisma.flashcardSet.findMany({
      where: { userId: ctx.userId },
      include: {
        _count: { select: { cards: true } },
      },
      orderBy: { updatedAt: "desc" },
    })
    return attachProgressToSets(sets, ctx)
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const set = await prisma.flashcardSet.findUnique({
        where: { id: input.id },
        include: {
          cards: { orderBy: { order: "asc" } },
        },
      })
      if (!set) throw new Error("Set not found")
      return { ...set, canManage: !!ctx.userId && set.userId === ctx.userId }
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        cards: z.array(cardInput).min(1, "At least 1 card required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const set = await prisma.flashcardSet.create({
        data: {
          title: input.title,
          description: input.description,
          userId: ctx.userId,
          cards: {
            create: input.cards.map((card, i) => ({
              term: card.term,
              definition: card.definition,
              type: card.type,
              order: i,
            })),
          },
        },
        include: { cards: { orderBy: { order: "asc" } } },
      })
      return set
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        cards: z
          .array(cardInput.extend({ id: z.string().optional() }))
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.flashcardSet.findUnique({
        where: { id: input.id },
        select: { userId: true },
      })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Set not found" })
      if (existing.userId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" })

      if (input.cards) {
        await prisma.flashcard.deleteMany({ where: { setId: input.id } })
        await prisma.flashcardSet.update({
          where: { id: input.id },
          data: {
            title: input.title,
            description: input.description,
            cards: {
              create: input.cards.map((card, i) => ({
                term: card.term,
                definition: card.definition,
                type: card.type,
                order: i,
              })),
            },
          },
        })
      } else {
        await prisma.flashcardSet.update({
          where: { id: input.id },
          data: {
            title: input.title,
            description: input.description,
          },
        })
      }

      return prisma.flashcardSet.findUnique({
        where: { id: input.id },
        include: { cards: { orderBy: { order: "asc" } } },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.flashcardSet.findUnique({
        where: { id: input.id },
        select: { userId: true },
      })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Set not found" })
      if (existing.userId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" })
      await prisma.flashcardSet.delete({ where: { id: input.id } })
      return { success: true }
    }),
})