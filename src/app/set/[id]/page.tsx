"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { removeOwnSetId, getOwnSetIds } from "@/lib/local-storage"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { MathText } from "@/components/ui/MathText"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ViewSetPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: set, isLoading, error } = api.sets.getById.useQuery({ id })
  const deleteSet = api.sets.delete.useMutation()
  const [showDelete, setShowDelete] = useState(false)
  const isOwnSet = getOwnSetIds().includes(id)

  async function handleDelete() {
    await deleteSet.mutateAsync({ id })
    removeOwnSetId(id)
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex-1 px-4 pb-24 pt-4">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (error || !set) {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex-1 px-4 pb-24 pt-4">
          <p className="text-gray-500">Set not found</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{set.title}</h1>
          {set.description && (
            <p className="mt-1 text-sm text-gray-500">{set.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            {set.cards.length} {set.cards.length === 1 ? "card" : "cards"}
          </p>
        </div>

        <div className="mb-8 flex gap-3">
          <Link href={`/set/${id}/study`}>
            <Button size="lg">Study</Button>
          </Link>
          {isOwnSet && (
            <>
              <Link href={`/set/${id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
              <Button variant="danger" onClick={() => setShowDelete(true)}>
                Delete
              </Button>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {set.cards.map((card, i) => (
            <div
              key={card.id}
              className="flex items-center gap-3 rounded-xl border bg-white p-4"
            >
              <span className="min-w-[24px] text-xs font-medium text-gray-400">
                {i + 1}
              </span>
              <div className="flex flex-1 gap-4">
                  <span className="flex-1 font-medium whitespace-pre-wrap"><MathText text={card.term} /></span>
                  <span className="flex-1 text-gray-600 whitespace-pre-wrap"><MathText text={card.definition} /></span>
              </div>
            </div>
          ))}
        </div>
      </main>
      <BottomNav />

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Set?">
        <p className="mb-4 text-sm text-gray-600">
          This will permanently delete &quot;{set.title}&quot; and all {set.cards.length} cards.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete} loading={deleteSet.isLoading}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
