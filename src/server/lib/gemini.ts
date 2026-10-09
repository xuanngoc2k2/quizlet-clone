import { env } from "@/lib/env"

export const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent"

export type GeminiOptions = {
  temperature?: number
  maxTokens?: number
  userText?: string
  responseMimeType?: "application/json"
}

function getGeminiApiKeys() {
  return Array.from(
    new Set(
      [env.GEMINI_API_KEY, ...(env.GEMINI_API_KEYS?.split(",") ?? [])]
        .map((key) => key.trim())
        .filter(Boolean),
    ),
  )
}

function isRetryableGeminiError(status: number) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504
}

async function requestGemini(body: object, source: string) {
  const apiKeys = getGeminiApiKeys()
  let lastError = ""

  for (const [index, apiKey] of apiKeys.entries()) {
    try {
      const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) return res.json()

      const errorText = await res.text()
      lastError = `${source} API error (${res.status}): ${errorText}`
      if (!isRetryableGeminiError(res.status) || index === apiKeys.length - 1) {
        if (res.status === 429) throw new Error("AI quota exceeded. Please wait and try again.")
        throw new Error(lastError)
      }
    } catch (error) {
      const status = Number(error instanceof Error ? error.message.match(/\((\d+)\)/)?.[1] : undefined)
      const isApiError = error instanceof Error && status > 0
      if (isApiError && !isRetryableGeminiError(status)) throw error
      if (index === apiKeys.length - 1) {
        throw error instanceof Error
          ? error
          : new Error(`${source} request failed: ${String(error)}`)
      }
    }
  }

  throw new Error(lastError || `${source} request failed`)
}

export async function callGeminiRaw(prompt: string, opts: GeminiOptions = {}) {
  const { temperature = 0.3, maxTokens = 4096, userText, responseMimeType } = opts
  const parts = userText ? [{ text: prompt }, { text: userText }] : [{ text: prompt }]

  const data = await requestGemini({
      contents: [{ parts }],
      generationConfig: { temperature, maxOutputTokens: maxTokens, responseMimeType },
    }, "Gemini")
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
  return parseGeminiJSON(await callGeminiRaw(prompt, { ...opts, responseMimeType: "application/json" }), "Gemini")
}

export function parseGeminiJSON(text: string, source = "Gemini"): unknown {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
  const firstBrace = cleaned.indexOf("{")
  const lastBrace = cleaned.lastIndexOf("}")
  const json = firstBrace !== -1 && lastBrace !== -1
    ? cleaned.slice(firstBrace, lastBrace + 1)
    : cleaned

  try {
    return JSON.parse(json)
  } catch {
    throw new Error(`Invalid JSON from ${source} (${json.length} chars): ${json.slice(0, 300)}`)
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
  const { temperature = 0.3, maxTokens = 4096, responseMimeType } = opts
  const parts = [
    { text: prompt },
    { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
  ]

  const data = await requestGemini({
      contents: [{ parts }],
      generationConfig: { temperature, maxOutputTokens: maxTokens, responseMimeType },
    }, "Gemini Vision")
  const candidate = data?.candidates?.[0]
  if (candidate?.finishReason === "MAX_TOKENS") {
    throw new Error(`Gemini Vision response was truncated at ${maxTokens} output tokens`)
  }
  const text = candidate?.content?.parts?.[0]?.text
  if (!text) throw new Error("Empty content from Gemini Vision")
  return text
}

export async function callGeminiVisionJSON(
  prompt: string,
  imageBase64: string,
  imageMimeType: string,
  opts: GeminiOptions = {},
): Promise<unknown> {
  const text = await callGeminiVision(prompt, imageBase64, imageMimeType, {
    ...opts,
    responseMimeType: "application/json",
  })
  return parseGeminiJSON(text, "Gemini Vision")
}