export type QuestionMeta = { id: number; part: number; itemId: string; itemType?: "vocabulary" | "grammar" }

export type AttemptResult = {
  questionId: number
  isCorrect: boolean
  score?: number
  userAnswer?: string
  correctAnswer?: string
  explanation?: string
}

export type Attempt = { results: AttemptResult[] }

export type HistoryInput = {
  sections: { questions: { id: number; part: number; itemType?: "vocabulary" | "grammar" }[] }[]
  questionItemMap: Record<string, string>
  attempts: Attempt[]
}

export type ItemStat = {
  itemId: string
  timesSeen: number
  timesCorrect: number
  correctRate: number
  lastCorrect: boolean
}

export type TypeStat = { correct: number; total: number }

export type Summary = {
  overall: TypeStat
  vocabulary: TypeStat
  grammar: TypeStat
  parts: Record<1 | 2 | 3 | 4, TypeStat>
}

export type WeakItemsResult = {
  items: ItemStat[]
  summary: Summary
  weakIds: string[]
}

export function isCorrectForResult(r: AttemptResult): boolean {
  return r.isCorrect === true || (typeof r.score === "number" && r.score >= 5)
}

export function computeWeakStats(histories: HistoryInput[]): WeakItemsResult {
  const seen = new Map<string, number>()
  const correct = new Map<string, number>()
  const lastCorrect = new Map<string, boolean>()

  const summary: Summary = {
    overall: { correct: 0, total: 0 },
    vocabulary: { correct: 0, total: 0 },
    grammar: { correct: 0, total: 0 },
    parts: { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 }, 4: { correct: 0, total: 0 } },
  }

  for (const history of histories) {
    const metaByQid = new Map<number, QuestionMeta>()
    for (const section of history.sections) {
      for (const q of section.questions) {
        const itemId = history.questionItemMap[String(q.id)]
        if (!itemId) continue
        metaByQid.set(q.id, { id: q.id, part: q.part, itemId, itemType: q.itemType })
      }
    }

    for (const attempt of history.attempts) {
      for (const r of attempt.results) {
        const meta = metaByQid.get(r.questionId)
        if (!meta) continue
        const ok = isCorrectForResult(r)
        const part = (meta.part >= 1 && meta.part <= 4 ? meta.part : 1) as 1 | 2 | 3 | 4

        seen.set(meta.itemId, (seen.get(meta.itemId) ?? 0) + 1)
        if (ok) correct.set(meta.itemId, (correct.get(meta.itemId) ?? 0) + 1)
        lastCorrect.set(meta.itemId, ok)

        summary.overall.total++
        if (ok) summary.overall.correct++
        const type = meta.itemType ?? "vocabulary"
        summary[type].total++
        if (ok) summary[type].correct++
        summary.parts[part].total++
        if (ok) summary.parts[part].correct++
      }
    }
  }

  const items: ItemStat[] = [...seen.entries()].map(([itemId, timesSeen]) => {
    const timesCorrect = correct.get(itemId) ?? 0
    return {
      itemId,
      timesSeen,
      timesCorrect,
      correctRate: timesSeen > 0 ? timesCorrect / timesSeen : 0,
      lastCorrect: lastCorrect.get(itemId) ?? false,
    }
  })

  items.sort((a, b) => a.correctRate - b.correctRate || b.timesSeen - a.timesSeen)

  const weakIds = items.filter((it) => it.correctRate < 0.7).map((it) => it.itemId)

  return { items, summary, weakIds }
}
