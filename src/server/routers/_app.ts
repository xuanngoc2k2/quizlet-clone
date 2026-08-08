import { router } from "../trpc"
import { setsRouter } from "./sets"
import { sentencesRouter } from "./sentences"
import { cardProgressRouter } from "./card-progress"
import { testRouter } from "./test"
import { testHistoryRouter } from "./test-history"
import { setTestRouter } from "./set-test"

export const appRouter = router({
  sets: setsRouter,
  sentences: sentencesRouter,
  cardProgress: cardProgressRouter,
  test: testRouter,
  testHistory: testHistoryRouter,
  setTest: setTestRouter,
})

export type AppRouter = typeof appRouter
