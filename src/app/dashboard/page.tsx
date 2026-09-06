"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { api } from "@/lib/trpc-provider"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Loader2 } from "lucide-react"

// Priority-1 components (R-20)
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting"
import { TopikGoalCard } from "@/components/dashboard/TopikGoalCard"
import { TodayStudyCard } from "@/components/dashboard/TodayStudyCard"
import { TodayProgress } from "@/components/dashboard/TodayProgress"

// Priority-2 components (R-21)
import { ProgressOverview } from "@/components/dashboard/ProgressOverview"
import { ContinueLearning } from "@/components/dashboard/ContinueLearning"
import { WeakAreas } from "@/components/dashboard/WeakAreas"
import { WeeklyStats } from "@/components/dashboard/WeeklyStats"
import { RecentActivity } from "@/components/dashboard/RecentActivity"

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  // Fetch dashboard summary (only when authenticated)
  const { data: summary, isLoading: summaryLoading, error } =
    api.dashboard.summary.useQuery(undefined, {
      enabled: status === "authenticated",
      staleTime: 60_000, // 1 min
      refetchOnWindowFocus: false,
    })

  // Fetch user's sets to determine vocabulary CTA
  const { data: mySets = [] } = api.sets.my.useQuery(undefined, {
    enabled: status === "authenticated",
    staleTime: 60_000,
  })

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  const isLoading = summaryLoading
  const goal = summary?.goal ?? null
  const today = summary?.today
  const streak = summary?.streak?.current ?? 0
  const firstSetId = mySets[0]?.id ?? null

  return (
    <div className="flex min-h-screen-safe flex-col bg-gray-50">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-24 pt-4">

        {/* ── Greeting ─────────────────────────────────────── */}
        <DashboardGreeting
          streak={streak}
          goal={
            goal
              ? {
                  examType: goal.examType,
                  targetLevel: goal.targetLevel,
                  daysRemaining: goal.daysRemaining ?? null,
                }
              : null
          }
          isLoading={isLoading}
        />

        {/* ── Section error (non-fatal) ─────────────────────── */}
        {error && !isLoading && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            Unable to load some dashboard data. Other sections may still be available.
          </div>
        )}

        <div className="space-y-4">
          {/* ── Row 1: Today's Study + TOPIK Goal ─────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TodayStudyCard
              reviewDue={today?.reviewDue ?? 0}
              mySetsCount={mySets.length}
              firstSetId={firstSetId}
              isLoading={isLoading}
            />
            <TopikGoalCard goal={goal} isLoading={isLoading} />
          </div>

          {/* ── Today's Progress ───────────────────────────────── */}
          <TodayProgress
            completedTasks={today?.completedTasks ?? 0}
            totalTasks={today?.totalTasks ?? 0}
            progressPercent={today?.progressPercent ?? 0}
            isLoading={isLoading}
          />

          {/* ── Priority-2 sections (R-21) ── */}
          {summary?.progress && (
            <ProgressOverview
              progress={{
                vocabulary: summary.progress.vocabulary,
                grammar: summary.progress.grammar,
                reading: summary.progress.reading,
                listening: summary.progress.listening,
              }}
              isLoading={isLoading}
            />
          )}

          <ContinueLearning
            sets={summary?.continueLearning ?? []}
            isLoading={isLoading}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <WeakAreas
              areas={(summary?.weakAreas ?? []) as Array<{
                type: string
                accuracy: number | null
                totalAttempts: number
                severity: "weak" | "needs_practice" | "good" | "insufficient_data"
              }>}
              isLoading={isLoading}
            />
            <WeeklyStats
              stats={
                summary?.weeklyStats ?? {
                  cardsReviewed: 0,
                  questionsAnswered: 0,
                  accuracy: null,
                  chartData: [],
                  hasData: false,
                }
              }
              isLoading={isLoading}
            />
          </div>

          <RecentActivity
            activities={summary?.recentActivity ?? []}
            isLoading={isLoading}
          />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
