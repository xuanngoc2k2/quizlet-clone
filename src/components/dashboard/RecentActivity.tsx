"use client"

import Link from "next/link"
import { Brain, FileText, ChevronRight, History } from "lucide-react"

interface Activity {
  id: string
  type: string
  title: string
  createdAt: string
}

export function RecentActivity({
  activities,
  isLoading,
}: {
  activities: Activity[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="card-base">
        <div className="mb-4 h-5 w-36 animate-pulse rounded-lg bg-primary-100" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-primary-50" />
          ))}
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="card-base">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-400">
          Recent Tests
        </h2>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-300">
            <History className="h-6 w-6" />
          </div>
          <p className="font-semibold text-primary-900">No recent tests</p>
          <p className="mt-1 text-sm text-primary-400">
            Take a practice test to see your history here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card-base">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-primary-400">
          Recent Tests
        </h2>
        <Link
          href="/test"
          className="flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-700 transition-colors"
        >
          Take a Test <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {activities.slice(0, 5).map((activity) => (
          <Link
            key={activity.id}
            href={`/test/history/${activity.id}`}
            className="group flex items-center gap-3 rounded-xl p-2 transition-all hover:bg-primary-50"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                activity.type === "set_test"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {activity.type === "set_test" ? (
                <FileText className="h-5 w-5" />
              ) : (
                <Brain className="h-5 w-5" />
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary-900 group-hover:text-primary-600 transition-colors">
                {activity.title}
              </p>
              <p className="text-xs text-primary-400">
                {new Date(activity.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
            
            <ChevronRight className="h-4 w-4 shrink-0 text-primary-300 transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  )
}
