import { describe, expect, it } from "vitest"

process.env.DATABASE_URL = "file:./test.db"
process.env.GEMINI_API_KEY = "test-key"

const { parseGeminiJSON } = await import("./gemini")

describe("parseGeminiJSON", () => {
  it("parses JSON wrapped in a markdown fence", () => {
    expect(parseGeminiJSON('```json\n{"text":"안녕"}\n```')).toEqual({ text: "안녕" })
  })

  it("reports truncated JSON without hiding the response size", () => {
    expect(() => parseGeminiJSON('{"text":"안녕","cells":["a",')).toThrow(
      "Invalid JSON from Gemini",
    )
  })
})