import { initTRPC } from "@trpc/server"
import superjson from "superjson"
import { ZodError } from "zod"
import { prisma } from "./db"

export const createTRPCContext = async () => {
  return {
    prisma,
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
export const publicProcedure = t.procedure
