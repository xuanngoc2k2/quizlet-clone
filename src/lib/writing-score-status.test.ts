import { describe, expect, test } from "vitest"
import { getWritingScoreStatus } from "./writing-score-status"

describe("getWritingScoreStatus", () => {
  test.each([
    [0, null, "not-started", "Chưa làm"],
    [1, null, "ungraded", "Chưa có điểm"],
    [1, 0, "low", "Cần ôn lại"],
    [1, 14, "low", "Cần ôn lại"],
    [1, 15, "needs-practice", "Cần cải thiện"],
    [2, 20, "needs-practice", "Cần cải thiện"],
    [2, 21, "good", "Khá tốt"],
    [3, 25, "good", "Khá tốt"],
    [3, 26, "excellent", "Rất tốt"],
    [5, 30, "excellent", "Rất tốt"],
  ])("maps %i attempts and score %s to %s", (attemptCount, latestScore, status, label) => {
    const result = getWritingScoreStatus(attemptCount, latestScore)

    expect(result.status).toBe(status)
    expect(result.label).toBe(label)
    expect(result.cardClassName).toContain("bg-")
    expect(result.badgeClassName).toContain("text-")
  })
})
