import { env } from "@/lib/env"

export const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent"

export type GeminiOptions = {
  temperature?: number
  maxTokens?: number
  userText?: string
}

export async function callGeminiRaw(prompt: string, opts: GeminiOptions = {}) {
  const { temperature = 0.3, maxTokens = 4096, userText } = opts
  const parts = userText ? [{ text: prompt }, { text: userText }] : [{ text: prompt }]

  const res = await fetch(`${GEMINI_API_URL}?key=${env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    if (res.status === 429) {
      throw new Error("AI quota exceeded. Please wait and try again.")
    }
    throw new Error(`Gemini API error (${res.status}): ${errorText}`)
  }

  const data = await res.json()
  const candidate = data?.candidates?.[0]
  if (!candidate) {
    const finishReason = data?.candidates?.[0]?.finishReason ?? "unknown"
    throw new Error(`Empty Gemini response (finishReason: ${finishReason})`)
  }
  const text = candidate?.content?.parts?.[0]?.text
  if (!text) throw new Error("Empty content from Gemini")
  return text
}

export async function callGeminiJSON(prompt: string, opts: GeminiOptions = {}): Promise<unknown> {
  let text = await callGeminiRaw(prompt, opts)
  text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace !== -1) {
    text = text.slice(firstBrace, lastBrace + 1)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON from Gemini (${text.length} chars): ${text.slice(0, 300)}`)
  }
}

export async function callGeminiText(prompt: string, opts: GeminiOptions = {}) {
  const text = await callGeminiRaw(prompt, opts)
  return text.trim()
}