import { router } from "../trpc"
import { setsRouter } from "./sets"
import { sentencesRouter } from "./sentences"
import { cardProgressRouter } from "./card-progress"
import { testRouter } from "./test"

export const appRouter = router({
  sets: setsRouter,
  sentences: sentencesRouter,
  cardProgress: cardProgressRouter,
  test: testRouter,
})

export type AppRouter = typeof appRouter
