"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, FolderPlus, LogIn, Plus } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { api } from "@/lib/trpc-provider"
import { buildCardInput, isDuplicateTerm, type CardType } from "@/lib/dictionary-actions"
import { SetPicker } from "./SetPicker"

type Feedback = { kind: "success" | "error" | "info"; text: string }

type AddCardModalProps = {
  open: boolean
  onClose: () => void
  term: string
  definition: string
  editable?: boolean
}

export function AddCardModal({ open, onClose, term, definition, editable = false }: AddCardModalProps) {
  const { status } = useSession()
  const [mode, setMode] = useState<"pick" | "create">("pick")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [editTerm, setEditTerm] = useState(term)
  const [editDefinition, setEditDefinition] = useState(definition)
  const [cardType, setCardType] = useState<CardType>("vocabulary")
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const selected = api.sets.getById.useQuery(
    { id: selectedId ?? "" },
    { enabled: !!selectedId },
  )
  const update = api.sets.update.useMutation()
  const create = api.sets.create.useMutation()

  useEffect(() => {
    if (open) {
      setEditTerm(term)
      setEditDefinition(definition)
      setCardType("vocabulary")
      setMode("pick")
      setSelectedId(null)
      setNewTitle("")
      setFeedback(null)
    }
  }, [open, term, definition])

  const finalTerm = editable ? editTerm : term
  const finalDefinition = editable ? editDefinition : definition

  const handleAdd = async () => {
    setFeedback(null)
    if (!finalTerm.trim() || !finalDefinition.trim()) {
      setFeedback({ kind: "error", text: "Term và Definition không được để trống." })
      return
    }
    const card = buildCardInput(finalTerm, finalDefinition, cardType)

    try {
      if (mode === "create") {
        if (!newTitle.trim()) {
          setFeedback({ kind: "error", text: "Nhập tên set mới." })
          return
        }
        const created = await create.mutateAsync({
          title: newTitle.trim(),
          description: `Tạo từ từ điển · ${finalTerm}`,
          cards: [card],
        })
        setFeedback({ kind: "success", text: `Đã tạo set "${created.title}" và thêm card.` })
      } else {
        if (!selectedId) {
          setFeedback({ kind: "error", text: "Chọn một set để thêm card." })
          return
        }
        const existing = selected.data?.cards ?? []
        if (isDuplicateTerm(existing, finalTerm)) {
          setFeedback({ kind: "info", text: "Từ này đã có trong set — không thêm trùng." })
          return
        }
        await update.mutateAsync({
          id: selectedId,
          cards: [
            ...existing.map((c) => ({
              id: c.id,
              term: c.term,
              definition: c.definition,
              type: (c.type === "grammar" ? "grammar" : "vocabulary") as CardType,
            })),
            card,
          ],
        })
        setFeedback({ kind: "success", text: "Đã thêm card vào set." })
      }
    } catch (err) {
      setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Có lỗi xảy ra." })
    }
  }

  const typeToggle = (value: CardType, activeClass: string) => (
    <button
      type="button"
      onClick={() => setCardType(value)}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
        cardType === value
          ? activeClass
          : "bg-primary-50 text-primary-400 hover:bg-primary-100"
      }`}
    >
      {value === "vocabulary" ? "Từ vựng" : "Ngữ pháp"}
    </button>
  )

  return (
    <Modal open={open} onClose={onClose} title="Thêm vào Set" zIndex="z-[90]">
      {status === "unauthenticated" ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <LogIn className="h-10 w-10 text-primary-300" />
          <p className="text-lg font-medium text-primary-500">Sign in to add cards to sets</p>
          <p className="text-sm text-primary-400">Your sets are saved to your account</p>
          <Link href="/login">
            <Button variant="primary">Sign in</Button>
          </Link>
        </div>
      ) : (
      <div className="flex flex-col gap-3">
        {editable && (
          <div className="flex flex-col gap-2">
            <input
              value={editTerm}
              onChange={(e) => setEditTerm(e.target.value)}
              placeholder="Term"
              className="rounded-xl border border-primary-200 bg-primary-50/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-500/20"
            />
            <textarea
              value={editDefinition}
              onChange={(e) => setEditDefinition(e.target.value)}
              placeholder="Definition"
              rows={2}
              className="rounded-xl border border-primary-200 bg-primary-50/50 px-3 py-2 text-sm outline-none transition-all resize-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-500/20"
            />
            <div className="flex gap-2">
              {typeToggle("vocabulary", "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500/30")}
              {typeToggle("grammar", "bg-amber-100 text-amber-700 ring-2 ring-amber-500/30")}
            </div>
          </div>
        )}

        {!editable && (
          <div className="rounded-xl bg-primary-50 p-3">
            <p className="text-sm font-semibold text-primary-900">{finalTerm}</p>
            <p className="text-sm text-primary-600">{finalDefinition}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("pick")
              setFeedback(null)
            }}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === "pick" ? "bg-primary-600 text-white" : "bg-primary-100 text-primary-600 hover:bg-primary-200"
            }`}
          >
            Chọn set có sẵn
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("create")
              setFeedback(null)
            }}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === "create" ? "bg-primary-600 text-white" : "bg-primary-100 text-primary-600 hover:bg-primary-200"
            }`}
          >
            Tạo set mới
          </button>
        </div>

        {mode === "pick" ? (
          <SetPicker selectedId={selectedId} onSelect={setSelectedId} />
        ) : (
          <div className="flex flex-col gap-1.5">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Tên set mới (vd: Từ vựng TOPIK II)"
              className="rounded-xl border border-primary-200 bg-primary-50/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-500/20"
            />
            <p className="text-[11px] text-primary-400">
              Tạo set mới chứa card này. Set sẽ được lưu vào My Sets.
            </p>
          </div>
        )}

        {feedback && (
          <div
            className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
              feedback.kind === "success"
                ? "bg-emerald-50 text-emerald-700"
                : feedback.kind === "error"
                  ? "bg-red-50 text-red-600"
                  : "bg-amber-50 text-amber-700"
            }`}
          >
            {feedback.kind === "error" ? (
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

<Button
            variant="gradient"
            onClick={handleAdd}
            loading={update.isLoading || create.isLoading}
            className="w-full"
          >
            {mode === "create" ? <FolderPlus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {mode === "create" ? "Tạo set và thêm" : "Thêm vào set"}
          </Button>
        </div>
      )}
    </Modal>
  )
}
