"use client"

import Link from "next/link"
import { useState } from "react"
import { Search, GraduationCap, BookOpen, Sparkles, PenLine } from "lucide-react"
import { UserMenu } from "./UserMenu"
import { ModuleMenu, learnMenuItems, practiceMenuItems, writingMenuItems } from "./ModuleMenu"

export function Header() {
  const [search, setSearch] = useState("")

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
      <div className="safe-top mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 md:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <GraduationCap className="h-6 w-6 text-primary-600" />
          <span className="tracking-tight text-slate-900">TOPIK</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          <ModuleMenu label="Learn" icon={BookOpen} items={learnMenuItems} />
          <ModuleMenu label="Practice" icon={Sparkles} items={practiceMenuItems} />
          <ModuleMenu label="Writing" icon={PenLine} items={writingMenuItems} />
        </nav>
        <div className="relative ml-auto max-w-sm flex-1">
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
        <div className="flex flex-1 justify-end">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
