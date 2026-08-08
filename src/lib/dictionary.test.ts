import { describe, it, expect } from "vitest"
import {
  buildDictionaryPrompt,
  detectDirection,
  dictionaryResultSchema,
  hasHangul,
  normalizeCacheKey,
} from "./dictionary"

describe("normalizeCacheKey", () => {
  it("trims and lowercases", () => {
    expect(normalizeCacheKey("  사랑  ")).toBe("사랑")
    expect(normalizeCacheKey("Hello World")).toBe("hello world")
  })

  it("collapses inner whitespace", () => {
    expect(normalizeCacheKey("tình   yêu")).toBe("tình yêu")
  })

  it("is case-insensitive", () => {
    expect(normalizeCacheKey("사랑")).toBe(normalizeCacheKey("사랑"))
    expect(normalizeCacheKey("Happy")).toBe(normalizeCacheKey("happy"))
  })
})

describe("hasHangul", () => {
  it("detects Korean characters", () => {
    expect(hasHangul("사랑")).toBe(true)
    expect(hasHangul("저는 학생입니다")).toBe(true)
  })

  it("returns false for non-Korean", () => {
    expect(hasHangul("tình yêu")).toBe(false)
    expect(hasHangul("hello")).toBe(false)
    expect(hasHangul("12345")).toBe(false)
  })
})

describe("detectDirection", () => {
  it("maps Korean text to ko -> vi", () => {
    expect(detectDirection("학교")).toEqual({ from: "ko", to: "vi" })
  })

  it("maps non-Korean text to vi -> ko", () => {
    expect(detectDirection("trường học")).toEqual({ from: "vi", to: "ko" })
  })
})

describe("buildDictionaryPrompt", () => {
  it("embeds the query and direction", () => {
    const prompt = buildDictionaryPrompt("사랑", "ko", "vi")
    expect(prompt).toContain('Input text: "사랑"')
    expect(prompt).toContain("translate from Korean into Vietnamese")
  })

  it("includes the JSON schema contract", () => {
    const prompt = buildDictionaryPrompt("학교", "ko", "vi")
    expect(prompt).toContain('"mode"')
    expect(prompt).toContain('"targetText"')
    expect(prompt).toContain('"grammarPoints"')
    expect(prompt).toContain("VALID JSON ONLY")
  })

  it("asks for Vietnamese explanations even when target is Korean", () => {
    const prompt = buildDictionaryPrompt("tình yêu", "vi", "ko")
    expect(prompt).toContain("translate from Vietnamese into Korean")
    expect(prompt).toContain("All meanings, explanations and notes MUST be in Vietnamese")
  })
})

describe("dictionaryResultSchema", () => {
  it("accepts a minimal valid word entry", () => {
    const parsed = dictionaryResultSchema.parse({
      mode: "word",
      sourceText: "사랑",
      targetText: "tình yêu",
      romanization: "sarang",
      meanings: [{ partOfSpeech: "noun", meaning: "tình yêu" }],
    })
    expect(parsed.mode).toBe("word")
    expect(parsed.meanings?.[0]?.meaning).toBe("tình yêu")
  })

  it("accepts a sentence entry with translation and grammar", () => {
    const parsed = dictionaryResultSchema.parse({
      mode: "sentence",
      sourceText: "저는 학교에 갑니다.",
      targetText: "Tôi đi đến trường.",
      translation: "Tôi đi đến trường.",
      grammarPoints: [
        {
          pattern: "-에",
          meaning: "trợ từ chỉ nơi chốn",
          examples: [{ sentence: "집에 갑니다", translation: "Tôi về nhà" }],
        },
      ],
    })
    expect(parsed.grammarPoints?.[0]?.pattern).toBe("-에")
  })

  it("rejects an unknown mode", () => {
    expect(() =>
      dictionaryResultSchema.parse({
        mode: "article",
        sourceText: "사랑",
        targetText: "tình yêu",
      }),
    ).toThrow()
  })

  it("rejects an empty targetText", () => {
    expect(() =>
      dictionaryResultSchema.parse({
        mode: "word",
        sourceText: "사랑",
        targetText: "",
      }),
    ).toThrow()
  })
})
