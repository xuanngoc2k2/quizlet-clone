"use client"

import { motion } from "framer-motion"
import { BookOpenText, X } from "lucide-react"
import { useDictionary } from "@/hooks/useDictionary"

export function FloatingButton() {
  const { open, setOpen, unread } = useDictionary()

  return (
    <motion.button
      type="button"
      onClick={() => setOpen(!open)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30 transition-colors hover:bg-primary-700 active:scale-95 sm:right-6"
      aria-label={open ? "Đóng từ điển" : "Mở từ điển"}
      aria-expanded={open}
    >
      {open ? <X className="h-6 w-6" /> : <BookOpenText className="h-6 w-6" />}
      {!open && unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unread}
        </span>
      )}
    </motion.button>
  )
}
