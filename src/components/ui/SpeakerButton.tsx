"use client"

import { useState, useCallback, useRef } from "react"
import { Volume2, Volume1 } from "lucide-react"

type SpeakerButtonProps = {
  text: string
  lang?: string
  size?: "sm" | "md"
}

export function SpeakerButton({ text, lang = "ko-KR", size = "sm" }: SpeakerButtonProps) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speak = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!text.trim() || playing) return

    const shortLang = lang.split("-")[0]
    const audioUrl = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=${shortLang}`

    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.onplay = () => setPlaying(true)
    audio.onended = () => setPlaying(false)
    audio.onerror = () => setPlaying(false)

    audio.play().catch((err) => {
      console.error("TTS playback failed:", err)
      setPlaying(false)
    })
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
