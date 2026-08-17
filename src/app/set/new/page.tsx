"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { api } from "@/lib/trpc-provider"
import { SetForm } from "@/components/set/SetForm"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/Button"
import { LogIn } from "lucide-react"

export default function CreateSetPage() {
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(false)
  const createSet = api.sets.create.useMutation()

  async function handleSubmit(data: { title: string; description: string; cards: { term: string; definition: string }[] }) {
    setLoading(true)
    try {
      const set = await createSet.mutateAsync(data)
      router.push(`/set/${set.id}`)
    } catch {
      setLoading(false)
    }
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex-1 px-4 pb-24 pt-4">
          <h1 className="mb-4 font-display text-2xl font-bold text-primary-900">Create Set</h1>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-200 py-16 text-center">
            <LogIn className="mb-3 h-10 w-10 text-primary-300" />
            <p className="text-lg font-medium text-primary-500">Sign in to create sets</p>
            <p className="mb-6 text-sm text-primary-400">Your sets will be saved to your account</p>
            <Link href="/login">
              <Button variant="primary">Sign in</Button>
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <h1 className="mb-6 font-display text-2xl font-bold text-primary-900">Create Set</h1>
        <SetForm onSubmit={handleSubmit} submitLabel="Create Set" loading={loading} />
      </main>
      <BottomNav />
    </div>
  )
}