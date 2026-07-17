"use client"

import Link from "next/link"
import { useState } from "react"
import { Search, GraduationCap } from "lucide-react"

export function Header() {
  const [search, setSearch] = useState("")

  return (
    <header className="sticky top-0 z-50 border-b border-primary-100 bg-white/80 backdrop-blur-lg">
      <div className="safe-top mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <GraduationCap className="h-6 w-6 text-primary-600" />
          <span className="gradient-text">TOPIK</span>
        </Link>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-300" />
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
            className="w-full rounded-xl border border-primary-100 bg-primary-50/50 py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-primary-300 focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>
    </header>
  )
}
