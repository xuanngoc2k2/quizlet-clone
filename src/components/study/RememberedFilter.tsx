"use client"

import type { RememberedFilter } from "@/types"

const options: { value: RememberedFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "0", label: "Never" },
  { value: "1", label: "1 time" },
  { value: "2", label: "2 times" },
  { value: "3", label: "3+ times" },
]

export function RememberedFilter({
  value,
  onChange,
  cardCounts,
}: {
  value: RememberedFilter
  onChange: (_v: RememberedFilter) => void
  cardCounts: Record<RememberedFilter, number>
}) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">Study filter</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value as RememberedFilter)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-[0.97] ${
              value === opt.value
                ? "border-primary-500 bg-primary-500 text-white shadow-sm"
                : "border-primary-200 bg-white text-primary-600 hover:border-primary-300 hover:bg-primary-50"
            }`}
          >
            {opt.label}
            <span className="ml-1 opacity-60">({cardCounts[opt.value]})</span>
          </button>
        ))}
      </div>
    </div>
  )
}
