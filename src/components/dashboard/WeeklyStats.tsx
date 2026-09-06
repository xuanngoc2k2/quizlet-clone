"use client"

import { BarChart3 } from "lucide-react"

interface WeeklyStatsData {
  cardsReviewed: number
  questionsAnswered: number
  accuracy: number | null
  chartData: Array<{ date: string; count: number }>
  hasData: boolean
}

export function WeeklyStats({
  stats,
  isLoading,
}: {
  stats: WeeklyStatsData
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="card-base h-full">
        <div className="mb-4 h-5 w-40 animate-pulse rounded-lg bg-primary-100" />
        <div className="h-32 animate-pulse rounded-xl bg-primary-50" />
      </div>
    )
  }

  if (!stats.hasData) {
    return (
      <div className="card-base h-full flex flex-col">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-400">
          Weekly Activity
        </h2>
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-300">
            <BarChart3 className="h-6 w-6" />
          </div>
          <p className="font-semibold text-primary-900">No activity yet</p>
          <p className="mt-1 text-sm text-primary-400">
            Study cards or take tests to see your weekly stats.
          </p>
        </div>
      </div>
    )
  }

  // Find max for chart scaling
  const maxCount = Math.max(...stats.chartData.map((d) => d.count), 10) // min scale 10

  return (
    <div className="card-base h-full flex flex-col">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-400">
        Weekly Activity
      </h2>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-3 gap-2 divide-x divide-primary-100">
        <div className="text-center">
          <p className="font-display text-xl font-bold text-primary-900">{stats.cardsReviewed}</p>
          <p className="text-[10px] uppercase text-primary-400">Cards</p>
        </div>
        <div className="text-center">
          <p className="font-display text-xl font-bold text-primary-900">{stats.questionsAnswered}</p>
          <p className="text-[10px] uppercase text-primary-400">Questions</p>
        </div>
        <div className="text-center">
          <p className="font-display text-xl font-bold text-primary-900">
            {stats.accuracy != null ? `${stats.accuracy}%` : "-"}
          </p>
          <p className="text-[10px] uppercase text-primary-400">Accuracy</p>
        </div>
      </div>

      {/* Mini Bar Chart */}
      <div className="mt-auto flex h-24 items-end justify-between gap-1.5">
        {stats.chartData.map((day, i) => {
          const height = Math.max((day.count / maxCount) * 100, 4) // min height 4% for visibility
          const dateObj = new Date(day.date)
          const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" })[0] // M, T, W...
          const isToday = i === stats.chartData.length - 1

          return (
            <div key={day.date} className="group relative flex flex-1 flex-col items-center justify-end">
              <div
                className={`w-full rounded-t-sm transition-all ${
                  isToday ? "bg-primary-500" : "bg-primary-200"
                }`}
                style={{ height: `${height}%` }}
              />
              <span className={`mt-2 text-[10px] ${isToday ? "font-bold text-primary-900" : "font-medium text-primary-400"}`}>
                {dayName}
              </span>
              
              {/* Tooltip */}
              <div className="pointer-events-none absolute -top-8 hidden whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:block group-hover:opacity-100">
                {day.count} cards
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
