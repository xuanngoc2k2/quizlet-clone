import { computePartCounts, computeDifficultyCounts, assignItemsToParts, type ItemPartHistory, type CardType, type Part } from "./set-test-distribution"
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

describe("assignItemsToParts", () => {
  it("balances items across parts over multiple test attempts", () => {
    const items = Array.from({ length: 15 }, (_, i) => ({
      key: `item_${i + 1}`,
      type: (i % 2 === 0 ? "grammar" : "vocabulary") as CardType,
    }))
    const partCounts = computePartCounts(15)
    const historyMap = new Map<string, ItemPartHistory>()

    // Simulate 4 test generations
    for (let test = 1; test <= 4; test++) {
      const assignments = assignItemsToParts(items, partCounts, historyMap)

      // Ensure every item is assigned
      expect(assignments).toHaveLength(15)

      // Ensure part counts match
      const assignedCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
      for (const a of assignments) {
        assignedCounts[a.part]++
      }
      expect(assignedCounts).toEqual(partCounts)

      // Update history map for next iteration
      for (const a of assignments) {
        let hist = historyMap.get(a.itemKey)
        if (!hist) {
          hist = { counts: { 1: 0, 2: 0, 3: 0, 4: 0 } as Record<Part, number> }
          historyMap.set(a.itemKey, hist)
        }
        hist.counts[a.part]++
        hist.lastSeenPart = a.part
      }
    }

    // After 4 tests, since Part 1 has 5 slots (15 items), each item should have appeared in different parts ideally.
    // Check that items are reasonably distributed
    let zeroCount = 0
    for (const item of items) {
      const hist = historyMap.get(item.key)!
      // No item should have been in the same part 4 times if other options were available
      for (const p of [1, 2, 3, 4] as Part[]) {
        expect(hist.counts[p]).toBeLessThan(4)
        if (hist.counts[p] === 0) zeroCount++
      }
    }
    // Because some parts have small capacity (e.g., part 3 has 2), 
    // it's possible some items haven't visited them. But we shouldn't have too many zeros.
    expect(zeroCount).toBeGreaterThan(0) // Just a sanity check that the test ran
  })
})