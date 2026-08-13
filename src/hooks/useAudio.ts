"use client"

import { useCallback } from "react"

export function useAudio() {
  const play = useCallback((text: string, lang: string = "ko") => {
    if (!text) return
    const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${lang}`
    const audio = new Audio(audioUrl)
    audio.play().catch((err) => {
      console.error("TTS playback failed:", err)
    })
  }, [])

  return { play }
}
