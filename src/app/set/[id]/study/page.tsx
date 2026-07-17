"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { getProgress } from "@/lib/local-storage"
import { Layers, PenLine, HelpCircle, Target, Volume2, ChevronRight, ArrowLeft } from "lucide-react"

const modes = [
  { key: "flashcard", label: "Flashcards", icon: Layers, desc: "Flip through cards", color: "bg-blue-500" },
  { key: "learn", label: "Learn", icon: PenLine, desc: "Type the answer", color: "bg-emerald-500" },
  { key: "quiz", label: "Quiz", icon: HelpCircle, desc: "Multiple choice", color: "bg-amber-500" },
  { key: "match", label: "Match", icon: Target, desc: "Match terms & defs", color: "bg-violet-500" },
  { key: "spell", label: "Spell", icon: Volume2, desc: "Type what you hear", color: "bg-rose-500" },
] as const

export default function StudyHubPage() {
  const { id } = useParams<{ id: string }>()
  const { data: set } = api.sets.getById.useQuery({ id })
  const progress = getProgress()
  const setProgress = progress[id]

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <Link
          href={`/set/${id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to set
        </Link>

        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-primary-900">{set?.title ?? "Study"}</h1>
          {setProgress && (
            <p className="mt-1 text-sm text-primary-400">
              Last studied: {new Date(setProgress.date).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {modes.map((mode) => {
            const Icon = mode.icon
            const modeProgress = progress[id]?.mode === mode.key ? progress[id] : null
            return (
              <Link
                key={mode.key}
                href={`/set/${id}/study/${mode.key}`}
                className="group flex items-center gap-4 rounded-2xl border border-primary-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${mode.color} text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-primary-900">{mode.label}</h3>
                  <p className="text-sm text-primary-500">{mode.desc}</p>
                </div>
                {modeProgress && (
                  <span className="text-xs font-semibold text-primary-400">
                    {Math.round((modeProgress.correct / Math.max(modeProgress.correct + modeProgress.incorrect, 1)) * 100)}%
                  </span>
                )}
                <ChevronRight className="h-5 w-5 text-primary-300 transition-colors group-hover:text-primary-500" />
              </Link>
            )
          })}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
