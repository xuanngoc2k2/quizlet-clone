import { router } from "../trpc"
import { setsRouter } from "./sets"
import { sentencesRouter } from "./sentences"

export const appRouter = router({
  sets: setsRouter,
  sentences: sentencesRouter,
})

export type AppRouter = typeof appRouter
