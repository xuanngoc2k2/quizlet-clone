"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { SetCard } from "@/components/set/SetCard"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") ?? ""

  const { data: sets, isLoading } = api.sets.list.useQuery(
    { search: query },
    { enabled: query.length > 0 },
  )

  return (
    <main className="flex-1 px-4 pb-24 pt-4">
      <h1 className="mb-1 text-2xl font-bold">Search</h1>
      {query && <p className="mb-6 text-sm text-gray-500">Results for &quot;{query}&quot;</p>}

      {!query ? (
        <p className="text-sm text-gray-400">Type something in the search bar</p>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : sets?.length === 0 ? (
        <p className="text-sm text-gray-500">No sets found for &quot;{query}&quot;</p>
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
  )
}

export default function SearchPage() {
  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <Suspense fallback={
        <main className="flex-1 px-4 pb-24 pt-4">
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
        </main>
      }>
        <SearchContent />
      </Suspense>
      <BottomNav />
    </div>
  )
}
