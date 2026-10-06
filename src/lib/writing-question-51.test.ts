import { describe, expect, it } from "vitest"
import { gradeWritingQuestion51, normalizeWritingAnswer51 } from "./writing-question-51"
import type { WritingQuestion51 } from "./writing-types"

const question: Pick<WritingQuestion51, "blanks" | "score"> = {
  score: 10,
  blanks: [
    { id: "blank-1", label: "ㄱ", answer: ["참가해도 될까요", "같이 참가해도 될까요"] },
    { id: "blank-2", label: "ㄴ", answer: ["잘하는지"] },
  ],
}

describe("gradeWritingQuestion51", () => {
  it("accepts any configured answer and gives full score", () => {
    const result = gradeWritingQuestion51(question, {
      "blank-1": "같이 참가해도 될까요",
      "blank-2": "  잘하는지  ",
    })

    expect(result.score).toBe(10)
    expect(result.correctCount).toBe(2)
    expect(result.results.every((item) => item.status === "correct")).toBe(true)
  })

  it("gives partial score and marks an unanswered blank", () => {
    const result = gradeWritingQuestion51(question, { "blank-1": "참가해도 될까요" })

    expect(result.score).toBe(5)
    expect(result.results[0]?.score).toBe(5)
    expect(result.results[1]?.status).toBe("unanswered")
  })

  it("marks incorrect answers without revealing them before grading", () => {
    const result = gradeWritingQuestion51(question, { "blank-1": "틀린 답", "blank-2": "오답" })

    expect(result.score).toBe(0)
    expect(result.results.map((item) => item.status)).toEqual(["incorrect", "incorrect"])
  })

  it("normalizes surrounding and repeated whitespace", () => {
    expect(normalizeWritingAnswer51("  잘하는지   ")).toBe("잘하는지")
  })
})