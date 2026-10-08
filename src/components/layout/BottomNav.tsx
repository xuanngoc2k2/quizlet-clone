"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, Sparkles, MoreHorizontal, PenLine } from "lucide-react"
import { api } from "@/lib/trpc-provider"
import {
  ModuleMenu,
  learnMenuItems,
  moreMenuItems,
  practiceMenuItems,
  writingMenuItems,
} from "./ModuleMenu"

export function BottomNav() {
  const { data: dueCards = [] } = api.cardProgress.getDueWithDetails.useQuery(undefined, {
    // Poll mỗi 5 phút để badge luôn fresh
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  })
  const dueCount = dueCards.length

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2">
        <BottomHomeLink />
        <ModuleMenu label="Learn" icon={BookOpen} items={learnMenuItems} compact />
        <div className="relative">
          <ModuleMenu label="Practice" icon={Sparkles} items={practiceMenuItems} compact />
          {dueCount > 0 && (
            <span className="pointer-events-none absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-0.5 text-[9px] font-bold text-white">
              {dueCount > 99 ? "99+" : dueCount}
            </span>
          )}
        </div>
        <ModuleMenu label="Writing" icon={PenLine} items={writingMenuItems} compact />
        <ModuleMenu label="More" icon={MoreHorizontal} items={moreMenuItems} compact />
      </div>
    </nav>
  )
}

function BottomHomeLink() {
  const pathname = usePathname()
  const isActive = pathname === "/"

  return (
    <Link
      href="/"
      className={`relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[10px] transition-colors sm:text-xs ${
        isActive ? "text-primary-600" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {isActive && (
        <span className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary-500" />
      )}
      <Home className="h-5 w-5" />
      <span className={isActive ? "font-semibold" : "font-medium"}>Home</span>
    </Link>
  )
}
