"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Search } from "lucide-react"
import { useDictionary } from "@/hooks/useDictionary"
import { useTextSelection } from "@/hooks/useTextSelection"
import { detectDirection } from "@/lib/dictionary"

const BUTTON_WIDTH = 96

export function SelectionAction() {
  const { panelRef, submit, setOpen } = useDictionary()
  const selection = useTextSelection(panelRef)

  if (!selection) return null

  const left = Math.min(
    Math.max(selection.x - BUTTON_WIDTH / 2, 8),
    window.innerWidth - BUTTON_WIDTH - 8,
  )
  const top = Math.max(selection.y - 46, 8)

  return (
    <AnimatePresence>
      <motion.button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const dir = detectDirection(selection.text)
          setOpen(true)
          submit(selection.text, dir)
          window.getSelection()?.removeAllRanges()
        }}
        initial={{ opacity: 0, y: 6, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.9 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[70] flex items-center gap-1.5 rounded-full bg-primary-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-primary-600/30 transition-colors hover:bg-primary-700"
        style={{ left, top }}
        aria-label="Tra cứu từ đã chọn"
      >
        <Search className="h-3.5 w-3.5" />
        Tra cứu
      </motion.button>
    </AnimatePresence>
  )
}
