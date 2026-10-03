"use client"

import { api } from "@/lib/trpc-provider"
import { SetCard } from "@/components/set/SetCard"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { BookOpen, LogIn } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function MySetsPage() {
  const { status } = useSession()
  const { data: mySets, isLoading } = api.sets.my.useQuery()

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 md:px-8 pb-24 pt-6">
        <h1 className="mb-6 font-display text-2xl font-bold text-slate-900">My Sets</h1>

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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