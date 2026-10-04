export type WritingScoreStatus =
  "not-started" | "ungraded" | "low" | "needs-practice" | "good" | "excellent"

export type WritingScoreStatusStyle = {
  status: WritingScoreStatus
  cardClassName: string
  badgeClassName: string
  label: string
}

export function getWritingScoreStatus(
  attemptCount: number,
  latestScore: number | null,
): WritingScoreStatusStyle {
  if (attemptCount === 0) {
    return {
      status: "not-started",
      cardClassName: "border-red-200 bg-red-50",
      badgeClassName: "bg-red-100 text-red-700",
      label: "Chưa làm",
    }
  }

  if (latestScore === null) {
    return {
      status: "ungraded",
      cardClassName: "border-amber-200 bg-amber-50",
      badgeClassName: "bg-amber-100 text-amber-700",
      label: "Chưa có điểm",
    }
  }

  if (latestScore < 15) {
    return {
      status: "low",
      cardClassName: "border-red-200 bg-red-50",
      badgeClassName: "bg-red-100 text-red-700",
      label: "Cần ôn lại",
    }
  }

  if (latestScore <= 20) {
    return {
      status: "needs-practice",
      cardClassName: "border-orange-200 bg-orange-50",
      badgeClassName: "bg-orange-100 text-orange-700",
      label: "Cần cải thiện",
    }
  }

  if (latestScore <= 25) {
    return {
      status: "good",
      cardClassName: "border-emerald-200 bg-emerald-50",
      badgeClassName: "bg-emerald-100 text-emerald-700",
      label: "Khá tốt",
    }
  }

  return {
    status: "excellent",
    cardClassName: "border-teal-400 bg-teal-100",
    badgeClassName: "bg-teal-300 text-teal-900",
    label: "Rất tốt",
  }
}
