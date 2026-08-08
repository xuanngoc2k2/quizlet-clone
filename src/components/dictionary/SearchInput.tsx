"use client"

import { useRef, useState } from "react"
import { History, Search, Trash2, X } from "lucide-react"
import { useDictionary } from "@/hooks/useDictionary"

export function SearchInput() {
  const { from, submit, history, removeHistoryItem, clearHistory } = useDictionary()
  const [value, setValue] = useState("")
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    const query = value.trim()
    if (!query) return
    submit(query)
    setValue("")
    inputRef.current?.blur()
  }

  return (
    <div className="border-t border-primary-100 bg-white p-3">
      <div className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50/50 px-3 py-2.5 transition-all focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20">
        <Search className="h-4 w-4 shrink-0 text-primary-400" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder={from === "ko" ? "Tra từ tiếng Hàn…" : "Tra từ tiếng Việt…"}
          className="w-full bg-transparent text-sm text-primary-900 outline-none placeholder:text-primary-300"
          aria-label="Tra từ"
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="shrink-0 rounded-md p-1 text-primary-400 transition-colors hover:text-primary-600"
            aria-label="Xóa nội dung"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {focused && !value && history.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between px-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary-400">
              <History className="h-3 w-3" />
              Lịch sử
            </span>
            <button
              type="button"
              onClick={clearHistory}
              className="text-[10px] font-medium text-primary-400 transition-colors hover:text-red-500"
            >
              Xóa hết
            </button>
          </div>
          {history.slice(0, 5).map((item) => (
            <div
              key={item}
              className="group flex items-center rounded-lg px-1 text-sm text-primary-700 transition-colors hover:bg-primary-50"
            >
              <button
                type="button"
                onClick={() => {
                  submit(item)
                  setValue("")
                }}
                className="flex-1 truncate py-1 text-left"
                title={item}
              >
                {item}
              </button>
              <button
                type="button"
                onClick={() => removeHistoryItem(item)}
                className="rounded p-1 text-primary-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                aria-label={`Xóa ${item} khỏi lịch sử`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
