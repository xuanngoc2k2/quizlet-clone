import { parseImportFile, parseJSON, parseCSV, normalizeType } from "./set-import"
import { describe, it, expect } from "vitest"

describe("parseCSV", () => {
  it("parses basic term,definition rows", () => {
    const result = parseCSV("hello,xin chào\nbook,sách")
    expect(result.cards).toHaveLength(2)
    expect(result.cards[0]).toEqual({ term: "hello", definition: "xin chào", type: "vocabulary" })
    expect(result.cards[1].term).toBe("book")
    expect(result.skipped).toBe(0)
  })

  it("reads type from third column and normalizes it", () => {
    const result = parseCSV("a,b,vocabulary\nc,d,grammar")
    expect(result.cards.map((c) => c.type)).toEqual(["vocabulary", "grammar"])
  })

  it("normalizes grammar type in Vietnamese", () => {
    const result = parseCSV("a,b,ngữ pháp")
    expect(result.cards[0].type).toBe("grammar")
  })

  it("skips a header row", () => {
    const result = parseCSV("Term,Definition\nx,y")
    expect(result.cards).toHaveLength(1)
    expect(result.cards[0]).toEqual({ term: "x", definition: "y", type: "vocabulary" })
  })

  it("handles quoted fields containing commas", () => {
    const result = parseCSV('"hello, world",def')
    expect(result.cards[0].term).toBe("hello, world")
  })

  it("handles escaped double quotes", () => {
    const result = parseCSV('"say ""hi""",def')
    expect(result.cards[0].term).toBe('say "hi"')
  })

  it("handles multiline quoted fields", () => {
    const result = parseCSV('"line one\nline two",def')
    expect(result.cards[0].term).toBe("line one\nline two")
  })

  it("skips rows missing term or definition", () => {
    const result = parseCSV("a,b\n,missing-term\n,,\nd,e")
    expect(result.cards).toHaveLength(2)
    expect(result.skipped).toBe(1)
  })

  it("strips UTF-8 BOM", () => {
    const result = parseCSV("\uFEFFa,b")
    expect(result.cards[0].term).toBe("a")
  })
})

describe("parseJSON", () => {
  it("parses an array of { term, definition }", () => {
    const result = parseJSON('[{"term":"a","definition":"b"},{"term":"c","definition":"d"}]')
    expect(result.cards).toHaveLength(2)
    expect(result.cards[0].type).toBe("vocabulary")
  })

  it("honors type field", () => {
    const result = parseJSON('[{"term":"a","definition":"b","type":"grammar"}]')
    expect(result.cards[0].type).toBe("grammar")
  })

  it("supports capitalized keys and a cards wrapper", () => {
    const result = parseJSON('{"cards":[{"Term":"a","Definition":"b","Type":"grammar"}]}')
    expect(result.cards[0]).toEqual({ term: "a", definition: "b", type: "grammar" })
  })

  it("skips objects missing term or definition", () => {
    const result = parseJSON('[{"term":"a","definition":"b"},{"term":""},{"definition":"x"},42]')
    expect(result.cards).toHaveLength(1)
    expect(result.skipped).toBe(3)
  })

  it("returns an error for invalid JSON", () => {
    const result = parseJSON("{not valid json")
    expect(result.cards).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it("returns an error when root is not an array", () => {
    const result = parseJSON('{"foo":"bar"}')
    expect(result.cards).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe("parseImportFile", () => {
  it("routes by extension", () => {
    expect(parseImportFile("x.csv", "a,b").cards).toHaveLength(1)
    expect(parseImportFile("x.json", '[{"term":"a","definition":"b"}]').cards).toHaveLength(1)
  })

  it("falls back to CSV for unknown extensions", () => {
    expect(parseImportFile("data.txt", "a,b").cards[0].term).toBe("a")
  })
})

describe("normalizeType", () => {
  it("maps grammar variants and defaults to vocabulary", () => {
    expect(normalizeType("GRAMMAR")).toBe("grammar")
    expect(normalizeType("Ngữ pháp")).toBe("grammar")
    expect(normalizeType("")).toBe("vocabulary")
    expect(normalizeType("anything")).toBe("vocabulary")
    expect(normalizeType(undefined)).toBe("vocabulary")
  })
})