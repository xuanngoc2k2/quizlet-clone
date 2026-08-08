import { computePartCounts, computeDifficultyCounts } from "./set-test-distribution"
import { describe, it, expect } from "vitest"

describe("computePartCounts", () => {
  it("sums to the total", () => {
    for (const total of [1, 3, 6, 15, 20, 30, 100]) {
      const d = computePartCounts(total)
      expect(d[1] + d[2] + d[3] + d[4]).toBe(total)
    }
  })

  it("meets minimums when the set is large enough", () => {
    const d = computePartCounts(20)
    expect(d[1]).toBeGreaterThanOrEqual(5)
    expect(d[2]).toBeGreaterThanOrEqual(5)
    expect(d[3]).toBeGreaterThanOrEqual(2)
    expect(d[4]).toBeGreaterThanOrEqual(3)
  })

  it("matches the deterministic 20-item split (sum + mins satisfied)", () => {
    expect(computePartCounts(20)).toEqual({ 1: 7, 2: 7, 3: 2, 4: 4 })
  })

  it("scales proportionally for small sets (15 items)", () => {
    const d = computePartCounts(15)
    expect(d[1] + d[2] + d[3] + d[4]).toBe(15)
    expect(d[1]).toBeGreaterThanOrEqual(5)
    expect(d[2]).toBeGreaterThanOrEqual(5)
  })

  it("keeps every part >= 1 for small sets", () => {
    const d = computePartCounts(6)
    ;[1, 2, 3, 4].forEach((p) => expect(d[p as 1 | 2 | 3 | 4]).toBeGreaterThanOrEqual(1))
    expect(d[1] + d[2] + d[3] + d[4]).toBe(6)
  })

  it("throws on invalid totals", () => {
    expect(() => computePartCounts(0)).toThrow()
    expect(() => computePartCounts(1.5)).toThrow()
  })
})

describe("computeDifficultyCounts", () => {
  it("sums to the total", () => {
    for (const total of [1, 5, 15, 20, 30]) {
      const d = computeDifficultyCounts(total)
      expect(d.easy + d.medium + d.hard).toBe(total)
    }
  })

  it("keeps medium as the largest share", () => {
    const d = computeDifficultyCounts(20)
    expect(d.medium).toBeGreaterThan(d.easy)
    expect(d.medium).toBeGreaterThanOrEqual(d.hard)
  })
})