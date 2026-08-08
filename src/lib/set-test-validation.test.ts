import { describe, it, expect } from "vitest"
import {
  buildValidationPrompt,
  getOptionIndex,
  needsBlankValidation,
  questionIsValid,
  reconstructSentence,
  validationBatchSchema,
} from "./set-test-validation"

const BUG_QUESTION = "주말에는 집에서 쉬거나 친구를 ____ 만나요."
const BUG_OPTIONS = ["만나거나", "만나려고", "만나느라고", "만나도록"]

describe("reconstructSentence", () => {
  it("replaces the blank with the option (bug example)", () => {
    expect(reconstructSentence(BUG_QUESTION, "만나려고")).toBe(
      "주말에는 집에서 쉬거나 친구를 만나려고 만나요.",
    )
    expect(reconstructSentence(BUG_QUESTION, "만나거나")).toBe(
      "주말에는 집에서 쉬거나 친구를 만나거나 만나요.",
    )
  })

  it("supports multiple blank markers", () => {
    expect(reconstructSentence("A ____ và ____ B", "X")).toBe("A X và X B")
  })

  it("leaves text without blank unchanged", () => {
    expect(reconstructSentence("저는 학생입니다.", "X")).toBe("저는 학생입니다.")
  })
})

describe("getOptionIndex", () => {
  it("finds the exact option", () => {
    expect(getOptionIndex(BUG_OPTIONS, "만나려고")).toBe(1)
  })

  it("returns -1 when missing or undefined inputs", () => {
    expect(getOptionIndex(BUG_OPTIONS, "없는옵션")).toBe(-1)
    expect(getOptionIndex(undefined, "x")).toBe(-1)
    expect(getOptionIndex(BUG_OPTIONS, undefined)).toBe(-1)
  })
})

describe("needsBlankValidation", () => {
  it("only flags Part 1 questions with options and a blank", () => {
    expect(needsBlankValidation(1, BUG_OPTIONS, BUG_QUESTION)).toBe(true)
    expect(needsBlankValidation(2, undefined, "divide (단어)")).toBe(false)
    expect(needsBlankValidation(3, ["a", "b", "c", "d"], "서로 의미가 같은 문장을 고르세요.")).toBe(false)
    expect(needsBlankValidation(1, [], BUG_QUESTION)).toBe(false)
    expect(needsBlankValidation(1, BUG_OPTIONS, "저는 학생입니다.")).toBe(false)
  })
})

describe("questionIsValid", () => {
  it("accepts a question when validator confirms exactly the correct index", () => {
    expect(
      questionIsValid(BUG_QUESTION, BUG_OPTIONS, "만나려고", {
        isValid: true,
        correctAnswerIndex: 1,
        issues: [],
      }),
    ).toBe(true)
  })

  it("rejects when validator marks it invalid", () => {
    expect(
      questionIsValid(BUG_QUESTION, BUG_OPTIONS, "만나려고", {
        isValid: false,
        correctAnswerIndex: -1,
        issues: ["reconstructed sentence is broken"],
      }),
    ).toBe(false)
  })

  it("rejects when the validator picks a different correct answer (generated answer is wrong)", () => {
    expect(
      questionIsValid(BUG_QUESTION, BUG_OPTIONS, "만나려고", {
        isValid: true,
        correctAnswerIndex: 2,
        issues: [],
      }),
    ).toBe(false)
  })

  it("rejects when the correct answer is not among the options", () => {
    expect(
      questionIsValid(BUG_QUESTION, BUG_OPTIONS, "없는옵션", {
        isValid: true,
        correctAnswerIndex: 1,
        issues: [],
      }),
    ).toBe(false)
  })

  it("rejects when options contain duplicates", () => {
    expect(
      questionIsValid(BUG_QUESTION, ["가", "가", "나", "다"], "가", {
        isValid: true,
        correctAnswerIndex: 0,
        issues: [],
      }),
    ).toBe(false)
  })

  it("rejects when the question has no blank", () => {
    expect(
      questionIsValid("저는 학생입니다.", BUG_OPTIONS, "만나려고", {
        isValid: true,
        correctAnswerIndex: 1,
        issues: [],
      }),
    ).toBe(false)
  })
})

describe("buildValidationPrompt", () => {
  it("embeds target, question, options and reconstructed sentences", () => {
    const prompt = buildValidationPrompt([
      {
        itemKey: "item_1",
        question: BUG_QUESTION,
        options: BUG_OPTIONS,
        target: "-거나",
      },
    ])
    expect(prompt).toContain("item_1")
    expect(prompt).toContain("-거나")
    expect(prompt).toContain(BUG_QUESTION)
    expect(prompt).toContain("reconstructed 1: 주말에는 집에서 쉬거나 친구를 만나려고 만나요.")
  })
})

describe("validationBatchSchema", () => {
  it("parses a valid batch", () => {
    const parsed = validationBatchSchema.parse({
      results: [
        { itemKey: "item_1", isValid: false, correctAnswerIndex: -1, issues: ["broken"] },
      ],
    })
    expect(parsed.results[0].itemKey).toBe("item_1")
  })

  it("rejects unknown result keys", () => {
    expect(() =>
      validationBatchSchema.parse({ results: [{ itemKey: "x", isValid: true, unknown: 1 }] }),
    ).toThrow()
  })
})
