"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { LogOut, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

export function UserMenu() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  if (status === "loading") {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-primary-100" />
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 active:scale-95"
      >
        Sign In
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-primary-100 transition-all hover:border-primary-300 active:scale-95"
      >
        {session.user.image ? (
          <img src={session.user.image} alt={session.user.name || "User"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-50 text-primary-600">
            {session.user.name?.[0] || <User className="h-4 w-4" />}
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-1 shadow-xl backdrop-blur-xl"
            >
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="truncate text-xs text-gray-500">{session.user.email}</p>
              </div>
              <div className="my-1 h-px bg-gray-100" />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
