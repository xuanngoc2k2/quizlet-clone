"use client"

import Link from "next/link"

type SetCardProps = {
  id: string
  title: string
  description: string | null
  cardCount: number
}

export function SetCard({ id, title, description, cardCount }: SetCardProps) {
  return (
    <Link
      href={`/set/${id}`}
      className="block rounded-xl border bg-white p-4 shadow-sm transition-all active:scale-[0.98]"
    >
      <h3 className="line-clamp-1 text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{description}</p>
      )}
      <p className="mt-3 text-xs text-gray-400">
        {cardCount} {cardCount === 1 ? "card" : "cards"}
      </p>
    </Link>
  )
}
