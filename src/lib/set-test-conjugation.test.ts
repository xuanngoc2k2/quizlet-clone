import { describe, it, expect } from "vitest"
import {
  normalizeConjugationAnswer,
  extractBaseWord,
  needsConjugationValidation,
  reconstructConjugationSentence,
  conjugationAnswerLeaks,
  parseAcceptableAnswers,
  findReferenceConjugation,
  checkConjugationMorphology,
  buildTransformation,
  CONJUGATION_REFERENCE,
  conjugationQuestionIsValid,
  type ConjugationValidationOutcome,
} from "./set-test-conjugation"

describe("normalizeConjugationAnswer", () => {
  it("trims whitespace", () => {
    expect(normalizeConjugationAnswer("  그런지  ")).toBe("그런지")
  })

  it("collapses internal spaces", () => {
    expect(normalizeConjugationAnswer("공부 하고 있습니다")).toBe("공부 하고 있습니다")
    expect(normalizeConjugationAnswer("공부  하고   있습니다")).toBe("공부 하고 있습니다")
  })

  it("does NOT fix grammar", () => {
    expect(normalizeConjugationAnswer("그렇지")).toBe("그렇지")
  })
})

describe("extractBaseWord", () => {
  it("extracts word in parentheses", () => {
    expect(extractBaseWord("월요일이라 (그렇다) ____ 사람이 많네요.")).toBe("그렇다")
  })

  it("returns null when no parentheses", () => {
    expect(extractBaseWord("저는 매일 아침 일찍 ____ 학교에 갑니다.")).toBeNull()
  })
})

describe("needsConjugationValidation", () => {
  it("true for Part 2 with base word + blank", () => {
    expect(needsConjugationValidation(2, "월요일이라 (그렇다) ____ 사람이 많네요.")).toBe(true)
  })

  it("false for Part 1", () => {
    expect(needsConjugationValidation(1, "월요일이라 (그렇다) ____ 사람이 많네요.")).toBe(false)
  })

  it("false when no blank", () => {
    expect(needsConjugationValidation(2, "월요일이라 (그렇다) 사람이 많네요.")).toBe(false)
  })

  it("false when no question", () => {
    expect(needsConjugationValidation(2, undefined)).toBe(false)
  })
})

describe("reconstructConjugationSentence", () => {
  it("replaces base word marker + blank with the answer", () => {
    expect(reconstructConjugationSentence("월요일이라 (그렇다) ____ 사람이 많네요.", "그런지")).toBe(
      "월요일이라 그런지 사람이 많네요.",
    )
  })

  it("handles trailing blank", () => {
    expect(reconstructConjugationSentence("시험을 잘 보기 위해 열심히 (공부하다) ____.", "공부하고 있습니다")).toBe(
      "시험을 잘 보기 위해 열심히 공부하고 있습니다.",
    )
  })
})

describe("conjugationAnswerLeaks", () => {
  it("false when answer only appears via the blank (good question)", () => {
    expect(conjugationAnswerLeaks("한국어는 (배우다) ____ 실력이 빨리 늘 거예요.", "배우면")).toBe(false)
    expect(conjugationAnswerLeaks("월요일이라 (그렇다) ____ 사람이 많네요.", "그런지")).toBe(false)
  })

  it("true when answer already appears before the parenthetical base word (duplication)", () => {
    expect(conjugationAnswerLeaks("한국어는 배우면 (배우다) ____ 실력이 빨리 늘 거예요.", "배우면")).toBe(true)
  })

  it("true when answer already appears right after the blank", () => {
    expect(conjugationAnswerLeaks("아침에 (맑다) ____ 맑아서 기분이 좋아요.", "맑아서")).toBe(true)
  })

  it("false when answer appears in the question but NOT adjacent to the blank", () => {
    expect(conjugationAnswerLeaks("한국어를 (배우다) ____ 그리고 배우면 좋아요.", "배우면")).toBe(false)
  })

  it("false when the answer is only a substring of a larger word adjacent to the blank", () => {
    expect(conjugationAnswerLeaks("학생들은 (배우다) ____서 기억합니다.", "배우면")).toBe(false)
  })

  it("false when no blank", () => {
    expect(conjugationAnswerLeaks("한국어는 배우면 (배우다) 실력이 늘 거예요.", "배우면")).toBe(false)
  })
})

describe("parseAcceptableAnswers", () => {
  it("splits on semicolons", () => {
    expect(parseAcceptableAnswers("공부합니다; 공부하고 있습니다")).toEqual(["공부합니다", "공부하고 있습니다"])
  })

  it("returns single answer", () => {
    expect(parseAcceptableAnswers("그런지")).toEqual(["그런지"])
  })

  it("splits on pipes and trims", () => {
    expect(parseAcceptableAnswers("한 | 해서")).toEqual(["한", "해서"])
  })
})

describe("CONJUGATION_REFERENCE", () => {
  it("covers all required test-case patterns from spec §9", () => {
    const required: [string, string, string][] = [
      ["하다", "-는", "하는"],
      ["하다", "-ㄴ", "한"],
      ["하다", "-아서/어서", "해서"],
      ["하다", "-려고", "하려고"],
      ["먹다", "-는", "먹는"],
      ["먹다", "-ㄴ", "먹은"],
      ["먹다", "-아서/어서", "먹어서"],
      ["먹다", "-다가", "먹다가"],
      ["가다", "-는", "가는"],
      ["가다", "-ㄴ", "간"],
      ["가다", "-아서/어서", "가서"],
      ["가다", "-려고", "가려고"],
      ["그렇다", "-ㄴ", "그런"],
      ["그렇다", "-ㄴ지", "그런지"],
      ["그렇다", "-아서/어서", "그래서"],
      ["맑다", "-은", "맑은"],
      ["맑다", "-다가", "맑다가"],
      ["맑다", "-아서/어서", "맑아서"],
      ["듣다", "-는", "듣는"],
      ["듣다", "-은", "들은"],
      ["듣다", "-아서/어서", "들어서"],
      ["걷다", "-는", "걷는"],
      ["걷다", "-은", "걸은"],
      ["걷다", "-아서/어서", "걸어서"],
      ["돕다", "-는", "돕는"],
      ["돕다", "-은", "도운"],
      ["돕다", "-아서/어서", "도와서"],
    ]
    for (const [base, target, correct] of required) {
      const entry = findReferenceConjugation(base, target)
      expect(entry, `${base} + ${target}`).toBeDefined()
      expect(entry!.correct).toBe(correct)
    }
  })
})

describe("checkConjugationMorphology", () => {
  it("accepts correct reference conjugation", () => {
    expect(checkConjugationMorphology("그렇다", "-ㄴ지", "그런지")).toEqual({ known: true, ok: true, expected: "그런지" })
  })

  it("rejects wrong conjugation variants for 그렇다 + -ㄴ지", () => {
    for (const wrong of ["그렇는지", "그렇은지", "그렇지"]) {
      expect(checkConjugationMorphology("그렇다", "-ㄴ지", wrong)).toEqual({ known: true, ok: false, expected: "그런지" })
    }
  })

  it("rejects wrong variants for 맑다 + -다가", () => {
    for (const wrong of ["맑는다", "맑아서", "맑으면"]) {
      expect(checkConjugationMorphology("맑다", "-다가", wrong)).toEqual({ known: true, ok: false, expected: "맑다가" })
    }
  })

  it("accepts 맑다가 for 맑다 + -다가", () => {
    expect(checkConjugationMorphology("맑다", "-다가", "맑다가")).toEqual({ known: true, ok: true, expected: "맑다가" })
  })

  it("handles irregular 돕다 + -은 → 도운", () => {
    expect(checkConjugationMorphology("돕다", "-은", "도운")).toEqual({ known: true, ok: true, expected: "도운" })
    expect(checkConjugationMorphology("돕다", "-은", "돕은")).toEqual({ known: true, ok: false, expected: "도운" })
  })

  it("returns unknown for unlisted pattern", () => {
    expect(checkConjugationMorphology("가다", "-자마자", "가자마자")).toEqual({ known: false, ok: false })
  })
})

describe("buildTransformation", () => {
  it("builds transformation string", () => {
    expect(buildTransformation("그렇다", "-ㄴ지", "그런지")).toBe("그렇다 + -ㄴ지 → 그런지")
  })
})

describe("conjugationQuestionIsValid", () => {
  const outcome: ConjugationValidationOutcome = {
    isValid: true,
    correctAnswer: "그런지",
    expectedAnswers: ["그런지"],
    issues: [],
  }

  it("true when outcome valid and matches", () => {
    expect(conjugationQuestionIsValid("월요일이라 (그렇다) ____ 사람이 많네요.", "그런지", outcome)).toBe(true)
  })

  it("false when outcome invalid", () => {
    expect(conjugationQuestionIsValid("월요일이라 (그렇다) ____ 사람이 많네요.", "그런지", { ...outcome, isValid: false })).toBe(false)
  })

  it("false when answer mismatch", () => {
    expect(conjugationQuestionIsValid("월요일이라 (그렇다) ____ 사람이 많네요.", "그렇지", outcome)).toBe(false)
  })

  it("false when the answer already appears adjacent to the blank (duplication)", () => {
    const leaked: ConjugationValidationOutcome = {
      isValid: true,
      correctAnswer: "배우면",
      expectedAnswers: ["배우면"],
      issues: [],
    }
    expect(conjugationQuestionIsValid("한국어는 배우면 (배우다) ____ 실력이 빨리 늘 거예요.", "배우면", leaked)).toBe(false)
    expect(conjugationQuestionIsValid("한국어는 (배우다) ____ 실력이 빨리 늘 거예요.", "배우면", leaked)).toBe(true)
  })

  it("false when not a conjugation blank question", () => {
    expect(conjugationQuestionIsValid("저는 (그렇다) 사람이 많네요.", "그런지", outcome)).toBe(false)
  })

  it("false when no outcome", () => {
    expect(conjugationQuestionIsValid("월요일이라 (그렇다) ____ 사람이 많네요.", "그런지", undefined)).toBe(false)
  })
})

describe("CONJUGATION_REFERENCE integrity", () => {
  it("has unique base+target pairs and no empty fields", () => {
    const seen = new Set<string>()
    for (const r of CONJUGATION_REFERENCE) {
      const key = `${r.base}|${r.target}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
      expect(r.base.length).toBeGreaterThan(0)
      expect(r.target.length).toBeGreaterThan(0)
      expect(r.correct.length).toBeGreaterThan(0)
    }
  })
})
