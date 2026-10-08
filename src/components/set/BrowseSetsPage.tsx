"use client"

import { api } from "@/lib/trpc-provider"
import { SetCard } from "@/components/set/SetCard"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { BookOpen, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"

export function BrowseSetsPage() {
  const { data: sets, isLoading } = api.sets.list.useQuery({})
  const mySets = api.sets.my.useQuery()
  const browseSets = sets ?? []

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-8">
        <section className="mb-8 overflow-hidden rounded-2xl border border-primary-100 bg-primary-50 p-6 sm:p-8">
          <div className="relative z-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
              Learn
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Browse Korean Sets
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-slate-600">
              Find a focused set and start learning with flashcards, quizzes, and more.
            </p>
            {sets && sets.length > 0 && (
              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary-700">
                <Sparkles className="h-4 w-4 text-primary-500" />
                <span>{browseSets.length} sets available</span>
              </div>
            )}
          </div>
        </section>

        {(mySets.data?.length ?? 0) > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Continue learning
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">My Sets</h2>
              </div>
              <Link href="/my-sets">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(mySets.data ?? []).map((set) => (
                <SetCard
                  key={set.id}
                  id={set.id}
                  title={set.title}
                  description={set.description}
                  cardCount={set._count.cards}
                  graduatedCount={(set as any).graduatedCount}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Build your library
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">All Sets</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />
              ))}
            </div>
          ) : browseSets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-lg font-medium text-slate-500">No sets yet</p>
              <p className="text-sm text-slate-400">Create the first flashcard set!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {browseSets.map((set) => (
                <SetCard
                  key={set.id}
                  id={set.id}
                  title={set.title}
                  description={set.description}
                  cardCount={set._count.cards}
                  graduatedCount={(set as any).graduatedCount}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  )
}
