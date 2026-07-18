"use client"

import { useState } from "react"
import { api } from "@/lib/trpc-provider"
import { Button } from "./Button"
import { SpeakerButton } from "./SpeakerButton"
import { MathText } from "./MathText"
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  PenLine,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react"

type WordPracticeProps = {
  term: string
  definition: string
}

export function WordPractice({ term, definition }: WordPracticeProps) {
  const [expanded, setExpanded] = useState(false)
  const [userSentence, setUserSentence] = useState("")
  const [showExamples, setShowExamples] = useState(false)

  const examplesMutation = api.sentences.examples.useMutation()
  const checkMutation = api.sentences.check.useMutation()
  const explainMutation = api.sentences.explain.useMutation()

  const examples = examplesMutation.data?.examples as { sentence: string; translation: string; grammar_notes: string }[] | undefined
  const result = checkMutation.data
  const explanation = explainMutation.data
  const error = checkMutation.error || explainMutation.error

  const handleShowExamples = () => {
    setShowExamples(true)
    if (!examples) {
      examplesMutation.mutate({ word: term, definition })
    }
  }

  const handleCheckSentence = () => {
    if (!userSentence.trim()) return
    checkMutation.mutate({ sentence: userSentence.trim() })
  }

  const handleExplain = () => {
    if (!userSentence.trim()) return
    explainMutation.mutate({ sentence: userSentence.trim() })
  }

  return (
    <div className="rounded-2xl border border-primary-100 bg-white shadow-sm transition-all">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-primary-50/50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <PenLine className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <span className="font-display text-sm font-semibold text-primary-700">
            Practice: <MathText text={term} />
          </span>
          <p className="text-xs text-primary-500">{definition}</p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-primary-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-primary-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-primary-100 p-4 space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-primary-50 p-3">
            <SpeakerButton text={term} lang="ko-KR" size="md" />
            <div>
              <p className="font-semibold text-primary-900 whitespace-pre-wrap"><MathText text={term} /></p>
              <p className="text-sm text-primary-500">{definition}</p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleShowExamples}
            loading={examplesMutation.isLoading}
            className="w-full"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Show Example Sentences
          </Button>

          {showExamples && examples && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-primary-500">Example Sentences</p>
              {examples.map((ex, i) => (
                <div key={i} className="rounded-xl border border-primary-100 bg-white p-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-xs font-bold text-primary-400">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-900 whitespace-pre-wrap">
                        <MathText text={ex.sentence} />
                      </p>
                      <p className="text-xs text-primary-500 mt-0.5">{ex.translation}</p>
                      {ex.grammar_notes && (
                        <p className="mt-1 text-xs italic text-primary-400">{ex.grammar_notes}</p>
                      )}
                    </div>
                    <SpeakerButton text={ex.sentence} lang="ko-KR" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {showExamples && examplesMutation.isLoading && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-primary-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading examples...
            </div>
          )}

          <div className="border-t border-primary-100 pt-3">
            <p className="mb-2 text-xs font-semibold text-primary-500">
              Write your own sentence using &quot;{term}&quot;
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Type a Korean sentence with "${term}"...`}
                value={userSentence}
                onChange={(e) => setUserSentence(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleCheckSentence()
                  }
                }}
                className="flex-1 rounded-xl border border-primary-200 bg-primary-50/50 px-3 py-2 text-sm outline-none transition-all placeholder:text-primary-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />
              <Button
                variant="gradient"
                size="sm"
                onClick={handleCheckSentence}
                loading={checkMutation.isLoading}
                disabled={!userSentence.trim()}
              >
                Check
              </Button>
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-500">{error.message}</p>
            )}

            {result && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <div className="flex flex-1 flex-col items-center rounded-xl bg-primary-50 p-2">
                    <span className="text-xs text-primary-500">Grammar</span>
                    <span className="text-base font-bold text-primary-700">{result.grammarScore}/10</span>
                  </div>
                  <div className="flex flex-1 flex-col items-center rounded-xl bg-primary-50 p-2">
                    <span className="text-xs text-primary-500">Natural</span>
                    <span className="text-base font-bold text-primary-700">{result.naturalnessScore}/10</span>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                    <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Errors ({result.errors.length})
                    </p>
                    {result.errors.map((err, i) => (
                      <div key={i} className="mt-1 text-xs text-red-700">
                        <span className="font-medium">{err.error}</span>
                        <p className="text-red-500">{err.explanation}</p>
                        <p className="text-emerald-600">Suggestion: {err.correction}</p>
                      </div>
                    ))}
                  </div>
                )}

                {result.errors.length === 0 && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Great sentence! No errors found.
                  </div>
                )}

                {result.improvedSentence && result.errors.length > 0 && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold text-emerald-700">Improved</p>
                    <p className="text-sm font-medium text-emerald-800 whitespace-pre-wrap">{result.improvedSentence}</p>
                  </div>
                )}

                <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-3">
                  <p className="text-xs font-semibold text-primary-500">Translation</p>
                  <p className="text-sm text-primary-800">{result.translation}</p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExplain}
                  loading={explainMutation.isLoading}
                  className="w-full"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Explain Grammar Details
                </Button>

                {explanation && (
                  <div className="space-y-2 rounded-xl border border-primary-100 bg-white p-3 text-xs">
                    <div>
                      <span className="font-semibold text-primary-500">Meaning:</span>
                      <span className="text-primary-700"> {explanation.meaning}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-primary-500">Grammar:</span>
                      <span className="text-primary-700"> {explanation.grammar}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-primary-500">Vocabulary:</span>
                      <span className="text-primary-700"> {explanation.vocabulary}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
