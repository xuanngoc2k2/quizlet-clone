"use client"

import { api } from "@/lib/trpc-provider"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import {
  Brain,
  Flame,
  ChevronRight,
  BookOpen,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react"

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  color: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-primary-100 bg-white p-4 shadow-sm">
      <div className={`rounded-xl p-2.5 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <span className="text-2xl font-bold text-primary-900">{value}</span>
      <span className="text-center text-xs text-primary-400">{label}</span>
    </div>
  )
}

export default function ReviewDashboardPage() {
  const { data: dueCards = [], isLoading } =
    api.cardProgress.getDueWithDetails.useQuery()

  // Nhóm cards theo set
  const bySet = dueCards.reduce<
    Record<string, { setId: string; title: string; count: number }>
  >((acc, card) => {
    if (!acc[card.setId]) {
      acc[card.setId] = { setId: card.setId, title: card.setTitle, count: 0 }
    }
    acc[card.setId].count += 1
    return acc
  }, {})

  const sets = Object.values(bySet).sort((a, b) => b.count - a.count)
  const total = dueCards.length

  // Breakdown theo SRS state
  const learning = dueCards.filter((c) => c.srsState === "learning").length
  const review = dueCards.filter((c) => c.srsState === "review").length

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        {/* Hero banner */}
        <section className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-6 text-white shadow-lg">
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Brain className="h-6 w-6" />
                <h1 className="font-display text-2xl font-bold">Daily Review</h1>
              </div>
              <p className="text-sm text-white/80">
                Ôn tập thẻ từ tất cả set trong một phiên
              </p>
            </div>
            {total > 0 && (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                <span className="text-2xl font-bold">{total}</span>
              </div>
            )}
          </div>

          {total > 0 && (
            <div className="mt-5">
              <Link href="/review/session">
                <Button
                  variant="gradient"
                  className="w-full bg-white text-violet-700 hover:bg-white/90"
                >
                  <Flame className="h-4 w-4" />
                  Bắt đầu ôn tập ({total} thẻ)
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </section>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-primary-100" />
            ))}
          </div>
        ) : total === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-200 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="font-display text-xl font-bold text-primary-900">
              Tuyệt vời! 🎉
            </h2>
            <p className="mt-1 text-sm text-primary-400">
              Không có thẻ nào cần ôn hôm nay.
            </p>
            <p className="mt-0.5 text-xs text-primary-300">
              Hãy học thêm thẻ mới từ các Set của bạn
            </p>
            <Link href="/" className="mt-6">
              <Button variant="secondary" size="sm">
                <BookOpen className="h-4 w-4" />
                Duyệt Sets
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <StatCard
                icon={Sparkles}
                label="Tổng thẻ due"
                value={total}
                color="bg-gradient-to-br from-violet-500 to-purple-600"
              />
              <StatCard
                icon={Clock}
                label="Đang học"
                value={learning}
                color="bg-gradient-to-br from-amber-500 to-orange-500"
              />
              <StatCard
                icon={Brain}
                label="Ôn lại"
                value={review}
                color="bg-gradient-to-br from-blue-500 to-cyan-500"
              />
            </div>

            {/* Breakdown theo set */}
            <section>
              <h2 className="mb-3 font-display text-base font-bold text-primary-900">
                Phân bổ theo Set
              </h2>
              <div className="flex flex-col gap-2">
                {sets.map((s) => (
                  <div
                    key={s.setId}
                    className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100">
                      <BookOpen className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-primary-900">
                        {s.title}
                      </p>
                    </div>
                    <span className="flex-shrink-0 rounded-xl bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA nút bottom */}
            <div className="mt-6">
              <Link href="/review/session">
                <Button variant="gradient" className="w-full">
                  <Flame className="h-4 w-4" />
                  Bắt đầu ôn tập
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
