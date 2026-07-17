import { shuffleArray } from "./utils"
import { describe, it, expect } from "vitest"

describe("shuffleArray", () => {
  it("returns array of same length", () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffleArray(input)
    expect(result).toHaveLength(input.length)
  })

  it("contains same elements", () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffleArray(input)
    expect(result.sort()).toEqual(input.sort())
  })
})
