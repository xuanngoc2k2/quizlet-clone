"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, Loader2, RefreshCcw, Plus, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { useDictionary, type DictionaryMessage } from "@/hooks/useDictionary"
import { SpeakerButton } from "@/components/ui/SpeakerButton"
import type { DictionaryResult } from "@/lib/dictionary"
import { AddToSetModal } from "./AddToSetModal"
import { AddFlashcardModal } from "./AddFlashcardModal"

type ActionTarget = { kind: "set" | "flashcard"; term: string; definition: string }

function ResultView({
  result,
  msg,
  onAdd,
}: {
  result: DictionaryResult
  msg: DictionaryMessage
  onAdd: (_kind: "set" | "flashcard") => void
}) {
  const dir = msg.from && msg.to ? `${msg.from} → ${msg.to}` : null

  return (
    <div className="space-y-3">
      {dir && (
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-600">
            {dir}
          </span>
          {msg.from === "ko" && <SpeakerButton text={result.sourceText} lang="ko-KR" size="sm" />}
        </div>
      )}

      <div>
        <p className="text-base font-semibold leading-snug text-primary-900">{result.targetText}</p>
        {result.romanization && (
          <p className="text-xs italic text-primary-400">{result.romanization}</p>
        )}
      </div>

      {result.translation && (
        <p className="rounded-xl bg-primary-50 p-3 text-sm leading-relaxed text-primary-800">
          {result.translation}
        </p>
      )}

      {result.meanings && result.meanings.length > 0 && (
        <div className="space-y-2">
          {result.meanings.map((m, i) => (
            <div key={i} className="rounded-xl border border-primary-100 bg-white p-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-600">
                  {m.partOfSpeech ?? "từ"}
                </span>
                <p className="text-sm font-medium text-primary-900">{m.meaning}</p>
              </div>
              {m.example && (
                <div className="mt-2 flex items-start gap-2">
                  <SpeakerButton text={m.example} lang="ko-KR" size="sm" />
                  <div className="flex-1">
                    <p className="text-sm text-primary-800">{m.example}</p>
                    {m.exampleTranslation && (
                      <p className="mt-0.5 text-xs text-primary-500">{m.exampleTranslation}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {result.grammarPoints && result.grammarPoints.length > 0 && (
        <div className="space-y-2">
          {result.grammarPoints.map((g, i) => (
            <div key={i} className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
              <p className="font-mono text-sm font-semibold text-amber-800">{g.pattern}</p>
              <p className="mt-0.5 text-sm text-primary-900">{g.meaning}</p>
              {g.usage && <p className="mt-1 text-xs leading-relaxed text-primary-600">{g.usage}</p>}
              {g.examples &&
                g.examples.map((ex, j) => (
                  <div key={j} className="mt-2 flex items-start gap-2">
                    <SpeakerButton text={ex.sentence} lang="ko-KR" size="sm" />
                    <div className="flex-1">
                      <p className="text-sm text-primary-800">{ex.sentence}</p>
                      <p className="mt-0.5 text-xs text-primary-500">{ex.translation}</p>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {result.exampleSentences && result.exampleSentences.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary-500">
            Ví dụ
          </p>
          {result.exampleSentences.map((ex, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-xl border border-primary-100 bg-white p-3"
            >
              <SpeakerButton text={ex.sentence} lang="ko-KR" size="sm" />
              <div className="flex-1">
                <p className="text-sm text-primary-900">{ex.sentence}</p>
                <p className="mt-0.5 text-xs text-primary-500">{ex.translation}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {((result.synonyms && result.synonyms.length > 0) ||
        (result.antonyms && result.antonyms.length > 0)) && (
        <div className="flex flex-wrap gap-1.5">
          {result.synonyms?.map((s, i) => (
            <span key={`s${i}`} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
              {s}
            </span>
          ))}
          {result.antonyms?.map((a, i) => (
            <span key={`a${i}`} className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
              {a}
            </span>
          ))}
        </div>
      )}

      {result.notes && (
        <p className="rounded-xl bg-primary-50 p-3 text-xs italic leading-relaxed text-primary-600">
          {result.notes}
        </p>
      )}

      <div className="flex gap-2 border-t border-primary-100 pt-2">
        <button
          type="button"
          onClick={() => onAdd("set")}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary-100 px-2 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-200"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm vào Set
        </button>
        <button
          type="button"
          onClick={() => onAdd("flashcard")}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-100 px-2 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-200"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Thêm Flashcard
        </button>
      </div>
    </div>
  )
}

function UserMessage({ msg }: { msg: DictionaryMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-br-sm bg-primary-600 px-3 py-2 text-sm text-white">
          {msg.text}
        </div>
        {msg.from && msg.to && (
          <p className="mt-0.5 text-right text-[10px] font-medium text-primary-400">
            {msg.from.toUpperCase()} → {msg.to.toUpperCase()}
          </p>
        )}
      </div>
    </div>
  )
}

function LoadingMessage() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-primary-100 bg-white px-3 py-2.5 text-sm text-primary-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang tra cứu…
      </div>
    </div>
  )
}

function ErrorMessage({ msg }: { msg: DictionaryMessage }) {
  const { submit } = useDictionary()
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="flex items-start gap-2 rounded-2xl rounded-bl-sm border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>{msg.error ?? "Tra cứu thất bại."}</p>
            {msg.text && (
              <button
                type="button"
                onClick={() => submit(msg.text ?? "", { from: msg.from, to: msg.to })}
                className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
              >
                <RefreshCcw className="h-3 w-3" />
                Thử lại
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MessageList() {
  const { messages } = useDictionary()
  const [action, setAction] = useState<ActionTarget | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  return (
    <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm font-medium text-primary-500">
            Tra từ, cụm từ, câu hay ngữ pháp
          </p>
          <p className="max-w-[220px] text-xs text-primary-400">
            Nhập từ khóa hoặc bôi đen văn bản bất kỳ để tra cứu Hàn–Việt.
          </p>
        </div>
      )}
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {msg.role === "user" ? (
            <UserMessage msg={msg} />
          ) : msg.status === "loading" ? (
            <LoadingMessage />
          ) : msg.status === "error" ? (
            <ErrorMessage msg={msg} />
          ) : msg.result ? (
            <div className="flex justify-start">
              <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-primary-100 bg-primary-50/40 p-3">
                <ResultView
                  result={msg.result}
                  msg={msg}
                  onAdd={(kind) =>
                    setAction({
                      kind,
                      term: msg.result?.sourceText ?? msg.text ?? "",
                      definition: msg.result?.targetText ?? "",
                    })
                  }
                />
              </div>
            </div>
          ) : null}
        </motion.div>
      ))}

      {action?.kind === "set" && (
        <AddToSetModal
          open
          onClose={() => setAction(null)}
          term={action.term}
          definition={action.definition}
        />
      )}
      {action?.kind === "flashcard" && (
        <AddFlashcardModal
          open
          onClose={() => setAction(null)}
          term={action.term}
          definition={action.definition}
        />
      )}
    </div>
  )
}
