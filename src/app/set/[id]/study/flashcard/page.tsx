"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { useStudyEngine } from "@/hooks/useStudyEngine"
import { useTimer } from "@/hooks/useTimer"
import { updateSetProgress, filterCardsByRemembered, getAutoplaySetting, saveAutoplaySetting } from "@/lib/local-storage"
import { getButtonPreviews } from "@/lib/srs"
import type { SrsCard, SrsRating } from "@/lib/srs"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { ProgressBar } from "@/components/study/ProgressBar"
import { Button } from "@/components/ui/Button"
import { MathText } from "@/components/ui/MathText"
import { SpeakerButton } from "@/components/ui/SpeakerButton"
import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { RotateCw, CheckCircle2, XCircle, Sparkles, Volume2, VolumeX, ChevronRight } from "lucide-react"

const DEFAULT_SRS_CARD: SrsCard = {
  srsInterval: 0,
  srsEase: 2.5,
  srsLapses: 0,
  srsState: "new",
}

export default function FlashcardPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: set } = api.sets.getById.useQuery({ id })
  const rememberedFilter = (searchParams.get("remembered") ?? "all") as "all" | "0" | "1" | "2" | "3"
  const { data: cardProgress = {} } = api.cardProgress.getBySet.useQuery({ setId: id })
  const { data: srsProgress = {} } = api.cardProgress.getSrsBySet.useQuery({ setId: id })
  const utils = api.useUtils()

  const reviewMutation = api.cardProgress.review.useMutation({
    onSuccess: () => {
      utils.cardProgress.getBySet.invalidate({ setId: id })
      utils.cardProgress.getSrsBySet.invalidate({ setId: id })
    },
  })

  const cards = useMemo(
    () => filterCardsByRemembered(set?.cards ?? [], cardProgress, rememberedFilter),
    [set?.cards, cardProgress, rememberedFilter],
  )
  const engine = useStudyEngine(cards)
  const timer = useTimer()
  const [flipped, setFlipped] = useState(false)
  const startedRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [autoplay, setAutoplay] = useState(true)

  useEffect(() => {
    setAutoplay(getAutoplaySetting())
  }, [])

  const handleAutoplayToggle = () => {
    const newVal = !autoplay
    setAutoplay(newVal)
    saveAutoplaySetting(newVal)
  }

  const playAudio = useCallback((text: string, lang: string = "ko-KR") => {
    if (!text.trim()) return
    const shortLang = lang.split("-")[0]
    const audioUrl = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=${shortLang}`
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(audioUrl)
    audioRef.current = audio
    audio.play().catch(err => console.error("Auto-play failed:", err))
  }, [])

  useEffect(() => {
    if (autoplay && engine.currentCard && !engine.isComplete) {
      playAudio(engine.currentCard.term, "ko-KR")
    }
  }, [engine.currentIndex, autoplay, engine.currentCard, engine.isComplete, playAudio])

  // SRS: lấy state của card hiện tại
  const currentSrsCard: SrsCard = engine.currentCard
    ? (srsProgress[engine.currentCard.id] ?? DEFAULT_SRS_CARD)
    : DEFAULT_SRS_CARD

  const buttonPreviews = getButtonPreviews(currentSrsCard)

  // Hàm xử lý đánh giá SRS + chuyển card
  const handleReview = useCallback(
    (rating: SrsRating, markCorrect: boolean) => {
      if (!engine.currentCard || engine.isComplete) return
      reviewMutation.mutate({ setId: id, cardId: engine.currentCard.id, rating })
      if (markCorrect) {
        engine.markCorrect()
      } else {
        engine.markIncorrect()
      }
      setFlipped(false)
    },
    [engine, id, reviewMutation],
  )

  // Keyboard shortcuts (Anki style):
  // - Space / Enter: lật thẻ nếu chưa lật; nếu đã lật → Good (rating 2)
  // - 1: Again, 2: Hard, 3: Good, 4: Easy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const tag = document.activeElement?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement as HTMLElement)?.isContentEditable) return

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault()
        if (!engine.isComplete && engine.currentCard) {
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
  }, [engine, flipped, handleReview])

  useEffect(() => {
    if (!startedRef.current && cards.length > 0) {
      timer.start()
      startedRef.current = true
    }
  }, [cards.length, timer])

  useEffect(() => {
    if (engine.isComplete && cards.length > 0) {
      timer.stop()
      updateSetProgress(id, "flashcard", {
        correct: engine.correctCount,
        incorrect: engine.incorrectCount,
        completedCards: engine.completedCards,
        timeSpent: timer.elapsed,
        step: engine.total,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.isComplete, cards.length])

  if (cards.length === 0) {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <p className="text-primary-500">No cards in this set</p>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (engine.isComplete) {
    return (
      <div className="flex min-h-screen-safe flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-24">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-500 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold text-primary-900">Complete!</h2>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-lg font-bold">{engine.correctCount}</span>
            </span>
            <span className="text-primary-300">/</span>
            <span className="flex items-center gap-1.5 text-red-500">
              <XCircle className="h-5 w-5" />
              <span className="text-lg font-bold">{engine.incorrectCount}</span>
            </span>
          </div>
          <p className="mt-2 text-sm text-primary-400">
            Time: {Math.floor(timer.elapsed / 60)}m {timer.elapsed % 60}s
          </p>
          <div className="mt-8 flex gap-3">
            <Button onClick={engine.reset} variant="secondary">
              <RotateCw className="h-4 w-4" />
              Study Again
            </Button>
            <Button onClick={() => router.push(`/set/${id}`)} variant="gradient">
              Back to Set
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex-1">
            <ProgressBar
              current={engine.currentIndex + 1}
              total={engine.total}
              correct={engine.correctCount}
              incorrect={engine.incorrectCount}
            />
          </div>
          <button
            onClick={handleAutoplayToggle}
            className={`ml-4 p-2 rounded-full transition-colors ${
              autoplay ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-400"
            }`}
            title="Toggle Autoplay"
            aria-label="Automatically play pronunciation"
          >
            {autoplay ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>

        {/* Keyboard hints */}
        {!flipped ? (
          <p className="mb-2 text-center text-xs text-primary-400">Space / Enter: Lật thẻ</p>
        ) : (
          <p className="mb-2 text-center text-xs text-primary-400">1 Quên · 2 Khó · 3 Tốt · 4 Dễ · Space = Tốt</p>
        )}

        <div className="flex flex-1 flex-col items-center justify-center">
          <button onClick={() => setFlipped(!flipped)} className="w-full max-w-md perspective">
            <div
              className={`relative min-h-[300px] w-full transition-transform duration-500 preserve-3d ${
                flipped ? "rotate-y-180" : ""
              }`}
            >
              <div className="absolute inset-0 backface-hidden rounded-2xl border border-primary-100 bg-white p-8 shadow-lg">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary-400">Term</p>
                  <p className="text-xl font-semibold text-primary-900 whitespace-pre-wrap"><MathText text={engine.currentCard?.term ?? ""} /></p>
                  <p className="mt-6 text-xs text-primary-300">Tap to flip</p>
                </div>
                {engine.currentCard && (
                  <div className="absolute bottom-4 right-4">
                    <SpeakerButton text={engine.currentCard.term} lang="ko-KR" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border border-primary-100 bg-white p-8 shadow-lg">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary-400">Definition</p>
                  <p className="text-xl font-semibold text-primary-900 whitespace-pre-wrap"><MathText text={engine.currentCard?.definition ?? ""} /></p>
                  <p className="mt-6 text-xs text-primary-300">Tap to flip back</p>
                </div>
                {engine.currentCard && (
                  <div className="absolute bottom-4 right-4">
                    <SpeakerButton text={engine.currentCard.definition} lang="en-US" />
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Nếu chưa lật: nút Lật thẻ */}
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
          /* Đã lật: 4 nút SRS */
          <div className="mt-8 grid grid-cols-4 gap-2">
            {/* Again */}
            <button
              onClick={() => handleReview(0, false)}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-red-200 bg-red-50 px-2 py-3 transition-all hover:bg-red-100 active:scale-95"
              aria-label="Again – forgot this card"
            >
              <span className="text-xs font-bold text-red-600">Quên</span>
              <span className="text-[10px] font-medium text-red-400">{buttonPreviews[0]}</span>
            </button>
            {/* Hard */}
            <button
              onClick={() => handleReview(1, false)}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-orange-200 bg-orange-50 px-2 py-3 transition-all hover:bg-orange-100 active:scale-95"
              aria-label="Hard – recalled with difficulty"
            >
              <span className="text-xs font-bold text-orange-600">Khó</span>
              <span className="text-[10px] font-medium text-orange-400">{buttonPreviews[1]}</span>
            </button>
            {/* Good */}
            <button
              onClick={() => handleReview(2, true)}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-2 py-3 transition-all hover:bg-emerald-100 active:scale-95"
              aria-label="Good – recalled well"
            >
              <span className="text-xs font-bold text-emerald-600">Tốt</span>
              <span className="text-[10px] font-medium text-emerald-400">{buttonPreviews[2]}</span>
            </button>
            {/* Easy */}
            <button
              onClick={() => handleReview(3, true)}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-blue-200 bg-blue-50 px-2 py-3 transition-all hover:bg-blue-100 active:scale-95"
              aria-label="Easy – too easy"
            >
              <span className="text-xs font-bold text-blue-600">Dễ</span>
              <span className="text-[10px] font-medium text-blue-400">{buttonPreviews[3]}</span>
            </button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
