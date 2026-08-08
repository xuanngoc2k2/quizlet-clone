"use client"

import { useCallback, useRef, useState } from "react"
import { api } from "@/lib/trpc-provider"
import {
  DictionaryContext,
  type DictionaryContextValue,
  type DictionaryMessage,
} from "@/hooks/useDictionary"
import { useDictionaryHistory } from "@/hooks/useDictionaryHistory"
import type { Lang } from "@/lib/dictionary"

let messageId = 0
const nextId = () => `m${++messageId}`

export function DictionaryProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<DictionaryMessage[]>([])
  const [from, setFrom] = useState<Lang>("ko")
  const [to, setTo] = useState<Lang>("vi")
  const [unread, setUnread] = useState(0)
  const { history, addHistory, removeHistory, clearHistory } = useDictionaryHistory()
  const panelRef = useRef<HTMLDivElement>(null)

  const lookup = api.dictionary.lookup.useMutation()

  const submit = useCallback(
    (text: string, opts?: { from?: Lang; to?: Lang }) => {
      const query = text.trim()
      if (!query) return
      const f = opts?.from ?? from
      const t = opts?.to ?? to

      const userMsg: DictionaryMessage = { id: nextId(), role: "user", text: query, from: f, to: t }
      const loadingId = nextId()
      const loadingMsg: DictionaryMessage = {
        id: loadingId,
        role: "assistant",
        status: "loading",
        text: query,
        from: f,
        to: t,
      }

      setMessages((prev) => [...prev, userMsg, loadingMsg])
      setMinimized(false)
      setUnread(0)
      addHistory(query)
      setOpen(true)

      lookup
        .mutateAsync({ text: query, from: f, to: t })
        .then((res) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === loadingId
                ? { id: loadingId, role: "assistant", result: res.result, from: f, to: t }
                : m,
            ),
          )
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : "Tra cứu thất bại. Hãy thử lại."
          setMessages((prev) =>
            prev.map((m) =>
              m.id === loadingId
                ? { id: loadingId, role: "assistant", status: "error", error: message }
                : m,
            ),
          )
        })
    },
    [from, to, lookup, addHistory],
  )

  const swapDirection = useCallback(() => {
    setFrom(to)
    setTo(from)
  }, [from, to])

  const clearConversation = useCallback(() => {
    setMessages([])
    setUnread(0)
  }, [])

  const handleSetOpen = useCallback((next: boolean) => {
    setOpen(next)
    if (next) {
      setMinimized(false)
      setUnread(0)
    }
  }, [])

  const value: DictionaryContextValue = {
    open,
    setOpen: handleSetOpen,
    minimized,
    setMinimized,
    messages,
    from,
    to,
    setFrom,
    setTo,
    swapDirection,
    submit,
    clearConversation,
    history,
    removeHistoryItem: removeHistory,
    clearHistory,
    unread,
    panelRef,
  }

  return <DictionaryContext.Provider value={value}>{children}</DictionaryContext.Provider>
}
