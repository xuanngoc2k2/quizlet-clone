"use client"

import { api } from "@/lib/trpc-provider"
import { getOwnSetIds } from "@/lib/local-storage"
import { SetCard } from "@/components/set/SetCard"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Sparkles, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"

export default function HomePage() {
  const { data: sets, isLoading } = api.sets.list.useQuery({})
  const ownSetIds = getOwnSetIds()
  const mySets = sets?.filter((s) => ownSetIds.includes(s.id)) ?? []

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 p-6 text-white shadow-lg">
          <div className="relative z-10">
            <h1 className="font-display text-2xl font-bold">Study Korean with Flashcards</h1>
            <p className="mt-1.5 text-sm text-primary-100">
              Master TOPIK vocabulary with 5 study modes
            </p>
            {sets && sets.length > 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-white/80">
                <Sparkles className="h-4 w-4" />
                <span>{sets.length} sets available</span>
              </div>
            )}
          </div>
        </section>

        {mySets.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-primary-900">My Sets</h2>
              <Link href="/my-sets">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mySets.map((set) => (
                <SetCard
                  key={set.id}
                  id={set.id}
                  title={set.title}
                  description={set.description}
                  cardCount={set._count.cards}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-primary-900">Browse Sets</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-primary-100" />
              ))}
            </div>
          ) : sets?.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-200 py-16 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-primary-300" />
              <p className="text-lg font-medium text-primary-500">No sets yet</p>
              <p className="text-sm text-primary-400">Create the first flashcard set!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sets?.map((set) => (
                <SetCard
                  key={set.id}
                  id={set.id}
                  title={set.title}
                  description={set.description}
                  cardCount={set._count.cards}
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
