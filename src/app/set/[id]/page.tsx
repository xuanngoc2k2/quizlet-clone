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
import { GraduationCap, PenLine, Trash2 } from "lucide-react"

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
          <div className="h-8 w-48 animate-pulse rounded-lg bg-primary-100" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-primary-100" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-primary-100" />
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
          <p className="text-primary-500">Set not found</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 p-6 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary-100" />
            <span className="text-sm font-medium text-primary-100">
              {set.cards.length} {set.cards.length === 1 ? "card" : "cards"}
            </span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold">{set.title}</h1>
          {set.description && (
            <p className="mt-1 text-sm text-primary-100">{set.description}</p>
          )}
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link href={`/set/${id}/study`}>
            <Button variant="gradient" size="lg">
              <GraduationCap className="h-4 w-4" />
              Study
            </Button>
          </Link>
          {isOwnSet && (
            <>
              <Link href={`/set/${id}/edit`}>
                <Button variant="secondary">
                  <PenLine className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button variant="danger" onClick={() => setShowDelete(true)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>

        <h2 className="mb-3 font-display text-sm font-semibold text-primary-700">Cards</h2>
        <div className="flex flex-col gap-2">
          {set.cards.map((card, i) => (
            <div
              key={card.id}
              className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-600">
                {i + 1}
              </span>
              <div className="flex flex-1 gap-4">
                  <span className="flex-1 font-medium text-primary-900 whitespace-pre-wrap"><MathText text={card.term} /></span>
                  <span className="flex-1 text-primary-600 whitespace-pre-wrap"><MathText text={card.definition} /></span>
              </div>
            </div>
          ))}
        </div>
      </main>
      <BottomNav />

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Set?">
        <p className="mb-4 text-sm text-primary-500">
          This will permanently delete &quot;{set.title}&quot; and all {set.cards.length} cards.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete} loading={deleteSet.isLoading}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
