import { describe, expect, test } from "vitest"
import { deserializeCells, tokenizeNumber, tokenizeWriting } from "./writing-serializer"

describe("TOPIK decimal number cell rules", () => {
  test.each([
    ["3.5", ["3.", "5"]],
    ["12.5", ["12", ".5"]],
    ["56.8", ["56", ".8"]],
    ["3.5", ["3.", "5"]],
    ["0.5", ["0.", "5"]],
    ["123.45", ["12", "3.", "45"]],
    ["123.456", ["12", "3.", "45", "6"]],
    ["2024", ["20", "24"]],
    ["300", ["30", "0"]],
  ])("tokenizes %s", (value, expected) => {
    expect(tokenizeNumber(value)).toEqual(expected)
  })

  test("does not treat a sentence period as a decimal point", () => {
    expect(tokenizeWriting("증가했다.")).toEqual(["증", "가", "했", "다", "."])
    expect(tokenizeWriting("2025.에")).toEqual(["20", "25", ".", "에"])
  })

  test("keeps decimal numbers next to units and sentence punctuation", () => {
    expect(tokenizeWriting("56.8%")).toEqual(["56", ".8", "%"])
    expect(tokenizeWriting("3.5%")).toEqual(["3.", "5", "%"])
    expect(tokenizeWriting("0.5%")).toEqual(["0.", "5", "%"])
    expect(tokenizeWriting("3.5% 증가했다.")).toEqual([
      "3.",
      "5",
      "%",
      " ",
      "증",
      "가",
      "했",
      "다",
      ".",
    ])
  })

  test("deserializes the important TOPIK writing example", () => {
    const cells = deserializeCells("조사 결과, 2020년 3.5%에서 2025년 12.8%로 증가했다.")
    expect(cells.slice(0, 31)).toEqual([
      "조",
      "사",
      " ",
      "결",
      "과",
      ",",
      " ",
      "20",
      "20",
      "년",
      " ",
      "3.",
      "5",
      "%",
      "에",
      "서",
      " ",
      "20",
      "25",
      "년",
      " ",
      "12",
      ".8",
      "%",
      "로",
      " ",
      "증",
      "가",
      "했",
      "다",
      ".",
    ])
  })
})