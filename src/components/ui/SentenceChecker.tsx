"use client"

import { useState } from "react"
import { api } from "@/lib/trpc-provider"
import { Button } from "./Button"
import { Sparkles, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, MessageSquare, Languages } from "lucide-react"

type Lang = "en" | "vi"

type SentenceCheckerProps = {
  defaultSentence?: string
}

export function SentenceChecker({ defaultSentence = "" }: SentenceCheckerProps) {
  const [sentence, setSentence] = useState(defaultSentence)
  const [showChecker, setShowChecker] = useState(false)
  const [lang, setLang] = useState<Lang>("en")
  const checkMutation = api.sentences.check.useMutation()
  const explainMutation = api.sentences.explain.useMutation()

  const handleCheck = () => {
    if (!sentence.trim()) return
    checkMutation.mutate({ sentence: sentence.trim(), language: lang })
  }

  const handleExplain = () => {
    if (!sentence.trim()) return
    explainMutation.mutate({ sentence: sentence.trim(), language: lang })
  }

  const result = checkMutation.data
  const explanation = explainMutation.data
  const error = checkMutation.error || explainMutation.error

  return (
    <div className="rounded-2xl border border-primary-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setShowChecker(!showChecker)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-primary-50/50"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="font-display text-sm font-semibold text-primary-700">
            AI Sentence Checker
          </span>
        </div>
        {showChecker ? (
          <ChevronUp className="h-4 w-4 text-primary-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-primary-400" />
        )}
      </button>

      {showChecker && (
        <div className="border-t border-primary-100 p-4">
          <div className="mb-3 flex items-center justify-end gap-1">
            <Languages className="h-3.5 w-3.5 text-primary-400" />
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "vi" : "en")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                lang === "en"
                  ? "bg-primary-600 text-white"
                  : "bg-primary-100 text-primary-600 hover:bg-primary-200"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang(lang === "vi" ? "en" : "vi")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                lang === "vi"
                  ? "bg-primary-600 text-white"
                  : "bg-primary-100 text-primary-600 hover:bg-primary-200"
              }`}
            >
              VI
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a Korean sentence..."
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleCheck()
                }
              }}
              className="flex-1 rounded-xl border border-primary-200 bg-primary-50/50 px-3 py-2 text-sm outline-none transition-all placeholder:text-primary-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
            <Button
              variant="gradient"
              size="sm"
              onClick={handleCheck}
              loading={checkMutation.isLoading}
              disabled={!sentence.trim()}
            >
              Check
            </Button>
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-500">
              {error.message}
            </p>
          )}

          {result && (
            <div className="mt-4 space-y-3">
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col items-center rounded-xl bg-primary-50 p-2.5">
                  <span className="text-xs font-medium text-primary-500">Grammar</span>
                  <span className="text-lg font-bold text-primary-700">{result.grammarScore}/10</span>
                </div>
                <div className="flex flex-1 flex-col items-center rounded-xl bg-primary-50 p-2.5">
                  <span className="text-xs font-medium text-primary-500">Natural</span>
                  <span className="text-lg font-bold text-primary-700">{result.naturalnessScore}/10</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                  <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Errors ({result.errors.length})
                  </p>
                  <div className="space-y-1.5">
                    {result.errors.map((err, i) => (
                      <div key={i} className="text-xs text-red-700">
                        <span className="font-medium">{err.error}</span>
                        <p className="text-red-500">{err.explanation}</p>
                        <p className="text-emerald-600">
                          Suggestion: {err.correction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors.length === 0 && (
                <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  No grammar errors found
                </div>
              )}

              {result.improvedSentence && result.errors.length > 0 && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="mb-0.5 text-xs font-semibold text-emerald-700">Improved</p>
                  <p className="text-sm font-medium text-emerald-800">{result.improvedSentence}</p>
                </div>
              )}

              <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-3">
                <p className="mb-0.5 text-xs font-semibold text-primary-500">Translation</p>
                <p className="text-sm text-primary-800">{result.translation}</p>
              </div>

              {result.vocabularyNotes && (
                <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                  {result.vocabularyNotes}
                </div>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={handleExplain}
                loading={explainMutation.isLoading}
                className="w-full"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Explain Grammar Details
              </Button>

              {explanation && (
                <div className="space-y-2 rounded-xl border border-primary-100 bg-white p-3">
                  <div>
                    <p className="text-xs font-semibold text-primary-500">Meaning</p>
                    <p className="text-sm text-primary-800">{explanation.meaning}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary-500">Grammar Breakdown</p>
                    <p className="text-sm text-primary-700">{explanation.grammar}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary-500">Key Vocabulary</p>
                    <p className="text-sm text-primary-700">{explanation.vocabulary}</p>
                  </div>
                  {explanation.usageNotes && (
                    <div>
                      <p className="text-xs font-semibold text-primary-500">Usage Notes</p>
                      <p className="text-sm text-primary-600">{explanation.usageNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
