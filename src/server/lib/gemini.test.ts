import { describe, expect, it } from "vitest"

process.env.DATABASE_URL = "file:./test.db"
process.env.GEMINI_API_KEY = "test-key"
process.env.GEMINI_API_KEYS = "test-key, fallback-key"
process.env.GEMINI_API_BACKUP = '["backup-key"]'

const { callGeminiRaw, parseGeminiJSON } = await import("./gemini")

describe("parseGeminiJSON", () => {
  it("parses JSON wrapped in a markdown fence", () => {
    expect(parseGeminiJSON('```json\n{"text":"안녕"}\n```')).toEqual({ text: "안녕" })
  })

  it("reports truncated JSON without hiding the response size", () => {
    expect(() => parseGeminiJSON('{"text":"안녕","cells":["a",')).toThrow(
      "Invalid JSON from Gemini",
    )
  })

  it("falls back to the next key after a temporary Gemini outage", async () => {
    const originalFetch = globalThis.fetch
    const requestedUrls: string[] = []
    globalThis.fetch = async (input) => {
      requestedUrls.push(String(input))
      if (requestedUrls.length < 3) {
        return new Response('{"error":{"code":503}}', { status: 503 })
      }
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }),
        { status: 200 },
      )
    }

    try {
      await expect(callGeminiRaw("test prompt")).resolves.toBe("ok")
      expect(requestedUrls[0]).toContain("key=test-key")
      expect(requestedUrls[1]).toContain("key=fallback-key")
      expect(requestedUrls[2]).toContain("key=backup-key")
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})