"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"

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
      className="group card-hover relative overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 to-primary-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 font-display text-base font-semibold text-primary-900">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-primary-500">
              {description}
            </p>
          )}
          <p className="mt-2 text-xs font-medium text-primary-400">
            {cardCount} {cardCount === 1 ? "card" : "cards"}
          </p>
        </div>
      </div>
    </Link>
  )
}
