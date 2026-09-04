"use client"

import { Flame, TrendingUp, CalendarCheck } from "lucide-react"

interface StreakCardProps {
  currentStreak: number
  longestStreak: number
  totalDays: number
}

export function StreakCard({ currentStreak, longestStreak, totalDays }: StreakCardProps) {
  const stats = [
    {
      icon: Flame,
      value: currentStreak,
      label: "Ngày liên tiếp",
      color: "from-orange-400 to-rose-500",
      glow: "shadow-orange-200",
    },
    {
      icon: TrendingUp,
      value: longestStreak,
      label: "Kỷ lục",
      color: "from-violet-500 to-purple-600",
      glow: "shadow-violet-200",
    },
    {
      icon: CalendarCheck,
      value: totalDays,
      label: "Tổng ngày học",
      color: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-200",
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ icon: Icon, value, label, color, glow }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-2 rounded-2xl border border-primary-100 bg-white p-4 shadow-sm"
        >
          <div className={`rounded-xl bg-gradient-to-br ${color} p-2.5 shadow-md ${glow}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-primary-900">{value}</span>
          <span className="text-center text-[11px] leading-tight text-primary-400">{label}</span>
        </div>
      ))}
    </div>
  )
}
