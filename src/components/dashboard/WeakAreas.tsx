"use client"

import { AlertTriangle, TrendingUp, CheckCircle, HelpCircle } from "lucide-react"

type WeakAreaSeverity = "weak" | "needs_practice" | "good" | "insufficient_data"

interface WeakArea {
  type: string
  accuracy: number | null
  totalAttempts: number
  severity: WeakAreaSeverity
}

const severityConfig: Record<WeakAreaSeverity, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  weak: { color: "text-red-600", bgColor: "bg-red-50", icon: AlertTriangle, label: "Weak" },
  needs_practice: { color: "text-amber-600", bgColor: "bg-amber-50", icon: TrendingUp, label: "Needs Practice" },
  good: { color: "text-emerald-600", bgColor: "bg-emerald-50", icon: CheckCircle, label: "Good" },
  insufficient_data: { color: "text-primary-400", bgColor: "bg-primary-50", icon: HelpCircle, label: "Not enough data" },
}

export function WeakAreas({
  areas,
  isLoading,
}: {
  areas: WeakArea[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="card-base h-full">
        <div className="mb-4 h-5 w-32 animate-pulse rounded-lg bg-primary-100" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-primary-50" />
          ))}
        </div>
      </div>
    )
  }

  // Filter out good and insufficient data, or just show top 3 weak/needs practice
  const displayAreas = areas
    .filter((a) => a.severity === "weak" || a.severity === "needs_practice")
    .slice(0, 3)

  return (
    <div className="card-base h-full flex flex-col">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-400">
        Weak Areas
      </h2>

      {displayAreas.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
            <CheckCircle className="h-6 w-6" />
          </div>
          <p className="font-semibold text-primary-900">You&apos;re doing great!</p>
          <p className="mt-1 text-sm text-primary-400">
            No weak areas detected recently. Keep practicing to maintain your skills.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayAreas.map((area) => {
            const config = severityConfig[area.severity]
            const Icon = config.icon

            return (
              <div key={area.type} className="flex items-center gap-3 rounded-xl border border-primary-100 p-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bgColor} ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold capitalize text-primary-900">
                    {area.type}
                  </p>
                  <p className={`text-xs font-medium ${config.color}`}>
                    {config.label}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-primary-900">
                    {area.accuracy != null ? `${Math.round(area.accuracy * 100)}%` : "-"}
                  </p>
                  <p className="text-[10px] text-primary-400">Accuracy</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
