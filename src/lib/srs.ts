/**
 * Spaced Repetition System — SM-2 Algorithm
 *
 * Rating scale:
 *   0 = Again  (Quên hoàn toàn)
 *   1 = Hard   (Nhớ nhưng khó)
 *   2 = Good   (Nhớ tốt)
 *   3 = Easy   (Quá dễ)
 *
 * State:
 *   "new"      — chưa học lần nào
 *   "learning" — đang trong giai đoạn học (interval < 1 ngày)
 *   "review"   — đã qua giai đoạn learning, ôn theo khoảng cách dài
 */

export type SrsRating = 0 | 1 | 2 | 3
export type SrsState = "new" | "learning" | "review"

export interface SrsCard {
  srsInterval: number  // phút
  srsEase: number      // hệ số dễ (mặc định 2.5)
  srsLapses: number    // số lần quên
  srsState: SrsState
}

export interface SrsResult {
  srsInterval: number
  srsEase: number
  srsLapses: number
  srsState: SrsState
  srsDue: Date
}

const MIN_EASE = 1.3

// Các khoảng học ban đầu (phút) cho giai đoạn "learning"
const LEARNING_STEPS = [1, 10] // 1 phút → 10 phút
const GRADUATING_INTERVAL = 1440 // 1 ngày (phút) khi tốt nghiệp từ learning
const EASY_INTERVAL = 4 * 1440  // 4 ngày khi Easy từ learning

/**
 * Tính toán SRS mới dựa trên đánh giá của người dùng.
 */
export function calculateSRS(card: SrsCard, rating: SrsRating): SrsResult {
  const now = new Date()
  let { srsInterval, srsEase, srsLapses, srsState } = card

  if (srsState === "new" || srsState === "learning") {
    // ─── Giai đoạn Learning ───────────────────────────────────────────────
    if (rating === 0) {
      // Again: reset về bước đầu tiên
      srsInterval = LEARNING_STEPS[0]
      srsState = "learning"
    } else if (rating === 1) {
      // Hard: ở lại bước hiện tại
      const idx = LEARNING_STEPS.findIndex((s) => s >= srsInterval)
      srsInterval = LEARNING_STEPS[Math.max(0, idx)]
      srsState = "learning"
    } else if (rating === 2) {
      // Good: tiến lên bước kế tiếp, hoặc tốt nghiệp sang review
      const currentIdx = LEARNING_STEPS.findIndex((s) => s >= srsInterval)
      if (currentIdx >= LEARNING_STEPS.length - 1) {
        // Tốt nghiệp
        srsInterval = GRADUATING_INTERVAL
        srsState = "review"
      } else {
        srsInterval = LEARNING_STEPS[currentIdx + 1]
        srsState = "learning"
      }
    } else {
      // Easy: tốt nghiệp ngay với khoảng dài
      srsInterval = EASY_INTERVAL
      srsEase = Math.min(srsEase + 0.15, 5)
      srsState = "review"
    }
  } else {
    // ─── Giai đoạn Review ────────────────────────────────────────────────
    if (rating === 0) {
      // Again: Lapse — reset về learning
      srsLapses += 1
      srsInterval = LEARNING_STEPS[0]
      srsEase = Math.max(srsEase - 0.2, MIN_EASE)
      srsState = "learning"
    } else if (rating === 1) {
      // Hard: interval * 1.2, ease giảm
      srsInterval = Math.round(srsInterval * 1.2)
      srsEase = Math.max(srsEase - 0.15, MIN_EASE)
      srsState = "review"
    } else if (rating === 2) {
      // Good: interval * ease
      srsInterval = Math.round(srsInterval * srsEase)
      srsState = "review"
    } else {
      // Easy: interval * ease * 1.3, ease tăng
      srsInterval = Math.round(srsInterval * srsEase * 1.3)
      srsEase = Math.min(srsEase + 0.15, 5)
      srsState = "review"
    }
  }

  const srsDue = new Date(now.getTime() + srsInterval * 60 * 1000)

  return { srsInterval, srsEase, srsLapses, srsState, srsDue }
}

/**
 * Trả về label preview thời gian hiển thị trên mỗi nút.
 * VD: "10m", "1d", "4d"
 */
export function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`
  if (minutes < 43200) return `${Math.round(minutes / 1440)}d`
  return `${Math.round(minutes / 43200)}mo`
}

/**
 * Tính preview interval cho 4 nút dựa trên card hiện tại.
 */
export function getButtonPreviews(card: SrsCard): Record<SrsRating, string> {
  return {
    0: formatInterval(calculateSRS(card, 0).srsInterval),
    1: formatInterval(calculateSRS(card, 1).srsInterval),
    2: formatInterval(calculateSRS(card, 2).srsInterval),
    3: formatInterval(calculateSRS(card, 3).srsInterval),
  }
}
