"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { SetCard } from "@/components/set/SetCard"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Search, BookOpen } from "lucide-react"

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") ?? ""

  const { data: sets, isLoading } = api.sets.list.useQuery(
    { search: query },
    { enabled: query.length > 0 },
  )

  return (
    <main className="flex-1 px-4 pb-24 pt-4">
      <h1 className="mb-1 font-display text-2xl font-bold text-primary-900">Search</h1>
      {query && (
        <p className="mb-6 text-sm text-primary-500">
          Results for &quot;<span className="font-medium">{query}</span>&quot;
        </p>
      )}

      {!query ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-200 py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-primary-300" />
          <p className="text-sm font-medium text-primary-500">Type something in the search bar</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-primary-100" />
          ))}
        </div>
      ) : sets?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-200 py-16 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-primary-300" />
          <p className="text-sm font-medium text-primary-500">No sets found for &quot;{query}&quot;</p>
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
  )
}

export default function SearchPage() {
  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <Suspense fallback={
        <main className="flex-1 px-4 pb-24 pt-4">
          <div className="h-8 w-24 animate-pulse rounded-lg bg-primary-100" />
        </main>
      }>
        <SearchContent />
      </Suspense>
      <BottomNav />
    </div>
  )
}
