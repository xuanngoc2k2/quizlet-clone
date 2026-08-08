/**
 * Verify TOPIK Set Test Part 3 (synonym — tìm câu đồng nghĩa) generation + validation (no DB).
 * Runs the REAL production code paths:
 *   generateFullTest (20 Part 3 questions) → validateAndFixSynonymQuestions
 * then re-checks, per question, the underlined text position and re-runs the
 * AI validator to confirm exactly-one semantic equivalent + correct answer index.
 *
 * Run:
 *   GEMINI_API_KEY="<key>" DATABASE_URL="postgresql://dummy" npx tsx scripts/verify-set-test-synonym.ts
 */
import {
  generateFullTest,
  validateAndFixSynonymQuestions,
  runSynonymValidation,
  type SetItem,
  type GeneratedQuestion,
} from "@/server/routers/set-test"
import { computeDifficultyCounts } from "@/lib/set-test-distribution"
import {
  checkUnderlinePosition,
  normalizePlain,
  synonymQuestionIsValid,
} from "@/lib/set-test-synonym"

const GRAMMAR: { term: string; type: "vocabulary" | "grammar"; meaning: string }[] = [
  { term: "-는 길에", type: "grammar", meaning: "trên đường làm gì" },
  { term: "-고 나서", type: "grammar", meaning: "sau khi làm xong" },
  { term: "-아/어 보니까", type: "grammar", meaning: "thử làm thì thấy" },
  { term: "-아/어서", type: "grammar", meaning: "vì nên / rồi" },
  { term: "-(으)려고", type: "grammar", meaning: "để, định làm" },
  { term: "-는 동안", type: "grammar", meaning: "trong lúc" },
  { term: "-(으)ㄴ 후에", type: "grammar", meaning: "sau khi" },
  { term: "-(으)러 가다/오다", type: "grammar", meaning: "đi/đến để làm gì" },
  { term: "-기 전에", type: "grammar", meaning: "trước khi" },
  { term: "-기 때문에", type: "grammar", meaning: "vì ... nên" },
  { term: "-다가", type: "grammar", meaning: "đang ... thì" },
  { term: "-고 있다", type: "grammar", meaning: "đang (tiếp diễn)" },
  { term: "-아/어야", type: "grammar", meaning: "phải ... mới" },
  { term: "-은/는 중이야", type: "grammar", meaning: "đang trong lúc" },
  { term: "-네요", type: "grammar", meaning: "thể hiện ngạc nhiên nhận ra" },
  { term: "-거든요", type: "grammar", meaning: "giải thích lý do" },
  { term: "-(으)면", type: "grammar", meaning: "nếu" },
  { term: "-아/어도", type: "grammar", meaning: "dù ... cũng" },
  { term: "-지만", type: "grammar", meaning: "nhưng" },
  { term: "-아/어서 그런지", type: "grammar", meaning: "có lẽ vì ... nên" },
]

const items: SetItem[] = GRAMMAR.map((g, i) => ({
  key: `item_${i + 1}`,
  id: `card_${i + 1}`,
  term: g.term,
  type: g.type,
  definition: g.meaning,
}))
const itemKeys = items.map((it) => it.key)

async function main() {
  console.log(`Mock items: ${items.length} (all Part 3 / synonym)\n`)

  const compileArgs = {
    title: "Part 3 Synonym Verify — TOPIK Set Test",
    items,
    counts: { 1: 0, 2: 0, 3: 20, 4: 0 },
    difficultyMix: computeDifficultyCounts(20),
    previousTexts: [] as string[],
    note: "Mỗi câu Part 3 gạch chân ĐÚNG MỘT cụm ngữ pháp target; chỉ một đáp án đồng nghĩa; distractor khác nghĩa rõ ràng.",
    weakBlock: "",
  }

  console.log("=== Generating 20 Part 3 questions via production pipeline ===\n")
  let questions: GeneratedQuestion[]
  try {
    questions = await generateFullTest(compileArgs, itemKeys)
  } catch (e) {
    console.log("generateFullTest FAILED:", (e as Error).message)
    return
  }

  const partDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const q of questions) partDist[q.part] = (partDist[q.part] ?? 0) + 1
  console.log(`Generated: ${questions.length} questions. Part distribution: ${JSON.stringify(partDist)}`)
  const part3 = questions.filter((q) => q.part === 3)
  if (part3.length < 20) {
    console.log(`⚠ Only ${part3.length} Part 3 questions — run with the expected 20.`)
  }

  console.log("\n=== Raw Part 3 field check (before validation) ===")
  let missingFields = 0
  let underlineInvalid = 0
  let dupCorrect = 0
  for (const q of part3) {
    const hasTarget = !!q.targetGrammar
    const hasUnderline = !!q.underlinedText
    const ok = hasTarget && hasUnderline ? checkUnderlinePosition(q.question, normalizePlain(q.underlinedText ?? "")) : { found: false, wholeSentence: false }
    const opts = q.options ?? []
    const correctCount = opts.filter((o) => o === q.correctAnswer).length
    if (!hasTarget || !hasUnderline) missingFields++
    if (!ok.found || ok.wholeSentence) underlineInvalid++
    if (correctCount !== 1) dupCorrect++
    console.log(
      `  ${q.itemKey}: target=${q.targetGrammar ?? "?"} underline="${q.underlinedText ?? "?"}" pos=${ok.found ? (ok.wholeSentence ? "WHOLE-SENTENCE" : "✓") : "✗ not-found"} correctCount=${correctCount} options=${opts.length}`,
    )
  }
  console.log(`\nMissing target/underline: ${missingFields} | underline invalid: ${underlineInvalid} | correctAnswer dup/missing: ${dupCorrect}`)

  console.log("\n=== Validating via production validateAndFixSynonymQuestions ===\n")
  const itemInfo = new Map(items.map((it) => [it.key, { term: it.term, type: it.type }]))
  let validated: GeneratedQuestion[]
  try {
    validated = await validateAndFixSynonymQuestions(questions, itemInfo)
  } catch (e) {
    console.log("validateAndFixSynonymQuestions FAILED:", (e as Error).message)
    return
  }

  const vPart3 = validated.filter((q) => q.part === 3)
  console.log("=== PIPELINE RESULT: validated Part 3 questions ===")
  for (const q of vPart3) {
    const underline = normalizePlain(q.underlinedText ?? "")
    const pos = checkUnderlinePosition(q.question, underline)
    const opts = q.options ?? []
    const correctIdx = opts.indexOf(q.correctAnswer)
    const targetMatches = q.targetGrammar ? normalizePlain(q.underlinedText ?? "").includes(normalizePlain(q.targetGrammar).replace(/-/g, "")) || normalizePlain(q.targetGrammar).replace(/-/g, "") === "" : false
    console.log(`\n[${q.itemKey}] diff=${q.difficulty}`)
    console.log("Q:", q.question)
    console.log(`   targetGrammar=${q.targetGrammar}`)
    console.log(`   underlinedText="${q.underlinedText}" (pos=${pos.found ? "✓" : "✗"} whole=${pos.wholeSentence ? "✗" : "no"})`)
    console.log(`   correctAnswer="${q.correctAnswer}" (index ${correctIdx})`)
    console.log(`   options=${opts.length} | meaningVi=${q.meaningVi ? "✓" : "✗"} | optionExplanations=${(q.optionExplanations ?? []).length}`)
  }

  console.log("\n=== Re-running AI validator on final questions ===")
  const outcomes = await runSynonymValidation(vPart3)
  let allValid = 0
  let invalid = 0
  for (const q of vPart3) {
    const underline = normalizePlain(q.underlinedText ?? "")
    const pos = checkUnderlinePosition(q.question, underline)
    const outcome = outcomes.get(q.itemKey)
    const valid = pos.found && !pos.wholeSentence && synonymQuestionIsValid(q.question, q.options ?? [], q.correctAnswer, underline, outcome)
    if (valid) allValid++
    else invalid++
    console.log(`  ${q.itemKey}: AI valid=${outcome ? outcome.isValid : "no-result"} | final=${valid ? "✓" : "✗"}`)
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Validated Part 3 questions: ${vPart3.length}`)
  console.log(`Final re-check all valid: ${allValid} | invalid: ${invalid}`)
}

main().catch((e) => {
  console.log("SCRIPT ERROR:", e)
  process.exit(1)
})
