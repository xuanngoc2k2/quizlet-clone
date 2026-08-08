import { describe, it, expect } from "vitest"
import {
  canonicalGrammarKey,
  getOptionIndex,
  needsSynonymValidation,
  checkUnderlinePosition,
  synonymQuestionIsValid,
  type SynonymValidationOutcome,
} from "./set-test-synonym"

describe("checkUnderlinePosition", () => {
  it("finds exact substring", () => {
    const r = checkUnderlinePosition("학교에 가는 길에 편의점에 들렀어요.", "가는 길에")
    expect(r.found).toBe(true)
    expect(r.wholeSentence).toBe(false)
  })

  it("rejects when not a substring", () => {
    const r = checkUnderlinePosition("학교에 가는 길에 편의점에 들렀어요.", "가는 길에서")
    expect(r.found).toBe(false)
  })

  it("rejects when underlining the whole sentence", () => {
    const r = checkUnderlinePosition("학교에 가는 길에 편의점에 들렀어요.", "학교에 가는 길에 편의점에 들렀어요.")
    expect(r.found).toBe(true)
    expect(r.wholeSentence).toBe(true)
  })

  it("rejects empty underlined text", () => {
    expect(checkUnderlinePosition("아침을 먹어요.", "  ").found).toBe(false)
  })
})

describe("needsSynonymValidation", () => {
  it("true for Part 3 with underlined text", () => {
    expect(needsSynonymValidation(3, "가는 길에")).toBe(true)
  })
  it("false for Part 1", () => {
    expect(needsSynonymValidation(1, "가는 길에")).toBe(false)
  })
  it("false when no underlined text", () => {
    expect(needsSynonymValidation(3, undefined)).toBe(false)
  })
})

describe("canonicalGrammarKey", () => {
  it("strips dash, whitespace, parentheses", () => {
    expect(canonicalGrammarKey("-아/어야")).toBe("아/어야")
    expect(canonicalGrammarKey("-(으)면")).toBe("으면")
    expect(canonicalGrammarKey("-면")).toBe("면")
    expect(canonicalGrammarKey("-는 길에")).toBe("는길에")
  })
  it("is case-insensitive", () => {
    expect(canonicalGrammarKey(" -네요 ")).toBe(canonicalGrammarKey("-네요"))
  })
})

describe("getOptionIndex", () => {
  it("finds index", () => {
    expect(getOptionIndex(["a", "b", "c"], "b")).toBe(1)
  })
  it("returns -1 when missing", () => {
    expect(getOptionIndex(["a", "b", "c"], "z")).toBe(-1)
  })
})

describe("synonymQuestionIsValid", () => {
  const question = "학교에 가는 길에 편의점에 들렀어요."
  const options = [
    "학교에 도착해서 편의점에 들렀어요.",
    "학교에 가다가 편의점에 들렀어요.",
    "학교에 가려고 편의점에 들렀어요.",
    "학교에 가기 전에 편의점에 들렀어요.",
  ]
  const outcome: SynonymValidationOutcome = { isValid: true, correctAnswerIndex: 1, issues: [] }

  it("true when valid", () => {
    expect(synonymQuestionIsValid(question, options, options[1], "가는 길에", outcome)).toBe(true)
  })

  it("false when underline not found", () => {
    expect(synonymQuestionIsValid(question, options, options[1], "가는 길에서", outcome)).toBe(false)
  })

  it("false when underline covers whole sentence", () => {
    expect(synonymQuestionIsValid(question, options, options[1], question, outcome)).toBe(false)
  })

  it("false when outcome invalid", () => {
    expect(synonymQuestionIsValid(question, options, options[1], "가는 길에", { ...outcome, isValid: false })).toBe(false)
  })

  it("false when AI index differs from correctAnswer", () => {
    expect(synonymQuestionIsValid(question, options, options[2], "가는 길에", outcome)).toBe(false)
  })

  it("false when duplicate options", () => {
    expect(synonymQuestionIsValid(question, [options[0], options[0], options[2], options[3]], options[0], "가는 길에", outcome)).toBe(false)
  })

  it("false when no outcome", () => {
    expect(synonymQuestionIsValid(question, options, options[1], "가는 길에", undefined)).toBe(false)
  })
})
