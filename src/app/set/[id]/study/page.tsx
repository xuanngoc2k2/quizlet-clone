"use client"

import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { api } from "@/lib/trpc-provider"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { getProgress } from "@/lib/local-storage"
import { RememberedFilter } from "@/components/study/RememberedFilter"
import type { RememberedFilter as RememberedFilterType } from "@/types"
import { Layers, PenLine, HelpCircle, Target, Volume2, ChevronRight, ArrowLeft } from "lucide-react"

const modes = [
  {
    key: "adaptive",
    label: "Smart Learn (AI)",
    icon: Target,
    desc: "Tự động gợi ý mức độ khó",
    color: "bg-pink-500",
  },
  {
    key: "flashcard",
    label: "Flashcards",
    icon: Layers,
    desc: "Flip through cards",
    color: "bg-blue-500",
  },
  { key: "learn", label: "Learn", icon: PenLine, desc: "Type the answer", color: "bg-emerald-500" },
  { key: "quiz", label: "Quiz", icon: HelpCircle, desc: "Multiple choice", color: "bg-amber-500" },
  {
    key: "match",
    label: "Match",
    icon: Target,
    desc: "Match terms & defs",
    color: "bg-violet-500",
  },
  { key: "spell", label: "Spell", icon: Volume2, desc: "Type what you hear", color: "bg-rose-500" },
] as const

export default function StudyHubPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<RememberedFilterType>(
    (searchParams.get("remembered") as RememberedFilterType) ?? "all",
  )
  const { data: set } = api.sets.getById.useQuery({ id })
  const { data: cardProgress = {} } = api.cardProgress.getBySet.useQuery({ setId: id })
  const progress = getProgress()
  const setProgress = progress[id]

  const counts = useMemo(() => {
    const items = set?.cards ?? []
    const c: Record<RememberedFilterType, number> = {
      all: items.length,
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0,
    }
    for (const card of items) {
      const remembered = cardProgress[card.id] ?? 0
      if (remembered >= 3) c["3"]++
      else if (remembered === 2) c["2"]++
      else if (remembered === 1) c["1"]++
      else c["0"]++
    }
    return c
  }, [set?.cards, cardProgress])

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 md:px-8 lg:pt-7">
        <Link
          href={`/set/${id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to set
        </Link>

        <div className="mb-5">
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {set?.title ?? "Study"}
          </h1>
          {setProgress && (
            <p className="mt-1 text-sm text-slate-500">
              Last studied: {new Date(setProgress.date).toLocaleDateString()}
            </p>
          )}
        </div>

        <RememberedFilter value={filter} onChange={setFilter} cardCounts={counts} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modes.map((mode) => {
            const Icon = mode.icon
            const modeProgress = progress[id]?.mode === mode.key ? progress[id] : null
            const href =
              filter === "all"
                ? `/set/${id}/study/${mode.key}`
                : `/set/${id}/study/${mode.key}?remembered=${filter}`
            return (
              <Link
                key={mode.key}
                href={href}
                className="group flex min-h-[112px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md active:scale-[0.98]"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${mode.color} text-white`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-sm font-semibold text-slate-900">
                    {mode.label}
                  </h3>
                  <p className="text-xs text-slate-500">{mode.desc}</p>
                </div>
                <span className="text-xs font-medium text-slate-500">{counts[filter]} cards</span>
                {modeProgress && filter === "all" && (
                  <span className="text-xs font-semibold text-slate-500">
                    {Math.round(
                      (modeProgress.correct /
                        Math.max(modeProgress.correct + modeProgress.incorrect, 1)) *
                        100,
                    )}
                    %
                  </span>
                )}
                <ChevronRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-slate-500" />
              </Link>
            )
          })}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
