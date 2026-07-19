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
  const utils = api.useUtils()

  async function handleSubmit(data: { title: string; description: string; cards: { term: string; definition: string }[] }) {
    if (!set) return
    setLoading(true)
    try {
      const updated = await updateSet.mutateAsync({
        id: set.id,
        title: data.title,
        description: data.description,
        cards: data.cards,
      })
      await utils.sets.getById.invalidate({ id: set.id })
      await utils.sets.list.invalidate()
      router.push(`/set/${set.id}`)
    } catch (e) {
      console.error("Save failed", e)
      setLoading(false)
    }
  }

  if (isLoading || !set) {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex-1 px-4 pb-24 pt-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-primary-100" />
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <h1 className="mb-6 font-display text-2xl font-bold text-primary-900">Edit Set</h1>
        <SetForm
          initialTitle={set.title}
          initialDescription={set.description ?? ""}
          initialCards={set.cards.map((c) => ({ term: c.term, definition: c.definition, type: c.type === "grammar" ? "grammar" : "vocabulary" }))}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          loading={loading}
        />
      </main>
      <BottomNav />
    </div>
  )
}
