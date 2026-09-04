"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/trpc-provider"
import type { Flashcard } from "@/types"
import { Button } from "@/components/ui/Button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface ClozeCardProps {
  card: Flashcard
  onCorrect: () => void
  onIncorrect: () => void
}

export function ClozeCard({ card, onCorrect, onIncorrect }: ClozeCardProps) {
  const [input, setInput] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  
  const utils = api.useUtils()
  
  const generateMutation = api.sentences.generateAndSaveExamples.useMutation({
    onSuccess: () => {
      // Invalidate the set query to get the updated card with examples
      utils.sets.getById.invalidate({ id: card.setId })
    }
  })

  useEffect(() => {
    // Reset state when card changes
    setInput("")
    setSubmitted(false)
    setIsCorrect(false)

    if (!card.examples && !generateMutation.isPending && !generateMutation.isSuccess) {
      generateMutation.mutate({
        cardId: card.id,
        word: card.term,
        definition: card.definition,
        language: "vi" // or user preference
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, card.examples])

  const examples = card.examples as { sentence: string, translation: string, grammar_notes: string }[] | undefined
  const currentExample = examples?.[0]
  
  const clozeSentence = currentExample?.sentence.replace(
    new RegExp(card.term, "gi"),
    "[_______]"
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    const correct = input.trim().toLowerCase() === card.term.toLowerCase()
    setIsCorrect(correct)
    setSubmitted(true)
  }

  const handleNext = () => {
    if (isCorrect) onCorrect()
    else onIncorrect()
    setInput("")
    setSubmitted(false)
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-primary-100 bg-white p-8 shadow-lg">
      <div className="mb-6 flex flex-col items-center text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-400">
          Điền từ còn thiếu
        </p>
        
        {!currentExample ? (
          <div className="flex flex-col items-center gap-2 text-primary-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Đang tạo câu ví dụ (AI)...</p>
          </div>
        ) : (
          <>
            <p className="text-xl font-medium text-primary-900 leading-relaxed mb-4">
              {clozeSentence}
            </p>
            <p className="text-sm text-primary-500 italic">
              &quot;{currentExample.translation}&quot;
            </p>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={submitted || !currentExample}
          placeholder="Nhập từ..."
          className="w-full rounded-xl border-2 border-primary-100 px-4 py-3 text-center text-lg font-semibold focus:border-primary-500 focus:outline-none disabled:bg-gray-50"
          autoFocus
        />
        
        {!submitted ? (
          <Button type="submit" disabled={!input.trim() || !currentExample} variant="gradient" className="w-full">
            Kiểm tra
          </Button>
        ) : (
          <div className="flex flex-col gap-4">
            <div className={`flex items-center gap-2 rounded-xl p-4 ${isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <div>
                <p className="font-bold">{isCorrect ? "Chính xác!" : "Chưa đúng!"}</p>
                {!isCorrect && <p className="text-sm mt-1">Đáp án đúng: <span className="font-bold">{card.term}</span></p>}
              </div>
            </div>
            
            {currentExample?.grammar_notes && (
              <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800 text-left">
                <span className="font-bold block mb-1">Giải thích (AI):</span>
                {currentExample.grammar_notes}
              </div>
            )}
            
            <Button onClick={handleNext} type="button" variant={isCorrect ? "primary" : "secondary"} className="w-full">
              Tiếp tục
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
