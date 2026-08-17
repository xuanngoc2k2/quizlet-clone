"use client"

import { useRouter } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { ProgressBar } from "@/components/study/ProgressBar"
import { Button } from "@/components/ui/Button"
import { MathText } from "@/components/ui/MathText"
import { SpeakerButton } from "@/components/ui/SpeakerButton"
import { getButtonPreviews } from "@/lib/srs"
import type { SrsCard, SrsRating } from "@/lib/srs"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  RotateCw,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  BookOpen,
} from "lucide-react"

type DueCard = {
  cardId: string
  setId: string
  setTitle: string
  term: string
  definition: string
  srsInterval: number
  srsEase: number
  srsLapses: number
  srsState: string
  srsDue: Date | string
}

const DEFAULT_SRS_CARD: SrsCard = {
  srsInterval: 0,
  srsEase: 2.5,
  srsLapses: 0,
  srsState: "new",
}

function toSrsCard(card: DueCard): SrsCard {
  return {
    srsInterval: card.srsInterval,
    srsEase: card.srsEase,
    srsLapses: card.srsLapses,
    srsState: card.srsState as SrsCard["srsState"],
  }
}

export default function ReviewSessionPage() {
  const router = useRouter()
  const { data: rawDue = [], isLoading } =
    api.cardProgress.getDueWithDetails.useQuery()
  const utils = api.useUtils()
  const reviewMutation = api.cardProgress.review.useMutation({
    onSuccess: () => {
      utils.cardProgress.getDueWithDetails.invalidate()
      utils.cardProgress.getDueByDevice.invalidate()
    },
  })

  // Shuffle once on mount
  const [deck, setDeck] = useState<DueCard[]>([])
  const [initialized, setInitialized] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)

  useEffect(() => {
    if (!initialized && rawDue.length > 0) {
      const arr = [...rawDue]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      setDeck(arr as DueCard[])
      setInitialized(true)
    }
  }, [rawDue, initialized])

  const currentCard = deck[currentIndex] ?? null
  const isComplete = initialized && deck.length > 0 && currentIndex >= deck.length

  const currentSrsCard: SrsCard = currentCard ? toSrsCard(currentCard) : DEFAULT_SRS_CARD
  const buttonPreviews = getButtonPreviews(currentSrsCard)

  // Autoplay
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playAudio = useCallback((text: string) => {
    if (!text.trim()) return
    const url = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=ko`
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(url)
    audioRef.current = audio
    audio.play().catch(() => {})
  }, [])

  useEffect(() => {
    if (currentCard && !isComplete) {
      playAudio(currentCard.term)
    }
  }, [currentIndex, currentCard, isComplete, playAudio])

  const handleReview = useCallback(
    (rating: SrsRating, markCorrect: boolean) => {
      if (!currentCard || isComplete) return
      reviewMutation.mutate({
        setId: currentCard.setId,
        cardId: currentCard.cardId,
        rating,
      })
      if (markCorrect) {
        setCorrectCount((c) => c + 1)
      } else {
        setIncorrectCount((c) => c + 1)
      }
      setCurrentIndex((i) => i + 1)
      setFlipped(false)
    },
    [currentCard, isComplete, reviewMutation],
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const tag = document.activeElement?.tagName
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      )
        return

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault()
        if (!isComplete && currentCard) {
          if (!flipped) {
            setFlipped(true)
          } else {
            handleReview(2, true) // Good
          }
        }
      } else if (e.code === "Digit1" && flipped) {
        e.preventDefault()
        handleReview(0, false) // Again
      } else if (e.code === "Digit2" && flipped) {
        e.preventDefault()
        handleReview(1, false) // Hard
      } else if (e.code === "Digit3" && flipped) {
        e.preventDefault()
        handleReview(2, true) // Good
      } else if (e.code === "Digit4" && flipped) {
        e.preventDefault()
        handleReview(3, true) // Easy
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isComplete, currentCard, flipped, handleReview])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading || (!initialized && rawDue.length === 0)) {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
            <p className="text-sm text-primary-400">Đang tải thẻ ôn tập…</p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // ── No cards ─────────────────────────────────────────────────────────────
  if (initialized && deck.length === 0) {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-24">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold text-primary-900">
            Không có thẻ nào!
          </h2>
          <p className="mt-1 text-sm text-primary-400">
            Hôm nay không có thẻ nào cần ôn tập.
          </p>
          <div className="mt-8 flex gap-3">
            <Button onClick={() => router.push("/")} variant="secondary">
              <BookOpen className="h-4 w-4" />
              Về trang chủ
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // ── Complete ──────────────────────────────────────────────────────────────
  if (isComplete) {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-24">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold text-primary-900">
            Hoàn thành! 🎉
          </h2>
          <p className="mt-1 text-sm text-primary-400">
            Bạn đã ôn xong {deck.length} thẻ hôm nay
          </p>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-lg font-bold">{correctCount}</span>
            </span>
            <span className="text-primary-300">/</span>
            <span className="flex items-center gap-1.5 text-red-500">
              <XCircle className="h-5 w-5" />
              <span className="text-lg font-bold">{incorrectCount}</span>
            </span>
          </div>
          <div className="mt-8 flex gap-3">
            <Button
              onClick={() => {
                setCurrentIndex(0)
                setCorrectCount(0)
                setIncorrectCount(0)
                setFlipped(false)
                const arr = [...deck]
                for (let i = arr.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1))
                  ;[arr[i], arr[j]] = [arr[j], arr[i]]
                }
                setDeck(arr)
              }}
              variant="secondary"
            >
              <RotateCw className="h-4 w-4" />
              Ôn lại
            </Button>
            <Button onClick={() => router.push("/review")} variant="gradient">
              Về Dashboard
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // ── Study UI ─────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        {/* Progress */}
        <div className="mb-1">
          <ProgressBar
            current={currentIndex + 1}
            total={deck.length}
            correct={correctCount}
            incorrect={incorrectCount}
          />
        </div>

        {/* Set label */}
        {currentCard && (
          <div className="mb-3 flex items-center gap-1.5 text-xs text-primary-400">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="truncate">{currentCard.setTitle}</span>
          </div>
        )}

        {/* Keyboard hints */}
        {!flipped ? (
          <p className="mb-2 text-center text-xs text-primary-400">
            Space / Enter: Lật thẻ
          </p>
        ) : (
          <p className="mb-2 text-center text-xs text-primary-400">
            1 Quên · 2 Khó · 3 Tốt · 4 Dễ · Space = Tốt
          </p>
        )}

        {/* Flashcard */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <button
            onClick={() => setFlipped(!flipped)}
            className="w-full max-w-md perspective"
          >
            <div
              className={`relative min-h-[300px] w-full transition-transform duration-500 preserve-3d ${
                flipped ? "rotate-y-180" : ""
              }`}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden rounded-2xl border border-primary-100 bg-white p-8 shadow-lg">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary-400">
                    Term
                  </p>
                  <p className="text-xl font-semibold text-primary-900 whitespace-pre-wrap">
                    <MathText text={currentCard?.term ?? ""} />
                  </p>
                  <p className="mt-6 text-xs text-primary-300">Tap to flip</p>
                </div>
                {currentCard && (
                  <div className="absolute bottom-4 right-4">
                    <SpeakerButton text={currentCard.term} lang="ko-KR" />
                  </div>
                )}
              </div>
              {/* Back */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border border-primary-100 bg-white p-8 shadow-lg">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary-400">
                    Definition
                  </p>
                  <p className="text-xl font-semibold text-primary-900 whitespace-pre-wrap">
                    <MathText text={currentCard?.definition ?? ""} />
                  </p>
                  <p className="mt-6 text-xs text-primary-300">Tap to flip back</p>
                </div>
                {currentCard && (
                  <div className="absolute bottom-4 right-4">
                    <SpeakerButton text={currentCard.definition} lang="vi-VN" />
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Action buttons */}
        {!flipped ? (
          <div className="mt-8">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setFlipped(true)}
              aria-label="Flip flashcard"
            >
              <ChevronRight className="h-4 w-4" />
              Lật thẻ để đánh giá
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-4 gap-2">
            <button
              onClick={() => handleReview(0, false)}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-red-200 bg-red-50 px-2 py-3 transition-all hover:bg-red-100 active:scale-95"
              aria-label="Again – forgot this card"
            >
              <span className="text-xs font-bold text-red-600">Quên</span>
              <span className="text-[10px] font-medium text-red-400">
                {buttonPreviews[0]}
              </span>
            </button>
            <button
              onClick={() => handleReview(1, false)}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-orange-200 bg-orange-50 px-2 py-3 transition-all hover:bg-orange-100 active:scale-95"
              aria-label="Hard – recalled with difficulty"
            >
              <span className="text-xs font-bold text-orange-600">Khó</span>
              <span className="text-[10px] font-medium text-orange-400">
                {buttonPreviews[1]}
              </span>
            </button>
            <button
              onClick={() => handleReview(2, true)}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-2 py-3 transition-all hover:bg-emerald-100 active:scale-95"
              aria-label="Good – recalled well"
            >
              <span className="text-xs font-bold text-emerald-600">Tốt</span>
              <span className="text-[10px] font-medium text-emerald-400">
                {buttonPreviews[2]}
              </span>
            </button>
            <button
              onClick={() => handleReview(3, true)}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-blue-200 bg-blue-50 px-2 py-3 transition-all hover:bg-blue-100 active:scale-95"
              aria-label="Easy – too easy"
            >
              <span className="text-xs font-bold text-blue-600">Dễ</span>
              <span className="text-[10px] font-medium text-blue-400">
                {buttonPreviews[3]}
              </span>
            </button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
