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

/**
 * Call Gemini with a text prompt + an inline image (base64, no data: prefix).
 * Uses the same endpoint — gemini-3.1-flash-lite supports vision.
 */
export async function callGeminiVision(
  prompt: string,
  imageBase64: string,
  imageMimeType: string,
  opts: GeminiOptions = {},
): Promise<string> {
  const { temperature = 0.3, maxTokens = 4096 } = opts
  const parts = [
    { text: prompt },
    { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
  ]

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
    if (res.status === 429) throw new Error("AI quota exceeded. Please wait and try again.")
    throw new Error(`Gemini Vision API error (${res.status}): ${errorText}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Empty content from Gemini Vision")
  return text
}

export async function callGeminiVisionJSON(
  prompt: string,
  imageBase64: string,
  imageMimeType: string,
  opts: GeminiOptions = {},
): Promise<unknown> {
  let text = await callGeminiVision(prompt, imageBase64, imageMimeType, opts)
  text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace !== -1) {
    text = text.slice(firstBrace, lastBrace + 1)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON from Gemini Vision (${text.length} chars): ${text.slice(0, 300)}`)
  }
}