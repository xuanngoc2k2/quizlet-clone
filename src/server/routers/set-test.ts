import { z } from "zod"
import { router, publicProcedure } from "../trpc"
import { prisma } from "../db"
import { callGeminiJSON } from "../lib/gemini"
import type { Prisma } from "@prisma/client"
import { computePartCounts, computeDifficultyCounts } from "@/lib/set-test-distribution"
import { computeWeakStats, type HistoryInput, type AttemptResult } from "@/lib/set-test-stats"
import {
  BLANK_RE,
  buildValidationPrompt,
  needsBlankValidation,
  questionIsValid,
  validationBatchSchema,
  type ValidationItem,
  type ValidationOutcome,
} from "@/lib/set-test-validation"
import {
  buildConjugationValidationPrompt,
  buildTransformation,
  checkConjugationMorphology,
  conjugationQuestionIsValid,
  conjugationValidationBatchSchema,
  CONJUGATION_REFERENCE,
  extractBaseWord,
  needsConjugationValidation,
  normalizeConjugationAnswer,
  type ConjugationValidationItem,
  type ConjugationValidationOutcome,
} from "@/lib/set-test-conjugation"
import {
  buildSynonymValidationPrompt,
  canonicalGrammarKey,
  checkUnderlinePosition,
  needsSynonymValidation,
  normalizePlain,
  synonymQuestionIsValid,
  synonymValidationBatchSchema,
  type SynonymValidationItem,
  type SynonymValidationOutcome,
} from "@/lib/set-test-synonym"

const PART_NAMES: Record<number, string> = {
  1: "Phần 1: Chọn đáp án đúng để điền vào chỗ trống",
  2: "Phần 2: Chia dạng từ trong ngoặc",
  3: "Phần 3: Tìm câu đồng nghĩa",
  4: "Phần 4: Dịch câu tự luận",
}

const PART_INSTRUCTIONS: Record<number, string> = {
  1: "Chọn một đáp án phù hợp điền vào chỗ trống (____).",
  2: "Chia dạng đúng của từ trong ngoặc để hoàn thành câu.",
  3: "다음 문장의 밑줄 친 부분과 의미가 같은 것을 고르십시오.",
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
  baseWord: z.string().optional(),
  targetGrammar: z.string().optional(),
  expectedAnswers: z.array(z.string()).optional(),
  transformation: z.string().optional(),
  underlinedText: z.string().optional(),
})

const generatedTestSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  questions: z.array(generatedQuestionSchema).min(1),
})

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>

export type QuestionType = "multiple-choice" | "conjugation" | "synonym" | "translation"
export type Difficulty = "easy" | "medium" | "hard"

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
  baseWord?: string
  targetGrammar?: string
  expectedAnswers?: string[]
  transformation?: string
  underlinedText?: string
}

export type SetItem = { key: string; id: string; term: string; type: "vocabulary" | "grammar"; definition: string }

function normalizeText(s: string): string {
  return s.replace(/\s+/g, "").replace(/[.,!?;:"'“”()（）___]/g, "").toLowerCase()
}

const CONJUGATION_REFERENCE_BLOCK = CONJUGATION_REFERENCE.map(
  (r) => `${r.base} + ${r.target} → ${r.correct}`,
).join("; ")

export const PART2_GENERATION_RULES = `### Part 2 (conjugation — chia dạng từ trong ngoặc)
- Câu hỏi = câu tiếng Hàn chứa TỪ NGUYÊN MẪU trong ngoặc (base word, VD "(그렇다)") và chỗ trống "____": định dạng "문장 (baseWord) ____ 문장". Từ trong ngoặc là BASE FORM, KHÔNG phải đáp án.
- Không đoán ngẫu nhiên grammar. Xác định phép biến đổi đúng DỰA TRÊN: target grammar + cấu trúc câu + thì + kính ngữ + liên từ + tiểu từ + ngữ cảnh. Flow: chọn base word (lấy từ item) → chọn target grammar phù hợp → xác định dạng chia → viết câu hoàn chỉnh → viết đáp án.
- MỖI câu BẮT BUỘC khai báo:
  - baseWord: dạng nguyên mẫu (VD "그렇다")
  - targetGrammar: ngữ pháp mục tiêu (VD "-ㄴ지")
  - correctAnswer: dạng chia đúng duy nhất (VD "그런지")
  - expectedAnswers: ["<canonical>", "<biến thể hợp lệ khác nếu có>"] — tối thiểu 1 phần tử; correctAnswer phải khớp chính xác một phần tử
  - transformation: cách biến đổi (VD "그렇다 → 그렇 + ㄴ지 → 그런지")
- Phải khớp chuẩn biến đổi. THÍ DỤ ĐÚNG: ${CONJUGATION_REFERENCE_BLOCK}
- Sai nếu chia sai dạng (VD 그렇다 + -ㄴ지 phải là "그런지", KHÔNG được "그렇는지"/"그렇은지"/"그렇지"; 맑다 + -다가 phải là "맑다가", KHÔNG được "맑는다"/"맑아서"/"맑으면").
- KHÔNG có options. explanation giải thích cách chia + điều kiện ngữ pháp bằng tiếng Việt.`

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

export function buildSetTestPrompt(args: {
  title: string
  items: SetItem[]
  counts: Record<number, number>
  difficultyMix: Record<"easy" | "medium" | "hard", number>
  previousTexts: string[]
  note: string
  weakBlock?: string
}): string {
  const { title, items, counts, difficultyMix, previousTexts, note, weakBlock } = args

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
${weakBlock ? `\n${weakBlock}` : ""}

## Quy tắc từng part
### Part 1 (multiple-choice)
- Câu hỏi = câu tiếng Hàn với chỗ trống ____. Đúng 4 phương án tiếng Hàn.
- Question + options: tiếng Hàn THUẦN TÚY, TUYỆT ĐỐI không tiếng Việt.
- correctAnswer phải là MỘT trong các option (khớp chính xác string).
- optionExplanations[i] = giải thích ngắn tiếng Việt cho từng option.

${PART2_GENERATION_RULES}

### Part 3 (synonym — tìm câu đồng nghĩa)
- Câu hỏi = câu tiếng Hàn HOÀN CHỈNH, TUYỆT ĐỐI KHÔNG chứa HTML/<u>/đánh dấu gạch chân. Chọn ĐÚNG MỘT cụm ngữ pháp làm target và BẮT BUỘC khai báo:
  - targetGrammar: tên ngữ pháp mục tiêu (VD "-는 길에")
  - underlinedText: CHUỖI CON EXACT nằm trong question, là cụm thể hiện đúng ngữ pháp cần kiểm tra (VD "가는 길에"). Điều kiện: question.includes(underlinedText) === true. KHÔNG underline toàn bộ câu; KHÔNG underline một từ/cụm không phải ngữ pháp target.
- Mỗi Part 3 question có instruction cố định: "다음 문장의 밑줄 친 부분과 의미가 같은 것을 고르십시오."
- options = 4 câu tiếng Hàn đầy đủ, chỉ ĐÚNG MỘT câu có nghĩa TƯƠNG ĐƯƠNG với NGHĨA CỦA underlinedText trong ngữ cảnh câu gốc.
- Distractor phải khác NGHĨA rõ ràng so với underlinedText (đổi thời điểm/điều kiện/mục đích/nguyên nhân/nhượng bộ/khả năng...), không được là biến thể paraphrase của đáp án đúng. VD "가는 길에" ≈ "가다가" (hành động xảy ra trên đường đi); nhưng "가려고" (định làm), "도착해서" (sau khi đến), "가기 전에" (trước khi đi) là KHÁC nghĩa.
- correctAnswer = option đồng nghĩa đúng (khớp chính xác string). optionExplanations[i] = giải thích tiếng Việt vì sao option i đồng nghĩa/không đồng nghĩa với underlinedText.
- explanation = giải thích chi tiết tiếng Việt: nghĩa của underlinedText, nghĩa option đúng, vì sao tương đương trong context này, và vì sao từng distractor không đồng nghĩa.

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
    },
    {
      "itemKey": "item_2",
      "part": 2,
      "difficulty": "medium",
      "question": "월요일이라 (그렇다) ____ 사람이 많네요.",
      "correctAnswer": "그런지",
      "baseWord": "그렇다",
      "targetGrammar": "-ㄴ지",
      "expectedAnswers": ["그런지"],
      "transformation": "그렇다 → 그렇 + ㄴ지 → 그런지",
      "meaningVi": "Có lẽ vì là thứ Hai nên có nhiều người.",
      "explanation": "‘그렇다’ là tính từ 불규칙 'ㅎ' → thân '그렇' + -ㄴ지 → '그런지', diễn đạt suy đoán về lý do."
    },
    {
      "itemKey": "item_3",
      "part": 3,
      "difficulty": "hard",
      "question": "학교에 가는 길에 편의점에 들렀어요.",
      "targetGrammar": "-는 길에",
      "underlinedText": "가는 길에",
      "options": [
        "학교에 도착해서 편의점에 들렀어요.",
        "학교에 가다가 편의점에 들렀어요.",
        "학교에 가려고 편의점에 들렀어요.",
        "학교에 가기 전에 편의점에 들렀어요."
      ],
      "correctAnswer": "학교에 가다가 편의점에 들렀어요.",
      "optionExplanations": ["도착해서 = sau khi đến — khác nghĩa", "가다가 = trên đường đi — tương đương", "가려고 = định đi — khác nghĩa", "가기 전에 = trước khi đi — khác nghĩa"],
      "meaningVi": "Trên đường đi học, tôi đã ghé cửa hàng tiện lợi.",
      "explanation": "‘가는 길에’ = trên đường đi; ‘가다가’ diễn đạt hành động xảy ra trên đường. Các đáp án còn lại khác thời điểm/mục đích."
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

export async function generateFullTest(
  compileArgs: Parameters<typeof buildSetTestPrompt>[0],
  itemKeys: string[],
): Promise<GeneratedQuestion[]> {
  let best: { questions: GeneratedQuestion[]; missing: number } | null = null
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
      if (!best || missing.length < best.missing) {
        best = { questions: parsed.questions, missing: missing.length }
      }
    } catch {
      // parse/network error → retry
    }
  }
  if (best) {
    const seen = new Set<string>()
    return best.questions.filter((q) => {
      if (seen.has(q.itemKey)) return false
      seen.add(q.itemKey)
      return true
    })
  }
  throw new Error("Không tạo được đề đạt tỷ lệ bao phủ mọi item sau 3 lần thử. Hãy thử lại.")
}

export async function patchQuestionTexts(questions: GeneratedQuestion[], prevNormalized: Set<string>): Promise<GeneratedQuestion[]> {
  const dups = questions.filter((q) => isQuestionDup(q, prevNormalized))
  if (dups.length === 0) return questions
  const kept = questions.filter((q) => !isQuestionDup(q, prevNormalized))

  for (let round = 0; round < 2; round++) {
    const stillDup = questions.filter((q) => isQuestionDup(q, prevNormalized))
    if (stillDup.length === 0) break
    const keysToFix = [...new Set(stillDup.map((q) => q.itemKey))]
    const prompt = `Viết lại (KHÔNG trùng với câu cũ, đổi toàn bộ ngữ cảnh) các câu hỏi cho các item sau. Mỗi item đúng 1 câu, giữ đúng part/difficulty/itemKey. Nếu part=2 phải khai báo đầy đủ baseWord, targetGrammar, expectedAnswers, transformation khớp với đáp án chia dạng mới. Nếu part=3 phải khai báo underlinedText (chuỗi con exact nằm trong question, thể hiện targetGrammar) + targetGrammar. TRẢ VỀ JSON: {"questions":[{...cấu trúc giống ban đầu...}]}.
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

export async function runValidation(
  questions: GeneratedQuestion[],
  keyToTarget: Map<string, string>,
): Promise<Map<string, ValidationOutcome>> {
  const items: ValidationItem[] = questions
    .filter((q) => needsBlankValidation(q.part, q.options, q.question))
    .map((q) => ({
      itemKey: q.itemKey,
      question: q.question,
      options: q.options ?? [],
      target: keyToTarget.get(q.itemKey) ?? "",
    }))

  if (items.length === 0) return new Map()

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await callGeminiJSON(buildValidationPrompt(items), {
        temperature: 0.2,
        maxTokens: 4096,
      })
      const parsed = validationBatchSchema.parse(raw)
      const byKey = new Map(parsed.results.map((r) => [r.itemKey, r]))
      const map = new Map<string, ValidationOutcome>()
      for (const it of items) {
        const r = byKey.get(it.itemKey)
        map.set(
          it.itemKey,
          r
            ? { isValid: r.isValid, correctAnswerIndex: r.correctAnswerIndex, issues: r.issues }
            : { isValid: false, correctAnswerIndex: -1, issues: ["Validator bỏ sót item này"] },
        )
      }
      return map
    } catch {
      // parse/network error → retry validation once
    }
  }

  const map = new Map<string, ValidationOutcome>()
  for (const it of items) {
    map.set(it.itemKey, { isValid: false, correctAnswerIndex: -1, issues: ["Lỗi validator"] })
  }
  return map
}

export async function rewriteInvalidQuestions(
  questions: GeneratedQuestion[],
  invalidKeys: string[],
  keyToTarget: Map<string, string>,
): Promise<GeneratedQuestion[]> {
  const targets = invalidKeys
    .map((k) => `- ${k} (target: ${keyToTarget.get(k) ?? ""})`)
    .join("\n")

  const prompt = `Bạn là chuyên gia ra đề TOPIK. Viết LẠI HOÀN TOÀN các câu hỏi trắc nghiệm (Part 1 — multiple-choice điền blank) sau đây. Các câu này đang bị lỗi: đáp án đúng chèn vào blank tạo câu sai/không tự nhiên, hoặc có nhiều hơn một đáp án đúng, hoặc blank đặt sai vị trí khiến grammar target không kết hợp tự nhiên với phần còn lại của câu.

Các item cần viết lại:
${targets}

Yêu cầu:
1. Đặt blank "____" đúng vị trí mà item target kết hợp TỰ NHIÊN (vd target "-거나" → câu "주말에는 집에서 쉬____ 친구를 만나요." → đáp án "쉬거나" tạo câu hoàn chỉnh tự nhiên). KHÔNG đặt blank ở vị trí gây xung đột với ending cuối câu (vd KHÔNG tạo "…쉬거나 친구를 ____ 만나요." vì mọi option đều tạo câu vô nghĩa).
2. Đúng 4 phương án cùng loại grammar/vocabulary với target — là các cấu trúc TOPIK dễ nhầm nhau (VD -거나/-지만/-려고/-도록).
3. correctAnswer chèn vào blank phải tạo CÂU HOÀN CHỈNH đúng ngữ pháp, nghĩa rõ ràng, tiếng Hàn tự nhiên TOPIK.
4. Mỗi distractor chèn vào blank phải tạo câu SAI rõ ràng (ngữ pháp hoặc nghĩa) nhưng hợp lý để dễ nhầm — không sai lộ liễu, không vô nghĩa, không không thể kết hợp.
5. Chỉ MỘT đáp án đúng duy nhất. correctAnswer phải khớp chính xác một trong các option (cùng string).
6. Question + options chỉ tiếng Hàn, TUYỆT ĐỐI không tiếng Việt. Không dùng lại đúng câu đã lỗi. Giữ đúng part=1 và difficulty, itemKey như đã cho.

TRẢ VỀ JSON hợp lệ (không markdown, không code fence):
{"questions":[{"itemKey":"...","part":1,"difficulty":"easy|medium|hard","question":"...","options":["a","b","c","d"],"correctAnswer":"...","meaningVi":"...","optionExplanations":["..."],"explanation":"...","grammarHint":"..."}]}`

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await callGeminiJSON(prompt, { temperature: 0.9, maxTokens: 8192 })
      const parsed = z.object({ questions: z.array(generatedQuestionSchema).min(1) }).parse(raw)
      const replacement = new Map(
        parsed.questions
          .filter((q) => invalidKeys.includes(q.itemKey))
          .map((q) => [q.itemKey, q]),
      )
      const stillMissing = invalidKeys.filter((k) => !replacement.has(k))
      if (stillMissing.length === 0) {
        return questions.map((q) => replacement.get(q.itemKey) ?? q)
      }
    } catch {
      // retry rewrite
    }
  }
  return questions
}

export async function validateAndFixQuestions(
  questions: GeneratedQuestion[],
  keyToTarget: Map<string, string>,
): Promise<GeneratedQuestion[]> {
  let current = questions
  for (let round = 0; round < 3; round++) {
    const results = await runValidation(current, keyToTarget)
    const invalidKeys = current
      .filter((q) => {
        if (!needsBlankValidation(q.part, q.options, q.question)) return false
        const outcome = results.get(q.itemKey)
        if (!outcome) return true
        return !questionIsValid(q.question, q.options ?? [], q.correctAnswer, outcome)
      })
      .map((q) => q.itemKey)

    if (invalidKeys.length === 0) return current
    if (round === 2) break
    current = await rewriteInvalidQuestions(current, invalidKeys, keyToTarget)
  }

  // Best-effort: never hard-fail the whole test. Keep structurally-sound
  // questions (blank present + at least one option) that passed the rewrite
  // rounds; drop only items that lost their blank entirely.
  return current.filter((q) => {
    if (!needsBlankValidation(q.part, q.options, q.question)) return true
    return BLANK_RE.test(q.question) && (q.options?.length ?? 0) > 0
  })
}

export async function runConjugationValidation(
  questions: GeneratedQuestion[],
): Promise<Map<string, ConjugationValidationOutcome>> {
  const items: ConjugationValidationItem[] = questions
    .filter((q) => needsConjugationValidation(q.part, q.question))
    .map((q) => ({
      itemKey: q.itemKey,
      question: q.question,
      baseWord: q.baseWord || extractBaseWord(q.question) || "",
      targetGrammar: q.targetGrammar || "",
      correctAnswer: q.correctAnswer,
    }))

  if (items.length === 0) return new Map()

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await callGeminiJSON(buildConjugationValidationPrompt(items), {
        temperature: 0.2,
        maxTokens: 4096,
      })
      const parsed = conjugationValidationBatchSchema.parse(raw)
      const byKey = new Map(parsed.results.map((r) => [r.itemKey, r]))
      const map = new Map<string, ConjugationValidationOutcome>()
      for (const it of items) {
        const r = byKey.get(it.itemKey)
        map.set(
          it.itemKey,
          r
            ? {
                isValid: r.isValid,
                correctAnswer: r.correctAnswer ?? it.correctAnswer,
                expectedAnswers: r.expectedAnswers ?? [],
                issues: r.issues,
              }
            : { isValid: false, correctAnswer: it.correctAnswer, expectedAnswers: [], issues: ["Validator bỏ sót item này"] },
        )
      }
      return map
    } catch {
      // parse/network error → retry validation once
    }
  }

  const map = new Map<string, ConjugationValidationOutcome>()
  for (const it of items) {
    map.set(it.itemKey, { isValid: false, correctAnswer: it.correctAnswer, expectedAnswers: [], issues: ["Lỗi validator"] })
  }
  return map
}

export async function rewriteInvalidConjugationQuestions(
  questions: GeneratedQuestion[],
  invalidKeys: string[],
  itemInfo?: Map<string, { term: string; type: "vocabulary" | "grammar" }>,
): Promise<GeneratedQuestion[]> {
  const targets = invalidKeys
    .map((k) => {
      const q = questions.find((x) => x.itemKey === k)
      const info = itemInfo?.get(k)
      const isVocab = info?.type === "vocabulary"
      const base = isVocab ? (info?.term ?? "") : (q?.baseWord || (q ? extractBaseWord(q.question) : "") || "")
      const target = isVocab ? (q?.targetGrammar || "") : (info?.term || q?.targetGrammar || "")
      const ref = CONJUGATION_REFERENCE.find((r) => r.base === base && r.target === target)
      const hint = ref ? ` — ĐÁP ÁN ĐÚNG PHẢI LÀ "${ref.correct}" (${base} + ${target})` : ""
      const role = isVocab ? `base BẮT BUỘC="${base}"` : `target grammar BẮT BUỘC="${target}" (tự chọn base word là động từ/tính từ phù hợp)`
      return `- ${k}: ${role}${target ? `, targetGrammar="${target}"` : ""}${hint}`
    })
    .join("\n")

  const prompt = `Bạn là chuyên gia chia động từ/tính từ tiếng Hàn (TOPIK). Viết LẠI HOÀN TOÀN các câu Part 2 (chia dạng từ trong ngoặc) sau. Câu hiện tại đang lỗi: dạng chia sai, câu không tự nhiên, không có base word trong ngoặc, hoặc target grammar không phù hợp với base word.

Các item cần viết lại (ràng buộc bắt buộc + gợi ý đáp án đúng nếu có):
${targets}

Yêu cầu:
1. Định dạng: "문장 (baseWord) ____ 문장" — câu tiếng Hàn, từ nguyên mẫu baseWord trong ngoặc, blank "____", TUYỆT ĐỐI không tiếng Việt trong câu.
2. Tôn trọng ràng buộc ở trên: nếu item là TỪ VỰNG thì baseWord = base bắt buộc và targetGrammar tự chọn phù hợp; nếu item là NGỮ PHÁP thì targetGrammar = target bắt buộc và chọn baseWord là một động từ/tính từ tiếng Hàn phù hợp để ghép với ngữ pháp đó.
3. Dùng ĐÚNG dạng chia của base word theo target grammar. VD: 그렇다 + -ㄴ지 → 그런지; 맑다 + -다가 → 맑다가; 하다 + -아서/어서 → 해서; 듣다 + -은 → 들은; 돕다 + -은 → 도운.
4. BẮT BUỘC khai báo: correctAnswer = dạng chia đúng duy nhất; expectedAnswers = ["<canonical>", "<biến thể hợp lệ nếu có>"] (tối thiểu 1, correctAnswer phải khớp chính xác một phần tử); transformation = "<cách biến đổi, VD 그렇다 → 그렇 + ㄴ지 → 그런지>".
5. Câu hoàn chỉnh sau khi điền đáp án phải đúng ngữ pháp, tự nhiên TOPIK, nghĩa rõ ràng.
6. explanation = giải thích cách chia + điều kiện ngữ pháp bằng tiếng Việt. Giữ đúng itemKey, part=2, difficulty.

TRẢ VỀ JSON hợp lệ (không markdown, không code fence):
{"questions":[{"itemKey":"...","part":2,"difficulty":"easy|medium|hard","question":"...","correctAnswer":"...","baseWord":"...","targetGrammar":"...","expectedAnswers":["..."],"transformation":"...","meaningVi":"...","explanation":"...","grammarHint":"..."}]}`

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await callGeminiJSON(prompt, { temperature: 0.9, maxTokens: 8192 })
      const parsed = z.object({ questions: z.array(generatedQuestionSchema).min(1) }).parse(raw)
      const replacement = new Map(
        parsed.questions
          .filter((q) => invalidKeys.includes(q.itemKey))
          .map((q) => [q.itemKey, q]),
      )
      const stillMissing = invalidKeys.filter((k) => !replacement.has(k))
      if (stillMissing.length === 0) {
        return questions.map((q) => replacement.get(q.itemKey) ?? q)
      }
    } catch {
      // retry rewrite
    }
  }
  return questions
}

export async function validateAndFixConjugationQuestions(
  questions: GeneratedQuestion[],
  itemInfo?: Map<string, { term: string; type: "vocabulary" | "grammar" }>,
): Promise<GeneratedQuestion[]> {
  let current = questions
  for (let round = 0; round < 3; round++) {
    const results = await runConjugationValidation(current)
    const invalidKeys: string[] = []
    let changed = false

    const next = current.map((q) => {
      if (q.part !== 2) return q

      if (!needsConjugationValidation(q.part, q.question)) {
        invalidKeys.push(q.itemKey)
        return q
      }

      const info = itemInfo?.get(q.itemKey)
      const isVocab = info?.type === "vocabulary"
      const expectedBase = isVocab ? info.term : (q.baseWord || extractBaseWord(q.question) || "")
      if (isVocab && q.baseWord && normalizeConjugationAnswer(q.baseWord) !== normalizeConjugationAnswer(info.term)) {
        invalidKeys.push(q.itemKey)
        return q
      }
      if (!isVocab && !q.baseWord) {
        invalidKeys.push(q.itemKey)
        return q
      }

      const outcome = results.get(q.itemKey)
      if (!outcome || !conjugationQuestionIsValid(q.question, q.correctAnswer, outcome)) {
        invalidKeys.push(q.itemKey)
        return q
      }

      const target = q.targetGrammar || ""
      const morph = checkConjugationMorphology(expectedBase, target, q.correctAnswer)
      if (morph.known && !morph.ok) {
        invalidKeys.push(q.itemKey)
        return q
      }

      const corrected = normalizeConjugationAnswer(outcome.correctAnswer)
      if (corrected !== normalizeConjugationAnswer(q.correctAnswer)) {
        invalidKeys.push(q.itemKey)
        return q
      }

      const expected = [...new Set([q.correctAnswer, ...(q.expectedAnswers ?? []), ...(outcome.expectedAnswers ?? [])].map(normalizeConjugationAnswer))]
      const newQ: GeneratedQuestion = {
        ...q,
        expectedAnswers: expected.length > 0 ? expected : [q.correctAnswer],
        transformation: q.transformation || (target ? buildTransformation(expectedBase, target, q.correctAnswer) : undefined),
      }
      if (newQ.transformation !== q.transformation || newQ.expectedAnswers?.length !== (q.expectedAnswers?.length ?? 1)) changed = true
      return newQ
    })

    if (invalidKeys.length === 0) return changed ? next : current
    if (round === 2) break
    current = await rewriteInvalidConjugationQuestions(next, invalidKeys, itemInfo)
  }

  // Best-effort: never hard-fail the whole test. Drop only Part 2 items with
  // no usable base word (structurally broken); keep the rest as improved by
  // the rewrite rounds.
  return current.filter((q) => {
    if (q.part !== 2) return true
    const base = q.baseWord || extractBaseWord(q.question) || ""
    return base !== ""
  })
}

export async function runSynonymValidation(
  questions: GeneratedQuestion[],
): Promise<Map<string, SynonymValidationOutcome>> {
  const items: SynonymValidationItem[] = questions
    .filter((q) => needsSynonymValidation(q.part, q.underlinedText))
    .map((q) => ({
      itemKey: q.itemKey,
      question: q.question,
      underlinedText: normalizePlain(q.underlinedText ?? ""),
      targetGrammar: q.targetGrammar || "",
      options: q.options ?? [],
      correctAnswer: q.correctAnswer,
    }))

  if (items.length === 0) return new Map()

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await callGeminiJSON(buildSynonymValidationPrompt(items), {
        temperature: 0.2,
        maxTokens: 4096,
      })
      const parsed = synonymValidationBatchSchema.parse(raw)
      const byKey = new Map(parsed.results.map((r) => [r.itemKey, r]))
      const map = new Map<string, SynonymValidationOutcome>()
      for (const it of items) {
        const r = byKey.get(it.itemKey)
        map.set(
          it.itemKey,
          r
            ? { isValid: r.isValid, correctAnswerIndex: r.correctAnswerIndex, issues: r.issues }
            : { isValid: false, correctAnswerIndex: -1, issues: ["Validator bỏ sót item này"] },
        )
      }
      return map
    } catch {
      // parse/network error → retry validation once
    }
  }

  const map = new Map<string, SynonymValidationOutcome>()
  for (const it of items) {
    map.set(it.itemKey, { isValid: false, correctAnswerIndex: -1, issues: ["Lỗi validator"] })
  }
  return map
}

export async function rewriteInvalidSynonymQuestions(
  questions: GeneratedQuestion[],
  invalidKeys: string[],
  itemInfo?: Map<string, { term: string; type: "vocabulary" | "grammar" }>,
  outcomes?: Map<string, SynonymValidationOutcome>,
): Promise<GeneratedQuestion[]> {
  const targets = invalidKeys
    .map((k) => {
      const q = questions.find((x) => x.itemKey === k)
      const info = itemInfo?.get(k)
      const grammar = info?.type === "grammar" ? (info?.term ?? "") : (q?.targetGrammar ?? "")
      const prevUnderline = q?.underlinedText ?? ""
      const issues = outcomes?.get(k)?.issues ?? []
      const issueLine = issues.length > 0 ? `, lỗi validator: ${issues.join("; ")}` : ""
      let anchor = ""
      const oc = outcomes?.get(k)
      if (oc?.isValid && oc.correctAnswerIndex >= 0 && q?.options && oc.correctAnswerIndex < q.options.length) {
        anchor = `, validator xác định đáp án DUY NHẤT đồng nghĩa là "${q.options[oc.correctAnswerIndex]}" — hãy giữ đúng câu này (hoặc một câu tương đương khác) làm correctAnswer`
      }
      return `- ${k}: targetGrammar bắt buộc="${grammar}", underlinedText cũ="${prevUnderline}"${issueLine}${anchor}`
    })
    .join("\n")

  const prompt = `Bạn là chuyên gia ra đề TOPIK. Viết LẠI HOÀN TOÀN các câu Part 3 (synonym — tìm câu đồng nghĩa) sau. Câu hiện tại đang lỗi (có thể ghi rõ lý do validator từ chối).

Các item cần viết lại:
${targets}

Yêu cầu:
1. question = câu tiếng Hàn HOÀN CHỈNH tự nhiên TOPIK, TUYỆT ĐỐI KHÔNG HTML/<u> trong question.
2. targetGrammar = ngữ pháp mục tiêu như đã cho (nếu item là ngữ pháp thì BẮT BUỘC dùng term item). underlinedText = CHUỖI CON EXACT nằm trong question thể hiện ĐÚNG cụm ngữ pháp đó (question.includes(underlinedText) === true). KHÔNG gạch chân toàn bộ câu.
3. options = đúng 4 câu tiếng Hàn đầy đủ; ĐÚNG MỘT câu có nghĩa TƯƠNG ĐƯƠNG với nghĩa của underlinedText trong context câu gốc.
4. Đáp án đúng dùng một CẤU TRÚC ĐỒNG NGHĨA CHUẨN khác với underlinedText. Tham khảo cặp tương đương chuẩn TOPIK: -아/어서 ↔ -기 때문에; -고 나서 ↔ -(으)ㄴ 후에; -는 길에 ↔ -다가; -아/어야 (phải làm) ↔ -지 않으면 안 되다 (ưu tiên) hoặc -아/어야만; -네요 ↔ -군요; -거든요 ↔ -기 때문이에요; -아/어도 ↔ -더라도; -는 동안 ↔ -는 사이에; -지만 ↔ -는데; -(으)면 ↔ -는 경우에/-(으)ㄴ다면; -기 전에 ↔ -기 이전에/-(으)ㄹ 때 앞서; -아/어 보니까 ↔ -(으)ㄴ 것을 알게 되다; -아/어서 그런지 ↔ -기 때문인지; -고 있다 ↔ -는 중이다; -(으)려고 ↔ -(으)러. Nếu đáp án đúng phải là paraphrase câu hoàn chỉnh thì dùng từ đồng nghĩa chuẩn.
5. 3 distractor còn lại phải KHÁC NGHĨA rõ ràng (thời điểm/điều kiện/mục đích/nguyên nhân/nhượng bộ/khả năng...), KHÔNG lặp nghĩa của nhau, KHÔNG paraphrase của đáp án đúng, không được có 2 đáp án cùng nghĩa với underlinedText.
6. correctAnswer = option đồng nghĩa đúng (khớp chính xác string). optionExplanations[i] = vì sao option i đúng/sai. explanation = nghĩa underlinedText + vì sao option đúng tương đương + vì sao từng distractor không đồng nghĩa (tiếng Việt).
7. Giữ đúng itemKey, part=3, difficulty.

TRẢ VỀ JSON hợp lệ (không markdown, không code fence):
{"questions":[{"itemKey":"...","part":3,"difficulty":"easy|medium|hard","question":"...","targetGrammar":"...","underlinedText":"...","options":["a","b","c","d"],"correctAnswer":"...","optionExplanations":["..."],"meaningVi":"...","explanation":"..."}]}`

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await callGeminiJSON(prompt, { temperature: 0.9, maxTokens: 8192 })
      const parsed = z.object({ questions: z.array(generatedQuestionSchema).min(1) }).parse(raw)
      const replacement = new Map(
        parsed.questions
          .filter((q) => invalidKeys.includes(q.itemKey))
          .map((q) => [q.itemKey, q]),
      )
      const stillMissing = invalidKeys.filter((k) => !replacement.has(k))
      if (stillMissing.length === 0) {
        return questions.map((q) => replacement.get(q.itemKey) ?? q)
      }
    } catch {
      // retry rewrite
    }
  }
  return questions
}

export async function validateAndFixSynonymQuestions(
  questions: GeneratedQuestion[],
  itemInfo?: Map<string, { term: string; type: "vocabulary" | "grammar" }>,
): Promise<GeneratedQuestion[]> {
  let current = questions
  for (let round = 0; round < 3; round++) {
    const results = await runSynonymValidation(current)
    const invalidKeys: string[] = []
    let changed = false

    const next = current.map((q) => {
      if (q.part !== 3) return q

      const underline = normalizePlain(q.underlinedText ?? "")
      if (!underline || !checkUnderlinePosition(q.question, underline).found || checkUnderlinePosition(q.question, underline).wholeSentence) {
        invalidKeys.push(q.itemKey)
        return q
      }
      if (!q.targetGrammar) {
        invalidKeys.push(q.itemKey)
        return q
      }
      const info = itemInfo?.get(q.itemKey)
      if (info?.type === "grammar" && q.targetGrammar && canonicalGrammarKey(q.targetGrammar) !== canonicalGrammarKey(info.term)) {
        invalidKeys.push(q.itemKey)
        return q
      }
      if (!q.options || q.options.length < 4) {
        invalidKeys.push(q.itemKey)
        return q
      }

      const outcome = results.get(q.itemKey)
      if (!outcome || !synonymQuestionIsValid(q.question, q.options, q.correctAnswer, underline, outcome)) {
        invalidKeys.push(q.itemKey)
        return q
      }

      const newQ: GeneratedQuestion = {
        ...q,
        underlinedText: underline,
      }
      if (normalizePlain(q.underlinedText ?? "") !== underline) changed = true
      return newQ
    })

    if (invalidKeys.length === 0) return changed ? next : current
    if (round === 2) break
    current = await rewriteInvalidSynonymQuestions(next, invalidKeys, itemInfo, results)
  }

  // Best-effort: never hard-fail the whole test. Drop only Part 3 items whose
  // underline is structurally invalid (empty / not an exact substring / the
  // whole sentence); keep the rest as improved by the rewrite rounds.
  return current.filter((q) => {
    if (q.part !== 3) return true
    const underline = normalizePlain(q.underlinedText ?? "")
    if (!underline) return false
    const pos = checkUnderlinePosition(q.question, underline)
    return pos.found && !pos.wholeSentence
  })
}

async function loadSetHistories(deviceId: string, setId: string) {
  return prisma.testHistory.findMany({
    where: { deviceId, source: "set-test", setId },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { attempts: { orderBy: { createdAt: "desc" } } },
  })
}

function toHistoryInput(
  rows: Awaited<ReturnType<typeof loadSetHistories>>,
): HistoryInput[] {
  return rows.map((h) => ({
    sections: h.sections as unknown as HistoryInput["sections"],
    questionItemMap: (h.questionItemMap as Record<string, string>) ?? {},
    attempts: (h.attempts as unknown as { results: AttemptResult[] }[]).map((a) => ({ results: a.results ?? [] })),
  }))
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
      if (items.length === 0) throw new Error("Set không có thẻ nào. Hãy thêm thẻ vào Set trước khi tạo đề.")
      const itemKeys = items.map((it) => it.key)
      const keyToItem = new Map(items.map((it) => [it.key, it]))
      const counts = computePartCounts(items.length)
      const difficultyMix = computeDifficultyCounts(items.length)
      const previousTexts = await getPreviousQuestionTexts(deviceId, input.setId)
      const prevNormalized = new Set(previousTexts.map(normalizeText))

      const histories = await loadSetHistories(deviceId, input.setId)
      const weakStats = computeWeakStats(toHistoryInput(histories))
      const itemIdToKey = new Map(items.map((it) => [it.id, it.key]))
      const weakItems = weakStats.items
        .filter((it) => weakStats.weakIds.includes(it.itemId))
        .map((it) => {
          const key = itemIdToKey.get(it.itemId)
          const item = key ? keyToItem.get(key) : undefined
          return { key: key ?? "", term: item?.term ?? "", seen: it.timesSeen, rate: Math.round(it.correctRate * 100) }
        })
      const weakBlock =
        weakItems.length > 0
          ? `## WEAKNESS ADAPTATION — học viên yếu các mục sau, cần luyện kỹ hơn
${weakItems.map((w) => `- ${w.key} (${w.term}): đúng ${w.rate}% (${w.seen} lần)`).join("\n")}
Với các mục yếu này:
- Tăng độ khó hợp lý (ưu tiên medium/hard).
- Với grammar yếu: tạo distractor là các cấu trúc đối lập tương tự (VD -는데/-지만/-아서/-니까) để ép học viên phân biệt.
- Với từ vựng yếu: đặt trong ngữ cảnh cần suy luận, không chỉ dịch từ trực tiếp.
- KHÔNG lặp đúng câu đã làm sai trước đó.`
          : ""

      const compileArgs = {
        title: `${set.title} — TOPIK Set Test`,
        items,
        counts,
        difficultyMix,
        previousTexts,
        note: "",
        weakBlock,
      }

      const questions = await generateFullTest(compileArgs, itemKeys)
      const deduped = await patchQuestionTexts(questions, prevNormalized)
      const keyToTarget = new Map(items.map((it) => [it.key, it.term]))
      const keyToItemInfo = new Map(items.map((it) => [it.key, { term: it.term, type: it.type }]))
      const [v1, v2, v3] = await Promise.all([
        validateAndFixQuestions(deduped, keyToTarget),
        validateAndFixConjugationQuestions(deduped, keyToItemInfo),
        validateAndFixSynonymQuestions(deduped, keyToItemInfo),
      ])
      const validatedSyn = deduped
        .filter((q) => {
          if (q.part === 1) return v1.some((x) => x.itemKey === q.itemKey)
          if (q.part === 2) return v2.some((x) => x.itemKey === q.itemKey)
          if (q.part === 3) return v3.some((x) => x.itemKey === q.itemKey)
          return true
        })
        .map((q) => {
          if (q.part === 1) return v1.find((x) => x.itemKey === q.itemKey) ?? q
          if (q.part === 2) return v2.find((x) => x.itemKey === q.itemKey) ?? q
          if (q.part === 3) return v3.find((x) => x.itemKey === q.itemKey) ?? q
          return q
        })

      const qByPart: Record<1 | 2 | 3 | 4, BuiltQuestion[]> = { 1: [], 2: [], 3: [], 4: [] }
      let qid = 1

      const builtQuestions = validatedSyn.map((q): BuiltQuestion => {
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

        let baseWord = q.baseWord
        let targetGrammar = q.targetGrammar
        let expectedAnswers = q.expectedAnswers
        let transformation = q.transformation
        if (type === "conjugation") {
          correctAnswer = normalizeConjugationAnswer(q.correctAnswer)
          baseWord = baseWord || extractBaseWord(q.question) || undefined
          const expected = [...new Set((expectedAnswers ?? [q.correctAnswer]).map(normalizeConjugationAnswer))]
          expectedAnswers = expected.length > 0 ? expected : [correctAnswer]
          if (!expectedAnswers.includes(correctAnswer)) expectedAnswers = [correctAnswer, ...expectedAnswers]
          targetGrammar = targetGrammar || undefined
          transformation = transformation || (baseWord && targetGrammar ? buildTransformation(baseWord, targetGrammar, correctAnswer) : undefined)
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
          baseWord,
          targetGrammar,
          expectedAnswers,
          transformation,
          underlinedText: q.part === 3 ? normalizePlain(q.underlinedText ?? "") : undefined,
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

  getWeakItems: publicProcedure
    .input(z.object({ setId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const deviceId = ctx.deviceId || "anonymous"
      const set = await prisma.flashcardSet.findUnique({
        where: { id: input.setId },
        include: { cards: true },
      })
      if (!set) throw new Error("Set not found")

      const histories = await loadSetHistories(deviceId, input.setId)
      const { items, summary, weakIds } = computeWeakStats(toHistoryInput(histories))
      const cardById = new Map(set.cards.map((c) => [c.id, c]))

      return {
        summary,
        weakIds,
        items: items.map((it) => {
          const card = cardById.get(it.itemId)
          return {
            ...it,
            term: card?.term ?? "",
            definition: card?.definition ?? "",
            type: (card?.type === "grammar" ? "grammar" : "vocabulary") as "vocabulary" | "grammar",
          }
        }),
      }
    }),
})
