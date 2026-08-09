import { describe, it, expect } from "vitest"
import { isAnswerCorrect, isAnswerWrong } from "./test-results"

describe("isAnswerCorrect / isAnswerWrong", () => {
  it("treats a first-pass correct answer as correct", () => {
    expect(isAnswerCorrect({ questionId: 1, isCorrect: true })).toBe(true)
    expect(isAnswerWrong({ questionId: 1, isCorrect: true })).toBe(false)
  })

  it("treats a plainly wrong answer as wrong", () => {
    expect(isAnswerCorrect({ questionId: 2, isCorrect: false })).toBe(false)
    expect(isAnswerWrong({ questionId: 2, isCorrect: false })).toBe(true)
  })

  it("treats a high score as correct even when isCorrect is false", () => {
    expect(isAnswerCorrect({ questionId: 3, isCorrect: false, score: 8 })).toBe(true)
    expect(isAnswerWrong({ questionId: 3, isCorrect: false, score: 8 })).toBe(false)
  })

  it("treats a score of exactly 5 as correct", () => {
    expect(isAnswerCorrect({ questionId: 4, isCorrect: false, score: 5 })).toBe(true)
    expect(isAnswerWrong({ questionId: 4, isCorrect: false, score: 5 })).toBe(false)
  })

  it("treats a low score as wrong", () => {
    expect(isAnswerCorrect({ questionId: 5, isCorrect: false, score: 3 })).toBe(false)
    expect(isAnswerWrong({ questionId: 5, isCorrect: false, score: 3 })).toBe(true)
  })
})