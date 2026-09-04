"use client"

import { useMemo } from "react"

interface HeatmapDay {
  date: string // "YYYY-MM-DD"
  count: number
}

interface HeatmapCalendarProps {
  data: HeatmapDay[]
}

function getColorClass(count: number): string {
  if (count === 0) return "bg-primary-100"
  if (count <= 3) return "bg-emerald-200"
  if (count <= 8) return "bg-emerald-400"
  if (count <= 15) return "bg-emerald-500"
  return "bg-emerald-700"
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00Z")
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })
}

export function HeatmapCalendar({ data }: HeatmapCalendarProps) {
  const { weeks, monthLabels } = useMemo(() => {
    // Build map for quick lookup
    const countMap = new Map<string, number>()
    for (const d of data) countMap.set(d.date, d.count)

    // Build 52 full weeks (364 days) ending today
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // Start from 51 weeks ago, on Sunday
    const start = new Date(today)
    start.setUTCDate(start.getUTCDate() - 51 * 7 - start.getUTCDay())

    const weeksArr: { date: string; count: number }[][] = []
    const months: { label: string; col: number }[] = []
    let lastMonth = -1

    let cursor = new Date(start)
    for (let w = 0; w < 53; w++) {
      const week: { date: string; count: number }[] = []
      for (let d = 0; d < 7; d++) {
        const ds = toDateStr(cursor)
        const month = cursor.getUTCMonth()
        if (month !== lastMonth) {
          months.push({ label: cursor.toLocaleString("vi-VN", { month: "short", timeZone: "UTC" }), col: w })
          lastMonth = month
        }
        week.push({ date: ds, count: countMap.get(ds) ?? 0 })
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }
      weeksArr.push(week)
    }

    return { weeks: weeksArr, monthLabels: months }
  }, [data])

  const dayLabels = ["CN", "T2", "T4", "T6", "T7"]
  const dayIndices = [0, 1, 3, 5, 6]

  return (
    <div className="overflow-x-auto rounded-2xl border border-primary-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-display text-sm font-bold text-primary-700">Lịch học trong năm</h3>
      <div className="flex gap-1 text-[10px] text-primary-400 min-w-max">
        {/* Day-of-week labels on left */}
        <div className="flex flex-col gap-[3px] mr-1 pt-5">
          {dayIndices.map((idx, i) => (
            <span
              key={idx}
              style={{ marginTop: i === 0 ? 0 : idx === dayIndices[i - 1] + 1 ? 0 : "calc(1*13px + 1*3px)" }}
              className="h-[13px] leading-[13px]"
            >
              {dayLabels[i]}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-0">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-1">
            {weeks.map((_, wi) => {
              const ml = monthLabels.find((m) => m.col === wi)
              return (
                <div key={wi} className="w-[13px] text-[9px] text-primary-400 overflow-visible whitespace-nowrap">
                  {ml ? ml.label : ""}
                </div>
              )
            })}
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day) => {
                  const isFuture = day.date > toDateStr(new Date())
                  return (
                    <div
                      key={day.date}
                      title={isFuture ? "" : `${formatDate(day.date)}: ${day.count} thẻ`}
                      className={`h-[13px] w-[13px] rounded-[3px] transition-colors ${
                        isFuture ? "bg-primary-50" : getColorClass(day.count)
                      }`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-primary-400">
        <span>Ít</span>
        {[0, 3, 8, 15, 20].map((n) => (
          <div key={n} className={`h-[13px] w-[13px] rounded-[3px] ${getColorClass(n)}`} />
        ))}
        <span>Nhiều</span>
      </div>
    </div>
  )
}
