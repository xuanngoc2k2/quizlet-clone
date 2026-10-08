"use client"

import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { AnimatePresence, motion } from "framer-motion"
import { DictionaryProvider } from "@/components/dictionary/DictionaryProvider"
import { FloatingDictionary } from "@/components/dictionary/FloatingDictionary"
import { SelectionAction } from "@/components/dictionary/SelectionAction"

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { status } = useSession()
  const isLoginPage = pathname === "/login"

  useEffect(() => {
    if (status === "unauthenticated" && !isLoginPage) {
      router.replace("/login")
    }
  }, [isLoginPage, router, status])

  if (!isLoginPage && status !== "authenticated") {
    return null
  }

  return (
    <DictionaryProvider>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
      {status === "authenticated" && (
        <>
          <FloatingDictionary />
          <SelectionAction />
        </>
      )}
    </DictionaryProvider>
  )
}
