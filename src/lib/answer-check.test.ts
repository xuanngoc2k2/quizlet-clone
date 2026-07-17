import { describe, it, expect } from "vitest"

// adapted from learn/page.tsx
function normalize(str: string) {
  return str.toLowerCase().trim().replace(/\s+/g, " ")
}

function isCorrect(userAnswer: string, correctAnswer: string) {
  const a = normalize(userAnswer)
  const b = normalize(correctAnswer)
  if (a === b) return true
  if (a.includes(b) || b.includes(a)) return true
  const aWords = a.split(" ")
  const bWords = b.split(" ")
  const common = aWords.filter((w) => bWords.includes(w)).length
  return common >= Math.min(aWords.length, bWords.length) * 0.7
}

describe("answer checking", () => {
  it("exact match", () => {
    expect(isCorrect("A lightweight JavaScript representation of the real DOM", "A lightweight JavaScript representation of the real DOM")).toBe(true)
  })

  it("case insensitive", () => {
    expect(isCorrect("Water", "water")).toBe(true)
  })

  it("partial match by inclusion", () => {
    expect(isCorrect("lightweight JavaScript representation", "A lightweight JavaScript representation of the real DOM")).toBe(true)
  })

  it("70% word overlap", () => {
    expect(isCorrect("lightweight JavaScript representation of the DOM", "A lightweight JavaScript representation of the real DOM")).toBe(true)
  })

  it("wrong answer", () => {
    expect(isCorrect("something completely different", "A lightweight JavaScript representation")).toBe(false)
  })
})
