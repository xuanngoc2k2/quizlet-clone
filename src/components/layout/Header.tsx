"use client"

import Link from "next/link"
import { useState } from "react"

export function Header() {
  const [search, setSearch] = useState("")

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg">
      <div className="safe-top mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-blue-600">
          Quizlet
        </Link>
        <div className="relative flex-1">
          <input
            type="search"
            placeholder="Search sets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(search.trim())}`
              }
            }}
            className="w-full rounded-xl border bg-gray-100 px-4 py-2 text-sm outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </header>
  )
}
