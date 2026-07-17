"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { getProgress } from "@/lib/local-storage"

const modes = [
  { key: "flashcard", label: "Flashcards", icon: "🃏", desc: "Flip through cards" },
  { key: "learn", label: "Learn", icon: "📝", desc: "Type the answer" },
  { key: "quiz", label: "Quiz", icon: "❓", desc: "Multiple choice" },
  { key: "match", label: "Match", icon: "🎯", desc: "Match terms & defs" },
  { key: "spell", label: "Spell", icon: "🔊", desc: "Type what you hear" },
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
          className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to set
        </Link>

        <h1 className="mb-1 text-2xl font-bold">{set?.title ?? "Study"}</h1>
        {setProgress && (
          <p className="mb-6 text-sm text-gray-500">
            Last studied: {new Date(setProgress.date).toLocaleDateString()}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {modes.map((mode) => {
            const modeProgress = progress[id]?.mode === mode.key ? progress[id] : null
            return (
              <Link
                key={mode.key}
                href={`/set/${id}/study/${mode.key}`}
                className="flex items-center gap-4 rounded-xl border bg-white p-4 transition-all active:scale-[0.98]"
              >
                <span className="text-2xl">{mode.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold">{mode.label}</h3>
                  <p className="text-sm text-gray-500">{mode.desc}</p>
                </div>
                {modeProgress && (
                  <span className="text-xs text-gray-400">
                    {Math.round((modeProgress.correct / Math.max(modeProgress.correct + modeProgress.incorrect, 1)) * 100)}%
                  </span>
                )}
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )
          })}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
