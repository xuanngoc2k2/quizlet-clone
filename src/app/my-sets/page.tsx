"use client"

import { api } from "@/lib/trpc-provider"
import { SetCard } from "@/components/set/SetCard"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { BookOpen, LogIn, Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function MySetsPage() {
  const { status } = useSession()
  const { data: mySets, isLoading } = api.sets.my.useQuery()

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-5 sm:px-6 md:px-8 lg:pt-7">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="section-kicker">Learn</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">My Sets</h1>
          </div>
          <Link href="/set/new">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Set</span>
            </Button>
          </Link>
        </div>

        {status === "unauthenticated" ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <LogIn className="mb-3 h-10 w-10 text-slate-400" />
            <p className="text-lg font-medium text-slate-500">Sign in to see your sets</p>
            <p className="mb-6 text-sm text-slate-500">Your sets are synced to your account</p>
            <Link href="/login">
              <Button variant="primary">Sign in</Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-primary-100" />
            ))}
          </div>
        ) : mySets?.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-16 text-center">
            <BookOpen className="mb-3 h-10 w-10 text-slate-400" />
            <p className="text-lg font-medium text-slate-500">No sets yet</p>
            <p className="text-sm text-slate-500">Sets you create will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mySets?.map((set) => (
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
      </main>
      <BottomNav />
    </div>
  )
}
