import { z } from "zod"
import { router, publicProcedure } from "../trpc"
import { prisma } from "../db"
import { callGeminiJSON } from "../lib/gemini"
import type { Prisma } from "@prisma/client"
import { computePartCounts, computeDifficultyCounts } from "@/lib/set-test-distribution"

const PART_NAMES: Record<number, string> = {
  1: "Phần 1: Chọn đáp án đúng để điền vào chỗ trống",
  2: "Phần 2: Chia dạng từ trong ngoặc",
  3: "Phần 3: Tìm câu đồng nghĩa",
  4: "Phần 4: Dịch câu tự luận",
}

const PART_INSTRUCTIONS: Record<number, string> = {
  1: "Chọn một đáp án phù hợp điền vào chỗ trống (____).",
  2: "Chia dạng đúng của từ trong ngoặc để hoàn thành câu.",
  3: "Chọn câu có nghĩa tương đương với câu đã cho.",
  4: "Dịch câu tiếng Việt sang tiếng Hàn.",
}

const PART_TYPE_FOR_PART: Record<number, QuestionType> = {
  1: "multiple-choice",
  2: "conjugation",
  3: "synonym",
  4: "translation",
}

const generatedQuestionSchema = z.object({
  itemKey: z.string(),
  part: z.number().int().min(1).max(4),
  difficulty: z.enum(["easy", "medium", "hard"]),
  question: z.string().min(1, "Question empty"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, "Correct answer empty"),
  meaningVi: z.string().optional(),
  optionExplanations: z.array(z.string()).optional(),
  explanation: z.string().min(1, "Explanation empty"),
  grammarHint: z.string().optional(),
})

const generatedTestSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  questions: z.array(generatedQuestionSchema).min(1),
})

type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>

type QuestionType = "multiple-choice" | "conjugation" | "synonym" | "translation"
type Difficulty = "easy" | "medium" | "hard"

type BuiltQuestion = {
  id: number
  part: 1 | 2 | 3 | 4
  type: QuestionType
  question: string
  options?: string[]
  grammarHint?: string
  correctAnswer: string
  explanation: string
  meaningVi?: string
  difficulty: Difficulty
  optionExplanations?: string[]
  itemId: string
  itemType: "vocabulary" | "grammar"
}

type SetItem = { key: string; id: string; term: string; type: "vocabulary" | "grammar"; definition: string }

function normalizeText(s: string): string {
  return s.replace(/\s+/g, "").replace(/[.,!?;:"'“”()（）___]/g, "").toLowerCase()
}

async function getPreviousQuestionTexts(deviceId: string, setId: string): Promise<string[]> {
  const histories = await prisma.testHistory.findMany({
    where: { deviceId, source: "set-test", setId },
    orderBy: { createdAt: "desc" },
    take: 15,
  })
  const texts: string[] = []
  for (const h of histories) {
    const sections = h.sections as { questions: { question: string }[] }[]
    for (const s of sections) for (const q of s.questions) texts.push(q.question)
  }
  return texts
}

function buildSetTestPrompt(args: {
  title: string
  items: SetItem[]
  counts: Record<number, number>
  difficultyMix: Record<"easy" | "medium" | "hard", number>
  previousTexts: string[]
  note: string
}): string {
  const { title, items, counts, difficultyMix, previousTexts, note } = args

  const countsStr = [
    `Part 1 (multiple-choice, chọn đáp án điền chỗ trống): ${counts[1]} câu`,
    `Part 2 (conjugation, chia dạng từ trong ngoặc): ${counts[2]} câu`,
    `Part 3 (synonym, tìm câu đồng nghĩa): ${counts[3]} câu`,
    `Part 4 (translation, dịch Việt → Hàn): ${counts[4]} câu`,
  ].join("\n")

  const itemsStr = items
    .map((it) => `- ${it.key} | term: ${it.term} | type: ${it.type} | meaning: ${it.definition}`)
    .join("\n")

  const typeNote = `Loại kiến thức ưu tiên từng part:
- Part 1: grammar + vocabulary
- Part 2: vocabulary (chia dạng động từ/tính từ)
- Part 3: grammar (cấu trúc tương đương)
- Part 4: vocabulary + grammar (ép dùng item mục tiêu khi dịch)`

  const diffDescr = `Số câu theo độ khó: easy ${difficultyMix.easy}, medium ${difficultyMix.medium}, hard ${difficultyMix.hard} (đúng tổng ${items.length}).`

  const prevBlock =
    previousTexts.length > 0
      ? `\n## CÂU HỎI ĐÃ DÙNG TRƯỚC ĐÂY (PHẢI TRÁNH — KHÔNG lặp ngữ cảnh, pattern, cấu trúc câu)\n${previousTexts
          .slice(0, 50)
          .map((t, i) => `${i + 1}. ${t}`)
          .join("\n")}`
      : ""

  return `You are a TOPIK II exam generator. Build a Korean-language assessment based STRICTLY on the exact vocabulary/grammar items listed below.

Task: ${title}
${note ? `Ghi chú: ${note}` : ""}

## Set items — MỖI item phải được kiểm tra ĐÚNG 1 lần (coverage bắt buộc)
${itemsStr}

## Phân bổ câu hỏi — tổng số câu = số item (${items.length}), tuân thủ ĐÚNG:
${countsStr}

## Độ khó
${diffDescr}
${typeNote}

## Quy tắc từng part
### Part 1 (multiple-choice)
- Câu hỏi = câu tiếng Hàn với chỗ trống ____. Đúng 4 phương án tiếng Hàn.
- Question + options: tiếng Hàn THUẦN TÚY, TUYỆT ĐỐI không tiếng Việt.
- correctAnswer phải là MỘT trong các option (khớp chính xác string).
- optionExplanations[i] = giải thích ngắn tiếng Việt cho từng option.

### Part 2 (conjugation)
- Câu hỏi = câu tiếng Hàn có (word) trong ngoặc. Học viên tự chia dạng.
- correctAnswer = dạng chia hợp lệ nhất (nếu nhiều biến thể đúng, ngăn cách bằng "; ").
- KHÔNG có options. explanation giải thích cách chia + điều kiện ngữ pháp.

### Part 3 (synonym)
- Câu hỏi = câu tiếng Hàn cho sẵn; options = 4 câu tiếng Hàn đầy đủ, chỉ MỘT câu đồng nghĩa.
- correctAnswer = câu đồng nghĩa đúng (khớp chính xác string).
- Distractor hợp lý (đảo nghĩa, thêm yếu tố sai thời điểm/điều kiện), không vô lý.
- Kiểm tra dạng: nguyên nhân↔kết quả, điều kiện, nhượng bộ, thời gian, mục đích, khả năng, suy đoán, bị động, sai khiến, so sánh, phủ định, tương phản.

### Part 4 (translation)
- Câu hỏi = câu TIẾNG VIỆT cần dịch sang tiếng Hàn (bắt buộc dùng item mục tiêu).
- correctAnswer = câu mẫu tiếng Hàn tự nhiên, trang trọng TOPIK.
- explanation = lưu ý ngữ pháp/từ vựng bằng tiếng Việt. grammarHint = cấu trúc nên dùng.

## QUAN TRỌNG
1. Mỗi item xuất hiện ĐÚNG 1 lần qua itemKey. KHÔNG bỏ sót, KHÔNG lặp itemKey.
2. Tổng số câu = số item. Part nào AI thấy không tự nhiên với item thì vẫn phải tạo đủ.
3. Không hiển thị nghĩa tiếng Việt trong question/options (chỉ trong meaningVi, explanation, optionExplanations).
4. Chỉ dùng kiến thức trong Set, không chèn kiến thức ngoài.
5. Ngữ cảnh đời sống TOPIK: hội thoại, thông báo, email, tin nhắn, mua sắm, giao thông, thời tiết, sức khỏe, lịch trình.
6. Trả về VALID JSON ONLY — không markdown, không code fence:
{
  "title": "<tên đề>",
  "description": "<mô tả ngắn>",
  "questions": [
    {
      "itemKey": "item_1",
      "part": 1,
      "difficulty": "medium",
      "question": "저는 매일 아침 일찍 ____ 학교에 갑니다.",
      "options": ["일어나서", "일어나지만", "일어나도록", "일어날까"],
      "correctAnswer": "일어나서",
      "meaningVi": "Tôi thức dậy sớm mỗi sáng rồi đi học.",
      "optionExplanations": ["-아서/어서 nối 2 hành động tự nhiên", "-지만 đối lập", "-도록 mục đích/mức độ", "-ㄹ까 băn khoăn"],
      "explanation": "‘-아서/어서’ nối hai hành động có quan hệ tự nhiên."
    }
  ]
}
${prevBlock}`
}

function computeCoverageStats(questions: GeneratedQuestion[], itemKeys: string[]) {
  const used = new Map<string, number>()
  for (const q of questions) {
    const k = q.itemKey
    used.set(k, (used.get(k) ?? 0) + 1)
  }
  const missing = itemKeys.filter((k) => !used.has(k))
  const duplicated = [...used.entries()].filter(([, c]) => c > 1).map(([k]) => k)
  const extraCount = duplicated.reduce((sum, k) => sum + used.get(k)! - 1, 0)
  return { missing, duplicated, extraCount }
}

function isQuestionDup(q: GeneratedQuestion, prevNormalized: Set<string>): boolean {
  return prevNormalized.has(normalizeText(q.question))
}

async function generateFullTest(
  compileArgs: Parameters<typeof buildSetTestPrompt>[0],
  itemKeys: string[],
): Promise<GeneratedQuestion[]> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await callGeminiJSON(buildSetTestPrompt({ ...compileArgs, note: attempt > 1 ? `ATTEMPT ${attempt}: lần trước bỏ sót item — phải dùng ĐÚNG mọi item, mỗi item đúng 1 lần.` : "" }), {
        temperature: 0.7,
        maxTokens: 8192,
      })
      const parsed = generatedTestSchema.parse(raw)
      const { missing, extraCount } = computeCoverageStats(parsed.questions, itemKeys)
      const uniqueKeys = new Set(parsed.questions.map((q) => q.itemKey)).size === parsed.questions.length
      if (missing.length === 0 && extraCount === 0 && uniqueKeys && parsed.questions.length === itemKeys.length) {
        return parsed.questions
      }
    } catch {
      // parse/network error → retry
    }
  }
  throw new Error("Không tạo được đề đạt tỷ lệ bao phủ mọi item sau 3 lần thử. Hãy thử lại.")
}

async function patchQuestionTexts(questions: GeneratedQuestion[], prevNormalized: Set<string>): Promise<GeneratedQuestion[]> {
  const dups = questions.filter((q) => isQuestionDup(q, prevNormalized))
  if (dups.length === 0) return questions
  const kept = questions.filter((q) => !isQuestionDup(q, prevNormalized))

  for (let round = 0; round < 2; round++) {
    const stillDup = questions.filter((q) => isQuestionDup(q, prevNormalized))
    if (stillDup.length === 0) break
    const keysToFix = [...new Set(stillDup.map((q) => q.itemKey))]
    const prompt = `Viết lại (KHÔNG trùng với câu cũ, đổi toàn bộ ngữ cảnh) các câu hỏi cho các item sau. Mỗi item đúng 1 câu, giữ đúng part/difficulty. TRẢ VỀ JSON: {"questions":[{...cấu trúc giống ban đầu...}]}.
${keysToFix.join(", ")}`
    try {
      const raw = await callGeminiJSON(prompt, { temperature: 0.9, maxTokens: 4096 })
      const parsed = generatedTestSchema.parse(raw)
      const replacement = new Map(parsed.questions.map((q) => [q.itemKey, q]))
      const patched = kept.map((q) => replacement.get(q.itemKey) ?? q)
      const remainingDup = patched.filter((q) => isQuestionDup(q, prevNormalized))
      if (remainingDup.length === 0) return patched
    } catch {
      // fall through to keep current questions
    }
  }
  return questions
}

export const setTestRouter = router({
  generate: publicProcedure
    .input(z.object({ setId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const deviceId = ctx.deviceId || "anonymous"

      const set = await prisma.flashcardSet.findUnique({
        where: { id: input.setId },
        include: { cards: { orderBy: { order: "asc" } } },
      })
      if (!set) throw new Error("Set not found")

      const items: SetItem[] = set.cards.map((c, i) => ({
        key: `item_${i + 1}`,
        id: c.id,
        term: c.term,
        type: c.type === "grammar" ? "grammar" : "vocabulary",
        definition: c.definition,
      }))
      const itemKeys = items.map((it) => it.key)
      const keyToItem = new Map(items.map((it) => [it.key, it]))
      const counts = computePartCounts(items.length)
      const difficultyMix = computeDifficultyCounts(items.length)
      const previousTexts = await getPreviousQuestionTexts(deviceId, input.setId)
      const prevNormalized = new Set(previousTexts.map(normalizeText))

      const compileArgs = {
        title: `${set.title} — TOPIK Set Test`,
        items,
        counts,
        difficultyMix,
        previousTexts,
        note: "",
      }

      const questions = await generateFullTest(compileArgs, itemKeys)
      const deduped = await patchQuestionTexts(questions, prevNormalized)

      const qByPart: Record<1 | 2 | 3 | 4, BuiltQuestion[]> = { 1: [], 2: [], 3: [], 4: [] }
      let qid = 1

      const builtQuestions = deduped.map((q): BuiltQuestion => {
        const part = q.part as 1 | 2 | 3 | 4
        const item = keyToItem.get(q.itemKey)
        const type = PART_TYPE_FOR_PART[part]
        let options = q.options
        let correctAnswer = q.correctAnswer
        let optionExplanations = q.optionExplanations

        if (type === "multiple-choice" || type === "synonym") {
          const opts = options && options.length > 0 ? [...options] : []
          if (!opts.includes(correctAnswer)) {
            if (opts.length > 1) {
              opts[0] = correctAnswer
              optionExplanations = optionExplanations ? [q.explanation, ...optionExplanations.slice(1)] : undefined
            } else {
              opts.push(correctAnswer)
            }
          }
          options = opts
        }

        const built: BuiltQuestion = {
          id: qid++,
          part,
          type,
          question: q.question,
          options,
          grammarHint: q.grammarHint,
          correctAnswer,
          explanation: q.explanation,
          meaningVi: q.meaningVi,
          difficulty: q.difficulty,
          optionExplanations,
          itemId: item?.id ?? "",
          itemType: item?.type ?? "vocabulary",
        }
        qByPart[part].push(built)
        return built
      })

      const sections = ([1, 2, 3, 4] as const)
        .filter((p) => qByPart[p].length > 0)
        .map((p) => ({
          name: PART_NAMES[p],
          instruction: PART_INSTRUCTIONS[p],
          questions: qByPart[p],
        }))

      const questionItemMap: Record<string, string> = {}
      for (const q of builtQuestions) {
        questionItemMap[String(q.id)] = q.itemId
      }
      const contextHashes: Record<string, boolean> = {}
      for (const q of builtQuestions) contextHashes[normalizeText(q.question)] = true

      const history = await prisma.testHistory.create({
        data: {
          deviceId,
          source: "set-test",
          setId: input.setId,
          title: `TOPIK Set Test — ${set.title}`,
          description: `${set.title} · ${builtQuestions.length} câu`,
          sections: sections as unknown as Prisma.InputJsonValue,
          contextHashes: contextHashes as unknown as Prisma.InputJsonValue,
          questionItemMap: questionItemMap as unknown as Prisma.InputJsonValue,
        },
      })

      return {
        id: history.id,
        test: { title: history.title, description: history.description, sections },
      }
    }),
})
