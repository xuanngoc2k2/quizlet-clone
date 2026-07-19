import { z } from "zod"
import { router, publicProcedure } from "../trpc"
import { prisma } from "../db"

export const setsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { search } = input
      const sets = await prisma.flashcardSet.findMany({
        where: search
          ? {
              OR: [
                { title: { contains: search } },
                { description: { contains: search } },
                { cards: { some: { term: { contains: search } } } },
              ],
            }
          : undefined,
        include: {
          _count: { select: { cards: true } },
        },
        orderBy: { updatedAt: "desc" },
      })
      return sets
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const set = await prisma.flashcardSet.findUnique({
        where: { id: input.id },
        include: {
          cards: { orderBy: { order: "asc" } },
        },
      })
      if (!set) throw new Error("Set not found")
      return set
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        cards: z
          .array(
            z.object({
              term: z.string().min(1),
              definition: z.string().min(1),
              type: z.enum(["vocabulary", "grammar"]).default("vocabulary"),
            }),
          )
          .min(1, "At least 1 card required"),
      }),
    )
    .mutation(async ({ input }) => {
      const set = await prisma.flashcardSet.create({
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
        include: { cards: { orderBy: { order: "asc" } } },
      })
      return set
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        cards: z
          .array(
            z.object({
              id: z.string().optional(),
              term: z.string().min(1),
              definition: z.string().min(1),
              type: z.enum(["vocabulary", "grammar"]).default("vocabulary"),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
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

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.flashcardSet.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
