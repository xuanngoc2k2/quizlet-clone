"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { api } from "@/lib/trpc-provider"
import { SetForm } from "@/components/set/SetForm"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"

export default function EditSetPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { data: set, isLoading } = api.sets.getById.useQuery({ id })
  const updateSet = api.sets.update.useMutation()

  async function handleSubmit(data: { title: string; description: string; cards: { term: string; definition: string }[] }) {
    if (!set) return
    setLoading(true)
    try {
      await updateSet.mutateAsync({
        id: set.id,
        title: data.title,
        description: data.description,
        cards: data.cards,
      })
      router.push(`/set/${set.id}`)
    } catch {
      setLoading(false)
    }
  }

  if (isLoading || !set) {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex-1 px-4 pb-24 pt-4">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <h1 className="mb-6 text-2xl font-bold">Edit Set</h1>
        <SetForm
          initialTitle={set.title}
          initialDescription={set.description ?? ""}
          initialCards={set.cards.map((c) => ({ term: c.term, definition: c.definition }))}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          loading={loading}
        />
      </main>
      <BottomNav />
    </div>
  )
}
