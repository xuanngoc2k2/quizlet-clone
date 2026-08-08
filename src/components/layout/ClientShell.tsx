"use client"

import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { DictionaryProvider } from "@/components/dictionary/DictionaryProvider"
import { FloatingDictionary } from "@/components/dictionary/FloatingDictionary"
import { SelectionAction } from "@/components/dictionary/SelectionAction"

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
      <FloatingDictionary />
      <SelectionAction />
    </DictionaryProvider>
  )
}
