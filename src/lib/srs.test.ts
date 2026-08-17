import { describe, it, expect } from "vitest"
import { calculateSRS, formatInterval, getButtonPreviews } from "./srs"
import type { SrsCard } from "./srs"

const newCard: SrsCard = {
  srsInterval: 0,
  srsEase: 2.5,
  srsLapses: 0,
  srsState: "new",
}

const reviewCard: SrsCard = {
  srsInterval: 1440, // 1 ngày
  srsEase: 2.5,
  srsLapses: 0,
  srsState: "review",
}

describe("calculateSRS — Learning phase", () => {
  it("Again từ new → state=learning, interval=1m", () => {
    const result = calculateSRS(newCard, 0)
    expect(result.srsState).toBe("learning")
    expect(result.srsInterval).toBe(1)
  })

  it("Good từ new (interval=0) → state=learning, interval=10m", () => {
    const result = calculateSRS(newCard, 2)
    expect(result.srsState).toBe("learning")
    expect(result.srsInterval).toBe(10)
  })

  it("Good từ learning step cuối → tốt nghiệp sang review (1 ngày)", () => {
    const learningCard: SrsCard = { ...newCard, srsState: "learning", srsInterval: 10 }
    const result = calculateSRS(learningCard, 2)
    expect(result.srsState).toBe("review")
    expect(result.srsInterval).toBe(1440)
  })

  it("Easy từ new → tốt nghiệp ngay (4 ngày)", () => {
    const result = calculateSRS(newCard, 3)
    expect(result.srsState).toBe("review")
    expect(result.srsInterval).toBe(4 * 1440)
    expect(result.srsEase).toBeGreaterThan(2.5)
  })
})

describe("calculateSRS — Review phase", () => {
  it("Good từ review → interval nhân với ease", () => {
    const result = calculateSRS(reviewCard, 2)
    expect(result.srsState).toBe("review")
    expect(result.srsInterval).toBe(Math.round(1440 * 2.5))
  })

  it("Hard từ review → interval nhân 1.2, ease giảm", () => {
    const result = calculateSRS(reviewCard, 1)
    expect(result.srsState).toBe("review")
    expect(result.srsInterval).toBe(Math.round(1440 * 1.2))
    expect(result.srsEase).toBeLessThan(2.5)
  })

  it("Easy từ review → interval nhân ease * 1.3, ease tăng", () => {
    const result = calculateSRS(reviewCard, 3)
    expect(result.srsState).toBe("review")
    expect(result.srsInterval).toBe(Math.round(1440 * 2.5 * 1.3))
    expect(result.srsEase).toBeGreaterThan(2.5)
  })

  it("Again từ review → Lapse, state=learning, lapses tăng, ease giảm", () => {
    const result = calculateSRS(reviewCard, 0)
    expect(result.srsState).toBe("learning")
    expect(result.srsLapses).toBe(1)
    expect(result.srsEase).toBeLessThan(2.5)
    expect(result.srsInterval).toBe(1) // reset về bước 1
  })

  it("Ease không được xuống dưới MIN_EASE=1.3", () => {
    const lowEaseCard: SrsCard = { ...reviewCard, srsEase: 1.3 }
    const result = calculateSRS(lowEaseCard, 0)
    expect(result.srsEase).toBeCloseTo(1.3)
  })
})

describe("formatInterval", () => {
  it("< 60 phút → hiển thị phút", () => {
    expect(formatInterval(1)).toBe("1m")
    expect(formatInterval(10)).toBe("10m")
  })

  it("≥ 60 phút → hiển thị giờ", () => {
    expect(formatInterval(120)).toBe("2h")
  })

  it("≥ 1440 phút → hiển thị ngày", () => {
    expect(formatInterval(1440)).toBe("1d")
    expect(formatInterval(4 * 1440)).toBe("4d")
  })
})

describe("getButtonPreviews", () => {
  it("Trả về 4 preview strings", () => {
    const previews = getButtonPreviews(newCard)
    expect(previews[0]).toBeDefined()
    expect(previews[1]).toBeDefined()
    expect(previews[2]).toBeDefined()
    expect(previews[3]).toBeDefined()
  })
})
