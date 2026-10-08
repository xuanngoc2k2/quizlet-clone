import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { ADMIN_EMAIL } from "@/lib/auth"
import { adminProcedure, router } from "../trpc"

export const adminRouter = router({
  listUsers: adminProcedure
    .input(z.object({ search: z.string().trim().max(100).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const search = input?.search
      return ctx.prisma.user.findMany({
        where: search
          ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ],
          }
          : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          canUseAI: true,
          createdAt: true,
          _count: { select: { sets: true } },
        },
      })
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        role: z.enum(["USER", "ADMIN"]),
        canUseAI: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, email: true },
      })
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })

      const isDefaultAdmin = user.email?.toLowerCase() === ADMIN_EMAIL
      return ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          role: isDefaultAdmin ? "ADMIN" : input.role,
          canUseAI: isDefaultAdmin ? true : input.canUseAI,
        },
        select: { id: true, role: true, canUseAI: true },
      })
    }),
})