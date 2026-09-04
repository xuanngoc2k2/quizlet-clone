import { z } from "zod"
import { router, publicProcedure } from "../trpc"

// "YYYY-MM-DD" helper — dùng timezone offset của server, nhưng ta muốn UTC date
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export const activityRouter = router({
  /**
   * Log một phiên học hôm nay (upsert — cộng dồn count).
   * Gọi sau mỗi lần user review xong 1 thẻ (hoặc batch cuối session).
   */
  log: publicProcedure
    .input(z.object({ count: z.number().min(1).default(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.deviceId && !ctx.userId) return null
      const deviceId = ctx.deviceId ?? ctx.userId ?? "anon"
      const date = toDateStr(new Date())

      return ctx.prisma.studyActivity.upsert({
        where: { deviceId_date: { deviceId, date } },
        create: {
          deviceId,
          date,
          count: input.count,
          ...(ctx.userId ? { userId: ctx.userId } : {}),
        },
        update: {
          count: { increment: input.count },
          ...(ctx.userId ? { userId: ctx.userId } : {}),
        },
      })
    }),

  /**
   * Trả về: streak hiện tại, streak dài nhất, tổng ngày đã học.
   */
  getStreak: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.deviceId && !ctx.userId) {
      return { currentStreak: 0, longestStreak: 0, totalDays: 0 }
    }
    const deviceId = ctx.deviceId ?? ctx.userId ?? "anon"

    const rows = await ctx.prisma.studyActivity.findMany({
      where: ctx.userId
        ? { userId: ctx.userId }
        : { deviceId },
      orderBy: { date: "desc" },
      select: { date: true },
    })

    if (rows.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalDays: 0 }
    }

    const dates = rows.map((r) => r.date)
    const today = toDateStr(new Date())
    const yesterday = toDateStr(new Date(Date.now() - 86_400_000))

    // Current streak
    let currentStreak = 0
    let cursor = dates[0] === today || dates[0] === yesterday ? dates[0] : null
    if (cursor) {
      for (const d of dates) {
        if (d === cursor) {
          currentStreak++
          // subtract 1 day
          const prev = new Date(cursor)
          prev.setUTCDate(prev.getUTCDate() - 1)
          cursor = toDateStr(prev)
        } else {
          break
        }
      }
    }

    // Longest streak (iterate sorted ascending)
    const ascending = [...dates].reverse()
    let longest = 1
    let current = 1
    for (let i = 1; i < ascending.length; i++) {
      const prev = new Date(ascending[i - 1])
      prev.setUTCDate(prev.getUTCDate() + 1)
      if (toDateStr(prev) === ascending[i]) {
        current++
        if (current > longest) longest = current
      } else {
        current = 1
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(longest, currentStreak),
      totalDays: dates.length,
    }
  }),

  /**
   * Heatmap data: trả về tất cả ngày + count trong 1 năm gần nhất.
   */
  getHeatmap: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.deviceId && !ctx.userId) return []
    const deviceId = ctx.deviceId ?? ctx.userId ?? "anon"

    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const fromDate = toDateStr(oneYearAgo)

    const rows = await ctx.prisma.studyActivity.findMany({
      where: ctx.userId
        ? { userId: ctx.userId, date: { gte: fromDate } }
        : { deviceId, date: { gte: fromDate } },
      select: { date: true, count: true },
      orderBy: { date: "asc" },
    })

    return rows.map((r) => ({ date: r.date, count: r.count }))
  }),
})
