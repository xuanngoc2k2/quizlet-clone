export type Part = 1 | 2 | 3 | 4
export type CardType = "vocabulary" | "grammar"

const PART_WEIGHTS: Record<Part, number> = { 1: 5, 2: 5, 3: 2, 4: 3 }
const MIN_SUM = 15
const PARTS: Part[] = [1, 2, 3, 4]

export type Distribution = Record<Part, number>

/**
 * Tính số câu cho mỗi part sao cho tổng = total.
 * - total >= 15: giữ tối thiểu Part1>=5, Part2>=5, Part3>=2, Part4>=3 (chuẩn MIN_SUM).
 * - total < 15: scale theo tỉ lệ, mỗi part có >= 1 câu (nếu total >= 4).
 */
export function computePartCounts(total: number): Distribution {
  if (!Number.isInteger(total) || total < 1) {
    throw new Error(`Invalid total: ${total}`)
  }

  const raw = PARTS.map((p) => (total * PART_WEIGHTS[p]) / MIN_SUM)
  const counts = raw.map(Math.floor) as number[]
  let remaining = total - counts.reduce((a, b) => a + b, 0)

  if (total < MIN_SUM) {
    for (const p of PARTS) {
      if (counts[p - 1] < 1) {
        counts[p - 1] += 1
        remaining -= 1
      }
    }
  }

  if (remaining > 0) {
    const order = PARTS.map((p, i) => ({ part: p, frac: raw[i] - counts[i] })).sort(
      (a, b) => b.frac - a.frac || a.part - b.part,
    )
    for (let i = 0; i < remaining; i++) {
      counts[order[i].part - 1] += 1
    }
  }

  if (remaining < 0) {
    const order = PARTS.map((p, i) => ({ part: p, frac: counts[i] - raw[i] })).sort(
      (a, b) => b.frac - a.frac || a.part - b.part,
    )
    for (let i = 0; i < -remaining; i++) {
      counts[order[i].part - 1] -= 1
    }
  }

  const result = {} as Distribution
  PARTS.forEach((p, i) => (result[p] = counts[i]))
  return result
}

export const DIFFICULTY_MIX = { easy: 0.2, medium: 0.5, hard: 0.3 }

export type Difficulty = keyof typeof DIFFICULTY_MIX

/** Số câu theo mức độ khó, làm tròn hợp lý theo tổng. */
export function computeDifficultyCounts(total: number): Record<Difficulty, number> {
  const raw = {
    easy: total * DIFFICULTY_MIX.easy,
    medium: total * DIFFICULTY_MIX.medium,
    hard: total * DIFFICULTY_MIX.hard,
  }
  const counts = {
    easy: Math.floor(raw.easy),
    medium: Math.floor(raw.medium),
    hard: Math.floor(raw.hard),
  }
  let remaining = total - (counts.easy + counts.medium + counts.hard)
  const order: Difficulty[] = ["medium", "easy", "hard"]
  for (const d of order) {
    while (remaining > 0 && counts[d] < Math.ceil(raw[d])) {
      counts[d] += 1
      remaining -= 1
    }
  }
  for (const d of order) {
    if (remaining > 0) {
      counts[d] += remaining
      remaining = 0
    }
  }
  return counts
}

/** Type ưu tiên cho từng part (theo spec §7). */
export const PART_TYPE_PREFERENCE: Record<Part, { primary: CardType; secondary: CardType }> = {
  1: { primary: "grammar", secondary: "vocabulary" },
  2: { primary: "vocabulary", secondary: "grammar" },
  3: { primary: "grammar", secondary: "vocabulary" },
  4: { primary: "vocabulary", secondary: "grammar" },
}
