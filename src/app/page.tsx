"use client"

import { api } from "@/lib/trpc-provider"
import { SetCard } from "@/components/set/SetCard"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"

export default function HomePage() {
  const { data: sets, isLoading } = api.sets.list.useQuery({})

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <h1 className="mb-1 text-2xl font-bold">Browse Sets</h1>
        <p className="mb-6 text-sm text-gray-500">Flashcard sets for everyone</p>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-gray-200"
              />
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
      </main>
      <BottomNav />
    </div>
  )
}
