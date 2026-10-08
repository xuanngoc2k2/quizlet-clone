import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"
import { ZodError } from "zod"
import { prisma } from "./db"
import { auth } from "@/lib/auth"
import { ADMIN_EMAIL } from "@/lib/auth"

export const createTRPCContext = async (opts?: { req: Request }) => {
  const deviceId = opts?.req?.headers?.get("x-device-id") ?? ""
  const session = await auth()
  const userId = session?.user?.id ?? null
  const user = userId
    ? await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, canUseAI: true },
    })
    : null

  return {
    prisma,
    deviceId,
    session,
    userId,
    user,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router

const authenticatedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userId: ctx.userId,
    },
  })
})

const aiProcedure = authenticatedProcedure.use(({ ctx, next }) => {
  if (!ctx.user?.canUseAI) {
    throw new TRPCError({ code: "FORBIDDEN", message: "AI access is disabled for this account" })
  }
  return next()
})

const adminProcedure = authenticatedProcedure.use(({ ctx, next }) => {
  const isAdmin = ctx.user?.role === "ADMIN" || ctx.user?.email?.toLowerCase() === ADMIN_EMAIL
  if (!isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

export const publicProcedure = authenticatedProcedure
export const protectedProcedure = authenticatedProcedure
export { adminProcedure, aiProcedure }
