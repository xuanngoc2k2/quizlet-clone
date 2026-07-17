"use client"

import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/Button"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { updateSetProgress } from "@/lib/local-storage"
import { shuffleArray } from "@/lib/utils"

type MatchCard = {
  id: string
  text: string
  type: "term" | "definition"
  pairId: string
}

function prepareCards(cards: { id: string; term: string; definition: string }[]) {
  const items: MatchCard[] = []
  const selected = shuffleArray(cards).slice(0, 6)
  selected.forEach((card) => {
    items.push({ id: `${card.id}-term`, text: card.term, type: "term", pairId: card.id })
    items.push({ id: `${card.id}-def`, text: card.definition, type: "definition", pairId: card.id })
  })
  return shuffleArray(items)
}

export default function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: set } = api.sets.getById.useQuery({ id })
  const cardItems = useMemo(() => set?.cards ?? [], [set?.cards])
  const [gameCards, setGameCards] = useState<MatchCard[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set())
  const startTimeRef = useRef<number | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (cardItems.length > 0) {
      setGameCards(prepareCards(cardItems))
      startTimeRef.current = Date.now()
    }
  }, [cardItems])

  useEffect(() => {
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const isComplete = matchedIds.size === gameCards.length && gameCards.length > 0

  useEffect(() => {
    if (isComplete) {
      updateSetProgress(id, "match", {
        correct: matchedIds.size / 2,
        completedCards: [],
        timeSpent: elapsed,
        step: matchedIds.size / 2,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete])

  const handleSelect = useCallback((matchCard: MatchCard) => {
    if (matchedIds.has(matchCard.id)) return

    if (!selectedId) {
      setSelectedId(matchCard.id)
      return
    }

    const first = gameCards.find((c) => c.id === selectedId)
    if (!first) {
      setSelectedId(null)
      return
    }

    if (first.pairId === matchCard.pairId && first.type !== matchCard.type) {
      setMatchedIds((prev) => new Set([...Array.from(prev), first.id, matchCard.id]))
    }
    setSelectedId(null)
  }, [selectedId, gameCards, matchedIds])

  function handleRetry() {
    setGameCards(prepareCards(cardItems))
    setSelectedId(null)
    setMatchedIds(new Set())
    startTimeRef.current = Date.now()
    setElapsed(0)
  }

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
          <span>Match terms & definitions</span>
          <span>{elapsed}s</span>
        </div>

        {isComplete ? (
          <div className="flex flex-col items-center justify-center py-16">
            <h2 className="mb-2 text-2xl font-bold">Match Complete!</h2>
            <p className="mb-1 text-gray-600">Time: {Math.floor(elapsed / 60)}m {elapsed % 60}s</p>
            <p className="mb-8 text-sm text-gray-400">{matchedIds.size / 2} pairs matched</p>
            <div className="flex gap-3">
              <Button onClick={handleRetry} variant="secondary">Play Again</Button>
              <Button onClick={() => router.push(`/set/${id}`)}>Back to Set</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {gameCards.map((card) => {
              const isSelected = selectedId === card.id
              const isMatched = matchedIds.has(card.id)
              let style = "border-gray-200 bg-white"
              if (isSelected) style = "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
              if (isMatched) style = "border-green-300 bg-green-50 opacity-50"

              return (
                <button
                  key={card.id}
                  onClick={() => handleSelect(card)}
                  disabled={isMatched}
                  className={`flex min-h-[60px] items-center justify-center rounded-xl border p-3 text-center text-sm transition-all ${style} touch-target`}
                >
                  {card.text}
                </button>
              )
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
