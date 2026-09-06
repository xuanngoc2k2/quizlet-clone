"use client"

import Link from "next/link"
import { RotateCcw, BookOpen, Brain, Mic, FileText, ChevronRight } from "lucide-react"

interface TodayTask {
  id: string
  icon: React.ElementType
  label: string
  description: string
  count: number | null
  href: string
  ctaLabel: string
  color: string
  bgColor: string
}

interface TodayStudyCardProps {
  reviewDue: number
  mySetsCount: number      // to know if user has own sets for vocabulary CTA
  firstSetId: string | null // first set to link to for vocabulary
  isLoading?: boolean
}

export function TodayStudyCard({
  reviewDue,
  mySetsCount,
  firstSetId,
  isLoading,
}: TodayStudyCardProps) {
  if (isLoading) {
    return (
      <div className="card-base flex flex-col gap-4">
        <div className="h-5 w-40 animate-pulse rounded-lg bg-primary-100" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-primary-50" />
          ))}
        </div>
      </div>
    )
  }

  const tasks: TodayTask[] = [
    {
      id: "review",
      icon: RotateCcw,
      label: "Review",
      description: reviewDue > 0 ? `${reviewDue} cards due` : "No cards due",
      count: reviewDue,
      href: "/review",
      ctaLabel: "Start Review",
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
    {
      id: "vocabulary",
      icon: BookOpen,
      label: "Vocabulary",
      description:
        mySetsCount > 0
          ? `${mySetsCount} set${mySetsCount > 1 ? "s" : ""} available`
          : "No sets yet",
      count: mySetsCount,
      href: firstSetId ? `/set/${firstSetId}/study` : "/my-sets",
      ctaLabel: mySetsCount > 0 ? "Start Learning" : "Browse Sets",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "test",
      icon: Brain,
      label: "Practice Test",
      description: "TOPIK-style questions",
      count: null,
      href: "/test",
      ctaLabel: "Practice",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ]

  // If no activity at all, show empty state
  if (mySetsCount === 0 && reviewDue === 0) {
    return (
      <div className="card-base flex flex-col items-center justify-center gap-3 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-400">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold text-primary-800">No study activity yet</p>
          <p className="mt-1 text-sm text-primary-400">
            Start your first learning session to build your TOPIK progress.
          </p>
        </div>
        <Link
          href="/my-sets"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          <FileText className="h-4 w-4" />
          Explore My Sets
        </Link>
      </div>
    )
  }

  return (
    <div className="card-base flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Mic className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-primary-400">
          Today&apos;s Study
        </h2>
      </div>

      {/* Tasks */}
      <div className="space-y-2">
        {tasks.map((task) => {
          const Icon = task.icon
          return (
            <Link
              key={task.id}
              href={task.href}
              className={`flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all hover:border-primary-100 hover:bg-primary-50/50 group ${
                task.id === "review" && task.count === 0
                  ? "opacity-50 pointer-events-none"
                  : ""
              }`}
            >
              {/* Icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${task.bgColor} ${task.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary-900">{task.label}</p>
                <p className="text-xs text-primary-400">{task.description}</p>
              </div>

              {/* CTA */}
              <div className="flex shrink-0 items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white group-hover:bg-primary-700 transition-colors">
                {task.ctaLabel}
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
