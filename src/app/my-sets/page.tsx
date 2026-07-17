"use client"

import { api } from "@/lib/trpc-provider"
import { getOwnSetIds } from "@/lib/local-storage"
import { SetCard } from "@/components/set/SetCard"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { BookOpen } from "lucide-react"

export default function MySetsPage() {
  const ownSetIds = getOwnSetIds()
  const { data: allSets, isLoading } = api.sets.list.useQuery({})

  const mySets = allSets?.filter((s) => ownSetIds.includes(s.id)) ?? []

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <h1 className="mb-6 font-display text-2xl font-bold text-primary-900">My Sets</h1>

        {ownSetIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-200 py-16 text-center">
            <BookOpen className="mb-3 h-10 w-10 text-primary-300" />
            <p className="text-lg font-medium text-primary-500">No sets yet</p>
            <p className="text-sm text-primary-400">Sets you create will appear here</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-primary-100" />
            ))}
          </div>
        ) : (
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
        )}
      </main>
      <BottomNav />
    </div>
  )
}
