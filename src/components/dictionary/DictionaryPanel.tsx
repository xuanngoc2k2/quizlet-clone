"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeftRight, BookOpenText, GripHorizontal, Maximize2, RotateCcw, X } from "lucide-react"
import { useDictionary } from "@/hooks/useDictionary"
import {
  getPanelPosition,
  savePanelPosition,
  type PanelPosition,
} from "@/lib/dictionary-storage"
import { SearchInput } from "./SearchInput"
import { MessageList } from "./MessageList"

const PANEL_WIDTH = 400
const PANEL_MARGIN = 16
const HEADER_HEIGHT = 64

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return isDesktop
}

function DirectionControl() {
  const { from, to, setFrom, swapDirection } = useDictionary()

  const pill = (active: boolean) =>
    `flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
      active ? "bg-primary-600 text-white shadow-sm" : "bg-primary-100 text-primary-500 hover:bg-primary-200"
    }`

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setFrom("vi")}
        className={`${pill(from === "vi")} min-w-[44px]`}
        aria-pressed={from === "vi"}
      >
        VI → KO
      </button>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setFrom("ko")}
        className={`${pill(from === "ko")} min-w-[44px]`}
        aria-pressed={from === "ko"}
      >
        KO → VI
      </button>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={swapDirection}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-500 transition-colors hover:bg-primary-200"
        aria-label="Đảo chiều từ điển"
      >
        <ArrowLeftRight className="h-3.5 w-3.5" />
      </button>
      <span className="hidden text-[10px] font-medium text-primary-400 xs:inline">
        {from.toUpperCase()} ⇄ {to.toUpperCase()}
      </span>
    </div>
  )
}

export function DictionaryPanel() {
  const { open, minimized, setMinimized, setOpen, messages, panelRef, clearConversation } =
    useDictionary()
  const isDesktop = useIsDesktop()
  const [pos, setPos] = useState<PanelPosition | null>(() => getPanelPosition())
  const [livePos, setLivePos] = useState<PanelPosition | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const livePosRef = useRef<PanelPosition | null>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    if (open && !minimized) window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [open, minimized, setOpen])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDesktop) return
    const target = e.target as HTMLElement
    if (target.closest("button, input, textarea, select, a")) return
    const header = e.currentTarget as HTMLElement
    const rect = header.getBoundingClientRect()
    header.setPointerCapture(e.pointerId)
    dragStartRef.current = { x: e.clientX, y: e.clientY, moved: false }
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: rect.left, baseY: rect.top }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !dragStartRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) + Math.abs(dy) > 4) dragStartRef.current.moved = true
    const nx = dragRef.current.baseX + dx
    const ny = dragRef.current.baseY + dy
    const next = {
      x: Math.min(Math.max(nx, PANEL_MARGIN), window.innerWidth - PANEL_WIDTH - PANEL_MARGIN),
      y: Math.min(Math.max(ny, PANEL_MARGIN), window.innerHeight - HEADER_HEIGHT - PANEL_MARGIN),
    }
    livePosRef.current = next
    setLivePos(next)
  }

  const handlePointerUp = () => {
    if (dragRef.current) {
      const final = livePosRef.current
      if (dragStartRef.current?.moved && final) {
        setPos(final)
        savePanelPosition(final)
      }
      dragRef.current = null
      dragStartRef.current = null
      livePosRef.current = null
      setLivePos(null)
    }
  }

  const hasPos = isDesktop && (livePos || pos)

  const positionClasses = isDesktop
    ? hasPos
      ? "w-[400px]"
      : "right-6 bottom-24 w-[400px]"
    : "inset-x-2 bottom-2"

  const sizeClasses = isDesktop
    ? "h-[600px] max-h-[calc(100dvh-7rem)]"
    : "h-[70dvh]"

  const panelStyle: React.CSSProperties | undefined = hasPos
    ? { left: (livePos ?? pos)?.x, top: (livePos ?? pos)?.y }
    : undefined

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          key="dictionary-panel"
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={panelStyle}
          className={`fixed z-[70] flex flex-col overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-2xl ${positionClasses} ${sizeClasses}`}
        >
          {minimized ? (
            <div className="flex items-center gap-2 p-3">
              <BookOpenText className="h-4 w-4 shrink-0 text-primary-500" />
              <span className="flex-1 truncate text-sm font-medium text-primary-700">
                Từ điển · {messages.length} tin nhắn
              </span>
              <button
                type="button"
                onClick={() => setMinimized(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-500 transition-colors hover:bg-primary-50"
                aria-label="Phóng to"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div
                className="flex items-center gap-2 border-b border-primary-100 bg-white px-3 py-2"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <GripHorizontal
                  className={`h-4 w-4 shrink-0 ${isDesktop ? "cursor-grab text-primary-300 active:cursor-grabbing" : "text-primary-300"}`}
                />
                <span className="font-display text-sm font-semibold text-primary-800">Từ điển</span>
                <div className="ml-auto">
                  <DirectionControl />
                </div>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setMinimized(true)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary-500 transition-colors hover:bg-primary-50"
                  aria-label="Thu gọn"
                >
                  <GripHorizontal className="h-4 w-4 rotate-90" />
                </button>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={clearConversation}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary-500 transition-colors hover:bg-primary-50"
                  aria-label="Xóa hội thoại"
                  disabled={messages.length === 0}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary-500 transition-colors hover:bg-primary-50"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <MessageList />
              <SearchInput />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
