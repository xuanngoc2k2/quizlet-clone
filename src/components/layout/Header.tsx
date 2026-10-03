"use client"

import Link from "next/link"
import { useState } from "react"
import { Search, GraduationCap } from "lucide-react"
import { UserMenu } from "./UserMenu"

export function Header() {
  const [search, setSearch] = useState("")

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
      <div className="safe-top mx-auto flex max-w-5xl items-center gap-3 px-4 sm:px-6 md:px-8 py-3">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <GraduationCap className="h-6 w-6 text-primary-600" />
          <span className="text-slate-900 tracking-tight">TOPIK</span>
        </Link>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="flex-1 flex justify-end">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

