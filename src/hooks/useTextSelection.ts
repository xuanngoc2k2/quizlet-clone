"use client"

import { useEffect, useState } from "react"

export type TextSelection = {
  text: string
  x: number
  y: number
}

export function useTextSelection(
  excludedRef: React.RefObject<HTMLElement | null>,
): TextSelection | null {
  const [selection, setSelection] = useState<TextSelection | null>(null)

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) {
        setSelection(null)
        return
      }
      const text = sel.toString().trim()
      if (!text || text.length > 500) {
        setSelection(null)
        return
      }

      const node = sel.anchorNode
      const el =
        node && node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement | null)
      if (el && excludedRef.current?.contains(el)) {
        setSelection(null)
        return
      }

      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setSelection({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top,
      })
    }

    const handleScroll = () => setSelection(null)

    document.addEventListener("selectionchange", handleSelectionChange)
    document.addEventListener("scroll", handleScroll, true)
    window.addEventListener("resize", handleScroll)
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
      document.removeEventListener("scroll", handleScroll, true)
      window.removeEventListener("resize", handleScroll)
    }
  }, [excludedRef])

  return selection
}
