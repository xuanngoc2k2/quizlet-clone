"use client"

import { api } from "@/lib/trpc-provider"
import { getOwnSetIds } from "@/lib/local-storage"
import { SetCard } from "@/components/set/SetCard"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"

export default function HomePage() {
  const { data: sets, isLoading } = api.sets.list.useQuery({})
  const ownSetIds = getOwnSetIds()
  const mySets = sets?.filter((s) => ownSetIds.includes(s.id)) ?? []

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        {mySets.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold">My Sets</h2>
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
          <h2 className="mb-3 text-lg font-bold">Browse Sets</h2>
          <p className="mb-4 text-sm text-gray-500">Flashcard sets for everyone</p>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : sets?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium text-gray-500">No sets yet</p>
              <p className="text-sm text-gray-400">Create the first flashcard set!</p>
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
