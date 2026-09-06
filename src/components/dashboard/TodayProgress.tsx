"use client"

import { CheckCircle2 } from "lucide-react"

interface TodayProgressProps {
  completedTasks: number
  totalTasks: number
  progressPercent: number
  isLoading?: boolean
}

export function TodayProgress({
  completedTasks,
  totalTasks,
  progressPercent,
  isLoading,
}: TodayProgressProps) {
  if (isLoading) {
    return (
      <div className="card-base flex flex-col gap-3">
        <div className="h-5 w-36 animate-pulse rounded-lg bg-primary-100" />
        <div className="h-3 animate-pulse rounded-full bg-primary-50" />
        <div className="h-4 w-24 animate-pulse rounded-lg bg-primary-100" />
      </div>
    )
  }

  const clampedPercent = Math.min(100, Math.max(0, progressPercent))
  const isComplete = clampedPercent >= 100

  return (
    <div className={`card-base flex flex-col gap-3 ${isComplete ? "border-emerald-200 bg-emerald-50/30" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2
            className={`h-4 w-4 ${isComplete ? "text-emerald-500" : "text-primary-300"}`}
          />
          <h2 className="text-sm font-bold uppercase tracking-wide text-primary-400">
            Today&apos;s Progress
          </h2>
        </div>
        <span
          className={`text-sm font-bold ${
            isComplete ? "text-emerald-600" : "text-primary-600"
          }`}
        >
          {clampedPercent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-primary-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isComplete
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : "bg-gradient-to-r from-primary-500 to-primary-400"
          }`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>

      {/* Task count */}
      <p className="text-xs text-primary-400">
        {totalTasks === 0 ? (
          "No tasks scheduled for today"
        ) : isComplete ? (
          <span className="font-semibold text-emerald-600">
            🎉 All {totalTasks} tasks completed!
          </span>
        ) : (
          <>
            <span className="font-semibold text-primary-700">
              {completedTasks}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-primary-700">
              {totalTasks}
            </span>{" "}
            tasks completed
          </>
        )}
      </p>
    </div>
  )
}
