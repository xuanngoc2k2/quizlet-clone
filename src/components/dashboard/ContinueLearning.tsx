"use client"

import Link from "next/link"
import { ChevronRight, FileText } from "lucide-react"

interface SetProgress {
  id: string
  title: string
  totalCards: number
  graduatedCards: number
  progressPercent: number
  lastStudiedAt: string
}

export function ContinueLearning({
  sets,
  isLoading,
}: {
  sets: SetProgress[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="card-base">
        <div className="mb-4 h-5 w-44 animate-pulse rounded-lg bg-primary-100" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-primary-50" />
          ))}
        </div>
      </div>
    )
  }

  if (sets.length === 0) return null // Hide section if no sets

  return (
    <div className="card-base">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-primary-400">
          Continue Learning
        </h2>
        <Link
          href="/my-sets"
          className="flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-700 transition-colors"
        >
          View All <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {sets.map((set) => (
          <Link
            key={set.id}
            href={`/set/${set.id}/study`}
            className="group flex flex-col justify-between rounded-xl border border-primary-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div>
              <div className="mb-2 flex items-center gap-2 text-primary-400">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-medium uppercase">{set.totalCards} cards</span>
              </div>
              <h3 className="line-clamp-2 font-semibold text-primary-900 group-hover:text-primary-600 transition-colors">
                {set.title}
              </h3>
            </div>
            
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs text-primary-500">
                <span>Mastered</span>
                <span className="font-semibold">{set.progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-100">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all"
                  style={{ width: `${set.progressPercent}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
