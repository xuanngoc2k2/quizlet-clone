import { router } from "../trpc"
import { setsRouter } from "./sets"
import { sentencesRouter } from "./sentences"
import { cardProgressRouter } from "./card-progress"

export const appRouter = router({
  sets: setsRouter,
  sentences: sentencesRouter,
  cardProgress: cardProgressRouter,
})

export type AppRouter = typeof appRouter
