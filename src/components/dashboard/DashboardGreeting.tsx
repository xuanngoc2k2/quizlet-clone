"use client"

import { useSession } from "next-auth/react"
import { Flame } from "lucide-react"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

interface DashboardGreetingProps {
  streak: number
  goal: {
    examType: string
    targetLevel: number
    daysRemaining: number | null
  } | null
  isLoading?: boolean
}

export function DashboardGreeting({ streak, goal, isLoading }: DashboardGreetingProps) {
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(" ")[0] ?? "there"
  const greeting = getGreeting()

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 p-6 text-white shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold sm:text-2xl">
            {greeting}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-primary-100">
            Let&apos;s continue your TOPIK journey.
          </p>

          {/* Compact summary */}
          {isLoading ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-24 animate-pulse rounded-full bg-white/20" />
              ))}
            </div>
          ) : goal ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/15 px-3 py-1 font-medium">
                {goal.examType === "TOPIK_I" ? "TOPIK I" : "TOPIK II"}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 font-medium">
                Target Level {goal.targetLevel}
              </span>
              {goal.daysRemaining !== null && (
                <span className="rounded-full bg-white/15 px-3 py-1 font-medium">
                  {goal.daysRemaining > 0
                    ? `${goal.daysRemaining} days remaining`
                    : "Exam day!"}
                </span>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-primary-200">
              Set your TOPIK goal to personalize your dashboard.
            </p>
          )}
        </div>

        {/* Streak badge */}
        {streak > 0 && (
          <div className="shrink-0 flex flex-col items-center gap-0.5 rounded-2xl bg-white/15 px-3 py-2 text-center">
            <Flame className="h-5 w-5 text-orange-300" />
            <span className="text-lg font-bold leading-none">{streak}</span>
            <span className="text-[10px] text-primary-100">day streak</span>
          </div>
        )}
      </div>
    </div>
  )
}
