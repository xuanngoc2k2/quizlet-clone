"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plus, BookOpen, Sparkles, Brain } from "lucide-react"
import { api } from "@/lib/trpc-provider"

const staticNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/set/new", label: "Create", icon: Plus },
  { href: "/review", label: "Review", icon: Brain },
  { href: "/test", label: "Test AI", icon: Sparkles },
  { href: "/my-sets", label: "My Sets", icon: BookOpen },
]

export function BottomNav() {
  const pathname = usePathname()
  const { data: dueCards = [] } = api.cardProgress.getDueWithDetails.useQuery(undefined, {
    // Poll mỗi 5 phút để badge luôn fresh
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  })
  const dueCount = dueCards.length

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary-100 bg-white/80 backdrop-blur-lg safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {staticNavItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const showBadge = item.href === "/review" && dueCount > 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-5 py-2 text-xs transition-colors touch-target ${
                isActive ? "text-primary-600" : "text-primary-400"
              }`}
            >
              {isActive && (
                <span className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary-500 to-primary-400" />
              )}
              <div className="relative">
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary-600" : ""}`} />
                {showBadge && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-violet-600 px-0.5 text-[9px] font-bold text-white">
                    {dueCount > 99 ? "99+" : dueCount}
                  </span>
                )}
              </div>
              <span className={`font-medium ${isActive ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
