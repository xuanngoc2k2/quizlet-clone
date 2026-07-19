"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Plus, X } from "lucide-react"

type CardRow = { term: string; definition: string; type: "vocabulary" | "grammar" }

type SetFormProps = {
  initialTitle?: string
  initialDescription?: string
  initialCards?: CardRow[]
  onSubmit: (_data: { title: string; description: string; cards: CardRow[] }) => Promise<void>
  submitLabel: string
  loading?: boolean
}

export function SetForm({
  initialTitle = "",
  initialDescription = "",
  initialCards = [{ term: "", definition: "", type: "vocabulary" }],
  onSubmit,
  submitLabel,
  loading,
}: SetFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [cards, setCards] = useState<CardRow[]>(initialCards)

  function addCard() {
    setCards([...cards, { term: "", definition: "", type: "vocabulary" }])
  }

  function removeCard(index: number) {
    setCards(cards.filter((_, i) => i !== index))
  }

  function updateCard(index: number, field: keyof CardRow, value: string) {
    setCards(cards.map((card, i) => (i === index ? { ...card, [field]: value } : card)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validCards = cards.filter((c) => c.term.trim() && c.definition.trim())
    if (!title.trim() || validCards.length === 0) return
    await onSubmit({ title: title.trim(), description: description.trim(), cards: validCards })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          placeholder="e.g. TOPIK II Vocabulary"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-primary-700">Description (optional)</label>
          <textarea
            placeholder="Describe your set..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-primary-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 resize-none"
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-primary-700">
            Cards ({cards.length})
          </h2>
          <span className="text-xs text-primary-400">Swipe left on card to delete</span>
        </div>

        <div className="flex flex-col gap-3">
          {cards.map((card, i) => (
            <div
              key={i}
              className="group flex items-start gap-2 rounded-2xl border border-primary-100 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <span className="mt-2.5 min-w-[22px] text-center text-xs font-bold text-primary-400">
                {i + 1}
              </span>
              <div className="flex flex-1 flex-col gap-2">
                <input
                  placeholder="Term (enter to confirm)"
                  value={card.term}
                  onChange={(e) => updateCard(i, "term", e.target.value)}
                  className="rounded-xl border border-primary-100 bg-primary-50/50 px-3 py-2 text-sm outline-none transition-all duration-200 placeholder:text-primary-300 focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-500/20"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateCard(i, "type", "vocabulary")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      card.type === "vocabulary"
                        ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500/30"
                        : "bg-primary-50 text-primary-400 hover:bg-indigo-50 hover:text-indigo-500"
                    }`}
                  >
                    Từ vựng
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCard(i, "type", "grammar")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      card.type === "grammar"
                        ? "bg-amber-100 text-amber-700 ring-2 ring-amber-500/30"
                        : "bg-primary-50 text-primary-400 hover:bg-amber-50 hover:text-amber-500"
                    }`}
                  >
                    Ngữ pháp
                  </button>
                </div>
                <textarea
                  placeholder="Definition"
                  value={card.definition}
                  onChange={(e) => updateCard(i, "definition", e.target.value)}
                  rows={2}
                  className="rounded-xl border border-primary-100 bg-primary-50/50 px-3 py-2 text-sm outline-none transition-all duration-200 placeholder:text-primary-300 focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-500/20 resize-none"
                />
              </div>
              {cards.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCard(i)}
                  className="mt-2 touch-target rounded-lg p-1.5 text-primary-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/50 p-4">
        <Button type="button" variant="secondary" onClick={addCard} className="w-full">
          <Plus className="h-4 w-4" />
          Add Card
        </Button>
        <Button
          type="submit"
          variant="gradient"
          loading={loading}
          disabled={!title.trim() || cards.every((c) => !c.term.trim())}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
