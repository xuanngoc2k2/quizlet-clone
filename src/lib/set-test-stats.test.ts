import { computeWeakStats, type HistoryInput } from "./set-test-stats"
import { describe, it, expect } from "vitest"

const baseHistory: HistoryInput = {
  sections: [{ questions: [{ id: 1, part: 1, itemType: "vocabulary" }, { id: 2, part: 1, itemType: "grammar" }] }],
  questionItemMap: { "1": "item_a", "2": "item_b" },
  attempts: [],
}

describe("computeWeakStats", () => {
  it("computes per-item stats and weak ids", () => {
    const result = computeWeakStats([
      {
        ...baseHistory,
        attempts: [
          {
            results: [
              { questionId: 1, isCorrect: true },
              { questionId: 2, isCorrect: false },
            ],
          },
          {
            results: [
              { questionId: 1, isCorrect: false },
              { questionId: 2, isCorrect: false },
            ],
          },
        ],
      },
    ])
    expect(result.items).toHaveLength(2)
    const a = result.items.find((it) => it.itemId === "item_a")!
    expect(a).toMatchObject({ timesSeen: 2, timesCorrect: 1, correctRate: 0.5 })
    const b = result.items.find((it) => it.itemId === "item_b")!
    expect(b.correctRate).toBe(0)
    expect(result.weakIds).toEqual(["item_b", "item_a"])
    expect(result.summary.overall).toEqual({ correct: 1, total: 4 })
  })

  it("counts Part 4 scores of 5+ as correct", () => {
    const result = computeWeakStats([
      {
        sections: [{ questions: [{ id: 10, part: 4, itemType: "grammar" }] }],
        questionItemMap: { "10": "item_x" },
        attempts: [
          {
            results: [
              { questionId: 10, isCorrect: false, score: 8 },
              { questionId: 10, isCorrect: false, score: 3 },
            ],
          },
        ],
      },
    ])
    expect(result.items[0]).toMatchObject({ timesSeen: 2, timesCorrect: 1, correctRate: 0.5 })
    expect(result.summary.grammar).toEqual({ correct: 1, total: 2 })
    expect(result.summary.parts[4]).toEqual({ correct: 1, total: 2 })
  })

  it("ignores results without a mapped item", () => {
    const result = computeWeakStats([
      {
        ...baseHistory,
        attempts: [{ results: [{ questionId: 99, isCorrect: true }] }],
      },
    ])
    expect(result.summary.overall).toEqual({ correct: 0, total: 0 })
    expect(result.items).toHaveLength(0)
    expect(result.weakIds).toHaveLength(0)
  })

  it("tracks lastCorrect state", () => {
    const result = computeWeakStats([
      {
        ...baseHistory,
        attempts: [
          { results: [{ questionId: 1, isCorrect: true }] },
          { results: [{ questionId: 1, isCorrect: false }] },
        ],
      },
    ])
    expect(result.items.find((it) => it.itemId === "item_a")!.lastCorrect).toBe(false)
  })
})
