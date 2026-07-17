"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { api } from "@/lib/trpc-provider"
import { addOwnSetId } from "@/lib/local-storage"
import { SetForm } from "@/components/set/SetForm"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"

export default function CreateSetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const createSet = api.sets.create.useMutation()

  async function handleSubmit(data: { title: string; description: string; cards: { term: string; definition: string }[] }) {
    setLoading(true)
    try {
      const set = await createSet.mutateAsync(data)
      addOwnSetId(set.id)
      router.push(`/set/${set.id}`)
    } catch {
      setLoading(false)
    }
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
