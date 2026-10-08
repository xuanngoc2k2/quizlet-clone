"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, type LucideIcon } from "lucide-react"

export type ModuleMenuItem = {
  href: string
  label: string
  description?: string
}

type ModuleMenuProps = {
  label: string
  icon: LucideIcon
  items: ModuleMenuItem[]
  compact?: boolean
}

export function ModuleMenu({ label, icon: Icon, items, compact = false }: ModuleMenuProps) {
  const pathname = usePathname()
  const isActive = items.some((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("?")[0]),
  )

  return (
    <details className="group relative">
      <summary
        className={`flex cursor-pointer list-none items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors [&::-webkit-details-marker]:hidden ${
          isActive
            ? "bg-primary-50 text-primary-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        } ${compact ? "min-h-[44px] flex-col gap-0.5 px-2 text-[10px] sm:text-xs" : ""}`}
      >
        <Icon className={compact ? "h-5 w-5" : "h-4 w-4"} />
        <span>{label}</span>
        {!compact && (
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        )}
      </summary>
      <div
        className={`absolute z-50 mt-2 min-w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-lg ${
          compact ? "bottom-full left-1/2 mb-2 -translate-x-1/2" : "left-0"
        }`}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50"
          >
            <span className="block text-sm font-semibold text-slate-800">{item.label}</span>
            {item.description && (
              <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
            )}
          </Link>
        ))}
      </div>
    </details>
  )
}

export const learnMenuItems: ModuleMenuItem[] = [
  { href: "/my-sets", label: "My Sets", description: "Your saved learning sets" },
  { href: "/browse", label: "Browse Sets", description: "Find a set to study" },
  { href: "/review", label: "Review Today", description: "Practice cards that are due" },
  { href: "/set/new", label: "Create Set", description: "Build a new flashcard set" },
]

export const practiceMenuItems: ModuleMenuItem[] = [
  { href: "/test", label: "Test Generator", description: "Create a TOPIK-style test" },
  { href: "/test?mode=set", label: "Test from Set", description: "Practice a set as a test" },
  { href: "/test/history", label: "Test History", description: "Review results and retake" },
]

export const writingMenuItems: ModuleMenuItem[] = [
  { href: "/writing", label: "Writing Home", description: "Choose a TOPIK writing type" },
  { href: "/writing/51", label: "Question 51", description: "Complete the missing phrase" },
  { href: "/writing/53", label: "Question 53", description: "Write from a chart" },
  { href: "/writing/54", label: "Question 54", description: "Write an extended essay" },
]

export const moreMenuItems: ModuleMenuItem[] = [
  { href: "/dashboard", label: "Dashboard", description: "Progress and daily learning" },
  { href: "/search", label: "Search", description: "Find sets and content" },
]
