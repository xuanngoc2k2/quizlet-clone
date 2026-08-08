"use client"

import { useState } from "react"
import { api } from "@/lib/trpc-provider"
import { BookOpen, Check, Search } from "lucide-react"

type SetPickerProps = {
  selectedId: string | null
  onSelect: (_id: string) => void
}

export function SetPicker({ selectedId, onSelect }: SetPickerProps) {
  const [search, setSearch] = useState("")
  const { data: sets, isLoading } = api.sets.list.useQuery({ search: search || undefined })

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50/50 px-3 py-2 transition-all focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20">
        <Search className="h-4 w-4 shrink-0 text-primary-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm set…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-primary-300"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-1.5 py-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-primary-100" />
          ))}
        </div>
      ) : sets && sets.length > 0 ? (
        <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
          {sets.map((set) => {
            const selected = set.id === selectedId
            return (
              <button
                key={set.id}
                type="button"
                onClick={() => onSelect(set.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors ${
                  selected
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-primary-50 text-primary-700 hover:bg-primary-100"
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-sm font-medium">{set.title}</span>
                <span
                  className={`shrink-0 text-[10px] font-semibold ${
                    selected ? "text-primary-200" : "text-primary-400"
                  }`}
                >
                  {set._count.cards} cards
                </span>
                {selected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            )
          })}
        </div>
      ) : (
        <p className="rounded-xl bg-primary-50 px-3 py-3 text-center text-xs text-primary-400">
          Không tìm thấy set nào. Tạo set mới bên dưới.
        </p>
      )}
    </div>
  )
}
