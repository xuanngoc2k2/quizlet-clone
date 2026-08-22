"use client"

import { useCallback, useEffect, useRef } from "react"

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = useCallback((text: string, lang: string = "ko") => {
    if (!text) return
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${lang}`
    const audio = new Audio(audioUrl)
    audioRef.current = audio
    audio.play().catch((err) => {
      console.error("TTS playback failed:", err)
    })
  }, [])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  return { play }
}
