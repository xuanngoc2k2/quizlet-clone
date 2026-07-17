"use client"

import { api } from "@/lib/trpc-provider"
import { getOwnSetIds } from "@/lib/local-storage"
import { SetCard } from "@/components/set/SetCard"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"

export default function MySetsPage() {
  const ownSetIds = getOwnSetIds()
  const { data: allSets, isLoading } = api.sets.list.useQuery({})

  const mySets = allSets?.filter((s) => ownSetIds.includes(s.id)) ?? []

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <h1 className="mb-6 text-2xl font-bold">My Sets</h1>

        {ownSetIds.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg font-medium text-gray-500">No sets yet</p>
            <p className="text-sm text-gray-400">Sets you create will appear here</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
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
