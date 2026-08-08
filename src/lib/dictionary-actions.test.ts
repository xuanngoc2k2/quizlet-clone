import { describe, it, expect } from "vitest"
import { buildCardInput, isDuplicateTerm, termKey } from "./dictionary-actions"

describe("termKey", () => {
  it("normalizes case and whitespace", () => {
    expect(termKey("  사랑 ")).toBe("사랑")
    expect(termKey("Hello")).toBe("hello")
  })
})

describe("isDuplicateTerm", () => {
  it("detects duplicate by normalized term", () => {
    const cards = [{ term: "사랑" }, { term: "학교" }]
    expect(isDuplicateTerm(cards, "사랑")).toBe(true)
    expect(isDuplicateTerm(cards, "  사랑  ")).toBe(true)
    expect(isDuplicateTerm(cards, "공부")).toBe(false)
  })

  it("is case-insensitive for latin terms", () => {
    const cards = [{ term: "House" }]
    expect(isDuplicateTerm(cards, "house")).toBe(true)
  })

  it("returns false for empty lists", () => {
    expect(isDuplicateTerm([], "사랑")).toBe(false)
  })
})

describe("buildCardInput", () => {
  it("trims fields and defaults type", () => {
    expect(buildCardInput("  사랑 ", "  tình yêu ")).toEqual({
      term: "사랑",
      definition: "tình yêu",
      type: "vocabulary",
    })
  })

  it("keeps explicit grammar type", () => {
    expect(buildCardInput("-아서", "vì nên", "grammar").type).toBe("grammar")
  })
})
