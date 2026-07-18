"use client"

import { useState, useCallback } from "react"
import { Volume2, Volume1 } from "lucide-react"

type SpeakerButtonProps = {
  text: string
  lang?: string
  size?: "sm" | "md"
}

export function SpeakerButton({ text, lang = "ko-KR", size = "sm" }: SpeakerButtonProps) {
  const [playing, setPlaying] = useState(false)

  const speak = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!text.trim() || playing) return
    if (!("speechSynthesis" in window)) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text.trim())
    utterance.lang = lang
    utterance.rate = 0.9
    utterance.pitch = 1

    utterance.onstart = () => setPlaying(true)
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)

    const voices = window.speechSynthesis.getVoices()
    const koreanVoice = voices.find((v) => v.lang.startsWith("ko"))
    if (koreanVoice) utterance.voice = koreanVoice

    window.speechSynthesis.speak(utterance)
  }, [text, lang, playing])

  const sizeClass = size === "md" ? "h-9 w-9" : "h-7 w-7"
  const iconSize = size === "md" ? "h-4.5 w-4.5" : "h-3.5 w-3.5"

  return (
    <button
      type="button"
      onClick={speak}
      className={`inline-flex items-center justify-center rounded-full ${sizeClass} transition-all duration-150 ${
        playing
          ? "bg-primary-600 text-white shadow-sm shadow-primary-500/25"
          : "bg-primary-100 text-primary-500 hover:bg-primary-200 hover:text-primary-700 active:scale-90"
      }`}
      aria-label={playing ? "Playing" : "Play audio"}
    >
      {playing ? <Volume1 className={iconSize} /> : <Volume2 className={iconSize} />}
    </button>
  )
}
