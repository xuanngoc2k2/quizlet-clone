import { router } from "../trpc"
import { setsRouter } from "./sets"
import { sentencesRouter } from "./sentences"
import { cardProgressRouter } from "./card-progress"
import { testRouter } from "./test"
import { testHistoryRouter } from "./test-history"
import { setTestRouter } from "./set-test"
import { dictionaryRouter } from "./dictionary"
import { activityRouter } from "./activity"
import { dashboardRouter } from "./dashboard"
import { writingRouter } from "./writing"
import { writing51Router } from "./writing51"
import { writing54Router } from "./writing54"
import { adminRouter } from "./admin"

export const appRouter = router({
  sets: setsRouter,
  sentences: sentencesRouter,
  cardProgress: cardProgressRouter,
  test: testRouter,
  testHistory: testHistoryRouter,
  setTest: setTestRouter,
  dictionary: dictionaryRouter,
  activity: activityRouter,
  dashboard: dashboardRouter,
  writing: writingRouter,
  writing51: writing51Router,
  writing54: writing54Router,
  admin: adminRouter,
})

export type AppRouter = typeof appRouter
