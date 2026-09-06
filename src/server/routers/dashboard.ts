import { z } from "zod"
import { router, protectedProcedure } from "../trpc"

// ─── Types ───────────────────────────────────────────────────────────────────

type WeakAreaSeverity = "weak" | "needs_practice" | "good" | "insufficient_data"

interface SkillStats {
  totalAttempts: number
  correctAttempts: number
  accuracy: number | null // null = insufficient data
  severity: WeakAreaSeverity
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MIN_ATTEMPTS = 5

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function classifySeverity(accuracy: number | null, totalAttempts: number): WeakAreaSeverity {
  if (totalAttempts < MIN_ATTEMPTS) return "insufficient_data"
  if (accuracy === null) return "insufficient_data"
  if (accuracy < 0.6) return "weak"
  if (accuracy < 0.8) return "needs_practice"
  return "good"
}

/**
 * Aggregate test attempt stats by skill type (vocabulary, grammar, reading, listening)
 * from TestAttempt results JSON field.
 *
 * TestAttempt.results shape: Array<{ questionId, isCorrect, score?, userAnswer, correctAnswer, explanation }>
 * TestHistory.sections shape: Array<{ name, instruction, questions: Array<{ id, type, part, ... }> }>
 *
 * We need to cross-reference questionId → question type via sections JSON.
 */
function aggregateSkillStats(
  attempts: Array<{ results: unknown; testHistory: { sections: unknown } }>
): Record<string, SkillStats> {
  const stats: Record<string, { total: number; correct: number }> = {
    vocabulary: { total: 0, correct: 0 },
    grammar: { total: 0, correct: 0 },
    reading: { total: 0, correct: 0 },
    listening: { total: 0, correct: 0 },
  }

  for (const attempt of attempts) {
    const results = attempt.results as Array<{
      questionId: number
      isCorrect: boolean
    }>
    const sections = attempt.testHistory.sections as Array<{
      name: string
      questions: Array<{ id: number; type: string; part: number }>
    }>

    // Build questionId → type map from sections
    const qTypeMap = new Map<number, string>()
    for (const section of sections ?? []) {
      const sectionName = section.name?.toLowerCase() ?? ""
      for (const q of section.questions ?? []) {
        // Infer type from section name if not directly set
        let type = q.type ?? "vocabulary"
        if (sectionName.includes("nghe") || sectionName.includes("listening")) type = "listening"
        else if (sectionName.includes("đọc") || sectionName.includes("reading")) type = "reading"
        else if (sectionName.includes("ngữ pháp") || sectionName.includes("grammar")) type = "grammar"
        else if (sectionName.includes("từ vựng") || sectionName.includes("vocabulary")) type = "vocabulary"
        qTypeMap.set(q.id, type)
      }
    }

    for (const result of results ?? []) {
      const type = qTypeMap.get(result.questionId) ?? "vocabulary"
      const key = type in stats ? type : "vocabulary"
      stats[key].total++
      if (result.isCorrect) stats[key].correct++
    }
  }

  const result: Record<string, SkillStats> = {}
  for (const [key, val] of Object.entries(stats)) {
    const accuracy = val.total >= MIN_ATTEMPTS ? val.correct / val.total : null
    result[key] = {
      totalAttempts: val.total,
      correctAttempts: val.correct,
      accuracy,
      severity: classifySeverity(accuracy, val.total),
    }
  }
  return result
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const dashboardRouter = router({
  /**
   * Get or set the user's TOPIK goal.
   */
  getGoal: protectedProcedure.query(async ({ ctx }) => {
    const goal = await ctx.prisma.userTopikGoal.findUnique({
      where: { userId: ctx.userId },
    })
    return goal
  }),

  setGoal: protectedProcedure
    .input(
      z.object({
        examType: z.enum(["TOPIK_I", "TOPIK_II"]).default("TOPIK_II"),
        targetLevel: z.number().min(1).max(6).default(4),
        currentLevel: z.number().min(0).max(6).optional(),
        examDate: z.string().optional(), // "YYYY-MM-DD"
        dailyStudyMinutes: z.number().min(5).max(480).default(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.userTopikGoal.upsert({
        where: { userId: ctx.userId },
        create: {
          userId: ctx.userId,
          examType: input.examType,
          targetLevel: input.targetLevel,
          currentLevel: input.currentLevel ?? null,
          examDate: input.examDate ?? null,
          dailyStudyMinutes: input.dailyStudyMinutes,
        },
        update: {
          examType: input.examType,
          targetLevel: input.targetLevel,
          currentLevel: input.currentLevel ?? null,
          examDate: input.examDate ?? null,
          dailyStudyMinutes: input.dailyStudyMinutes,
        },
      })
    }),

  /**
   * Main dashboard data aggregator.
   * Runs parallel queries and returns everything the Dashboard needs.
   * Returns null for metrics with insufficient data — never fakes stats.
   */
  summary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId
    const now = new Date()
    const todayStr = toDateStr(now)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = toDateStr(sevenDaysAgo)

    // ── Run all queries in parallel ──────────────────────────────────────────
    const [
      goal,
      dueCards,
      mySets,
      allCardProgress,
      recentTestAttempts,
      recentTestHistories,
      todayActivity,
      weeklyActivity,
      streakData,
    ] = await Promise.all([
      // 1. TOPIK Goal
      ctx.prisma.userTopikGoal.findUnique({ where: { userId } }),

      // 2. Review due count (SRS cards due today)
      ctx.prisma.cardProgress.count({
        where: {
          userId,
          srsDue: { lte: now },
          srsState: { not: "new" },
        },
      }),

      // 3. User's sets (recently studied — sorted by updatedAt desc)
      ctx.prisma.flashcardSet.findMany({
        where: { userId },
        include: {
          _count: { select: { cards: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),

      // 4. All card progress for vocabulary stats
      ctx.prisma.cardProgress.findMany({
        where: { userId },
        select: {
          srsState: true,
          rememberedCount: true,
          card: { select: { type: true } },
        },
      }),

      // 5. Recent test attempts (last 30 days) for weak areas
      ctx.prisma.testAttempt.findMany({
        where: {
          deviceId: ctx.deviceId ?? "",
          testHistory: { userId },
          createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
        include: {
          testHistory: { select: { sections: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),

      // 6. Recent test histories for Recent Activity
      ctx.prisma.testHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          source: true,
          createdAt: true,
        },
      }),

      // 7. Today's study activity
      ctx.prisma.studyActivity.findFirst({
        where: { userId, date: todayStr },
        select: { count: true },
      }),

      // 8. Weekly activity (last 7 days)
      ctx.prisma.studyActivity.findMany({
        where: {
          userId,
          date: { gte: sevenDaysAgoStr },
        },
        select: { date: true, count: true },
        orderBy: { date: "asc" },
      }),

      // 9. Streak (reuse activity data via raw query pattern)
      ctx.prisma.studyActivity.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
    ])

    // ── Compute streak ───────────────────────────────────────────────────────
    const dates = streakData.map((r) => r.date)
    const yesterday = toDateStr(new Date(now.getTime() - 86_400_000))
    let currentStreak = 0
    let cursor: string | null =
      dates[0] === todayStr || dates[0] === yesterday ? dates[0] : null
    if (cursor) {
      for (const d of dates) {
        if (d === cursor) {
          currentStreak++
          const prev = new Date(cursor)
          prev.setUTCDate(prev.getUTCDate() - 1)
          cursor = toDateStr(prev)
        } else break
      }
    }

    // ── Vocabulary progress from CardProgress ────────────────────────────────
    const vocabCards = allCardProgress.filter((p) => p.card.type === "vocabulary")
    const grammarCards = allCardProgress.filter((p) => p.card.type === "grammar")

    const totalVocab = vocabCards.length
    const graduatedVocab = vocabCards.filter((p) =>
      ["review", "mature"].includes(p.srsState)
    ).length
    const vocabAccuracy =
      totalVocab >= MIN_ATTEMPTS
        ? vocabCards.filter((p) => p.rememberedCount > 0).length / totalVocab
        : null

    const totalGrammar = grammarCards.length
    const graduatedGrammar = grammarCards.filter((p) =>
      ["review", "mature"].includes(p.srsState)
    ).length
    const grammarAccuracy =
      totalGrammar >= MIN_ATTEMPTS
        ? grammarCards.filter((p) => p.rememberedCount > 0).length / totalGrammar
        : null

    // ── Skill stats from test attempts (reading, listening, grammar, vocab) ──
    // Build attempts with sections for aggregation
    const attemptsWithSections = recentTestAttempts.map((a) => ({
      results: a.results,
      testHistory: { sections: a.testHistory.sections },
    }))
    const skillStats = aggregateSkillStats(attemptsWithSections)

    // ── Weekly stats ─────────────────────────────────────────────────────────
    const weeklyCardsReviewed = weeklyActivity.reduce((sum, a) => sum + a.count, 0)

    // Total questions answered this week from test attempts in last 7 days
    const weeklyTestAttempts = recentTestAttempts.filter(
      (a) => new Date(a.createdAt) >= sevenDaysAgo
    )
    const weeklyQuestionsAnswered = weeklyTestAttempts.reduce(
      (sum, a) => sum + (a.totalQuestions ?? 0),
      0
    )
    const weeklyCorrect = weeklyTestAttempts.reduce(
      (sum, a) => sum + (a.totalCorrect ?? 0),
      0
    )
    const weeklyAccuracy =
      weeklyQuestionsAnswered >= MIN_ATTEMPTS
        ? weeklyCorrect / weeklyQuestionsAnswered
        : null

    // Weekly chart data: fill missing days with 0
    const weeklyChartMap = new Map(weeklyActivity.map((a) => [a.date, a.count]))
    const weeklyChart: Array<{ date: string; count: number }> = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const ds = toDateStr(d)
      weeklyChart.push({ date: ds, count: weeklyChartMap.get(ds) ?? 0 })
    }

    // ── Top 3 recently studied sets (via mySets order already desc by updatedAt) ──
    const topSetIds = mySets.slice(0, 3).map((s) => s.id)
    const setProgressCounts =
      topSetIds.length > 0
        ? await ctx.prisma.cardProgress.groupBy({
            by: ["setId"],
            where: {
              userId,
              setId: { in: topSetIds },
              srsState: { in: ["review", "mature"] },
            },
            _count: { _all: true },
          })
        : []
    const setProgressMapFinal = new Map(setProgressCounts.map((p) => [p.setId, p._count._all]))

    const continueLearningFinal = mySets.slice(0, 3).map((set) => ({
      id: set.id,
      title: set.title,
      totalCards: set._count.cards,
      graduatedCards: setProgressMapFinal.get(set.id) ?? 0,
      progressPercent:
        set._count.cards > 0
          ? Math.round(((setProgressMapFinal.get(set.id) ?? 0) / set._count.cards) * 100)
          : 0,
      lastStudiedAt: set.updatedAt.toISOString(),
    }))

    // ── Recent activity list ─────────────────────────────────────────────────
    const recentActivity = recentTestHistories.map((h) => ({
      id: h.id,
      type: h.source === "set-test" ? "set_test" : "prompt_test",
      title: h.title,
      createdAt: h.createdAt.toISOString(),
    }))

    // ── Today's tasks (simplified: due review + new vocab sets) ─────────────
    const todayCompletedCards = todayActivity?.count ?? 0
    // Simple heuristic: if user has due cards, that's the main task.
    // We define 3 task slots: Review (if due), Vocabulary (if has sets), Test (always)
    const totalTasks = dueCards > 0 ? 3 : 2
    const completedTasks = Math.min(
      totalTasks,
      todayCompletedCards >= 10 ? (dueCards > 0 ? 2 : 1) : todayCompletedCards > 0 ? 1 : 0
    )

    // ── Weak areas ───────────────────────────────────────────────────────────
    const weakAreas = Object.entries(skillStats)
      .filter(([, stats]) => stats.severity !== "insufficient_data")
      .map(([type, stats]) => ({
        type,
        accuracy: stats.accuracy,
        totalAttempts: stats.totalAttempts,
        severity: stats.severity,
      }))
      .sort((a, b) => {
        const order: Record<WeakAreaSeverity, number> = {
          weak: 0,
          needs_practice: 1,
          good: 2,
          insufficient_data: 3,
        }
        return order[a.severity] - order[b.severity]
      })

    // ── Assemble final payload ───────────────────────────────────────────────
    return {
      goal: goal
        ? {
            examType: goal.examType,
            targetLevel: goal.targetLevel,
            currentLevel: goal.currentLevel,
            examDate: goal.examDate,
            dailyStudyMinutes: goal.dailyStudyMinutes,
            daysRemaining: goal.examDate
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(goal.examDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  )
                )
              : null,
          }
        : null,

      today: {
        reviewDue: dueCards,
        cardsStudied: todayCompletedCards,
        completedTasks,
        totalTasks,
        progressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },

      progress: {
        vocabulary: {
          totalCards: totalVocab,
          graduatedCards: graduatedVocab,
          coveragePercent:
            totalVocab > 0 ? Math.round((graduatedVocab / totalVocab) * 100) : null,
          accuracy: vocabAccuracy !== null ? Math.round(vocabAccuracy * 100) : null,
          hasData: totalVocab >= MIN_ATTEMPTS,
        },
        grammar: {
          totalCards: totalGrammar,
          graduatedCards: graduatedGrammar,
          coveragePercent:
            totalGrammar > 0 ? Math.round((graduatedGrammar / totalGrammar) * 100) : null,
          accuracy: grammarAccuracy !== null ? Math.round(grammarAccuracy * 100) : null,
          hasData: totalGrammar >= MIN_ATTEMPTS,
        },
        reading: {
          totalAttempts: skillStats.reading?.totalAttempts ?? 0,
          accuracy:
            skillStats.reading?.accuracy !== null && skillStats.reading?.accuracy !== undefined
              ? Math.round(skillStats.reading.accuracy * 100)
              : null,
          hasData: (skillStats.reading?.totalAttempts ?? 0) >= MIN_ATTEMPTS,
        },
        listening: {
          totalAttempts: skillStats.listening?.totalAttempts ?? 0,
          accuracy:
            skillStats.listening?.accuracy !== null &&
            skillStats.listening?.accuracy !== undefined
              ? Math.round(skillStats.listening.accuracy * 100)
              : null,
          hasData: (skillStats.listening?.totalAttempts ?? 0) >= MIN_ATTEMPTS,
        },
      },

      continueLearning: continueLearningFinal,

      weakAreas,

      weeklyStats: {
        cardsReviewed: weeklyCardsReviewed,
        questionsAnswered: weeklyQuestionsAnswered,
        accuracy: weeklyAccuracy !== null ? Math.round(weeklyAccuracy * 100) : null,
        chartData: weeklyChart,
        hasData: weeklyCardsReviewed > 0 || weeklyQuestionsAnswered > 0,
      },

      recentActivity,

      streak: {
        current: currentStreak,
        hasData: dates.length > 0,
      },
    }
  }),
})
