/**
 * Verify TOPIK Set Test Part 2 (conjugation) generation + validation (no DB).
 * Runs the REAL production code paths:
 *   generateFullTest (20 Part 2 questions) → validateAndFixConjugationQuestions
 * then reports base word, target grammar, expected answers, reconstructed
 * sentence and a deterministic morphology cross-check per question.
 *
 * Run:
 *   GEMINI_API_KEY="<key>" DATABASE_URL="postgresql://dummy" npx tsx scripts/verify-set-test-conjugation.ts
 */
import {
  generateFullTest,
  validateAndFixConjugationQuestions,
  type SetItem,
  type GeneratedQuestion,
} from "@/server/routers/set-test"
import { computeDifficultyCounts } from "@/lib/set-test-distribution"
import {
  checkConjugationMorphology,
  extractBaseWord,
  reconstructConjugationSentence,
} from "@/lib/set-test-conjugation"

const WORDS: { term: string; type: "vocabulary" | "grammar"; meaning: string }[] = [
  { term: "하다", type: "vocabulary", meaning: "làm" },
  { term: "먹다", type: "vocabulary", meaning: "ăn" },
  { term: "가다", type: "vocabulary", meaning: "đi" },
  { term: "그렇다", type: "vocabulary", meaning: "như vậy" },
  { term: "맑다", type: "vocabulary", meaning: "trong, quang đãng" },
  { term: "듣다", type: "vocabulary", meaning: "nghe" },
  { term: "걷다", type: "vocabulary", meaning: "đi bộ" },
  { term: "돕다", type: "vocabulary", meaning: "giúp" },
  { term: "오다", type: "vocabulary", meaning: "đến" },
  { term: "보다", type: "vocabulary", meaning: "xem" },
  { term: "만들다", type: "vocabulary", meaning: "làm, chế tạo" },
  { term: "읽다", type: "vocabulary", meaning: "đọc" },
  { term: "마시다", type: "vocabulary", meaning: "uống" },
  { term: "쓰다", type: "vocabulary", meaning: "viết, dùng" },
  { term: "자다", type: "vocabulary", meaning: "ngủ" },
  { term: "살다", type: "vocabulary", meaning: "sống" },
  { term: "배우다", type: "vocabulary", meaning: "học" },
  { term: "작다", type: "vocabulary", meaning: "nhỏ" },
  { term: "좋다", type: "vocabulary", meaning: "tốt, thích" },
  { term: "춥다", type: "vocabulary", meaning: "lạnh" },
]

const items: SetItem[] = WORDS.map((w, i) => ({
  key: `item_${i + 1}`,
  id: `card_${i + 1}`,
  term: w.term,
  type: w.type,
  definition: w.meaning,
}))
const itemKeys = items.map((it) => it.key)

async function main() {
  console.log(`Mock items: ${items.length} (all Part 2 / conjugation)\n`)

  const compileArgs = {
    title: "Part 2 Conjugation Verify — TOPIK Set Test",
    items,
    counts: { 1: 0, 2: 20, 3: 0, 4: 0 },
    difficultyMix: computeDifficultyCounts(20),
    previousTexts: [] as string[],
    note: "Trải đều các target grammar -ㄴ지, -다가, -아서/어서, -ㄴ/-은, -는, -려고 cho các base word đã cho.",
    weakBlock: "",
  }

  console.log("=== Generating 20 Part 2 questions via production pipeline ===\n")
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
  const part2 = questions.filter((q) => q.part === 2)
  if (part2.length < 20) {
    console.log(`⚠ Only ${part2.length} Part 2 questions — run with the expected 20.`)
  }

  console.log("\n=== Raw Part 2 field check ===")
  let missingFields = 0
  let answerNotInExpected = 0
  for (const q of part2) {
    const hasBase = !!q.baseWord
    const hasTarget = !!q.targetGrammar
    const hasExpected = Array.isArray(q.expectedAnswers) && q.expectedAnswers.length > 0
    const hasTransform = !!q.transformation
    const inExpected = hasExpected && q.expectedAnswers!.includes(q.correctAnswer)
    if (!hasBase || !hasTarget || !hasExpected || !hasTransform) missingFields++
    if (!inExpected) answerNotInExpected++
    console.log(
      `  ${q.itemKey}: base=${q.baseWord ?? extractBaseWord(q.question)} target=${q.targetGrammar ?? "?"} expected=[${(q.expectedAnswers ?? []).join(", ")}] transform=${q.transformation ? "✓" : "✗"} correctInExpected=${inExpected ? "✓" : "✗"}`,
    )
  }
  console.log(`\nMissing required fields: ${missingFields} | correctAnswer not in expectedAnswers: ${answerNotInExpected}`)

  console.log("\n=== Validating via production validateAndFixConjugationQuestions ===\n")
  const itemInfo = new Map(items.map((it) => [it.key, { term: it.term, type: it.type }]))
  let validated: GeneratedQuestion[]
  try {
    validated = await validateAndFixConjugationQuestions(questions, itemInfo)
  } catch (e) {
    console.log("validateAndFixConjugationQuestions FAILED:", (e as Error).message)
    return
  }

  const vPart2 = validated.filter((q) => q.part === 2)
  let knownWrong = 0
  let knownChecked = 0
  console.log("=== PIPELINE RESULT: validated Part 2 questions ===")
  for (const q of vPart2) {
    const base = q.baseWord || extractBaseWord(q.question) || ""
    const target = q.targetGrammar || ""
    const correct = q.correctAnswer
    const morph = checkConjugationMorphology(base, target, correct)
    if (morph.known) {
      knownChecked++
      if (!morph.ok) knownWrong++
    }
    console.log(`\n[${q.itemKey}] diff=${q.difficulty}`)
    console.log("Q:", q.question)
    console.log(`   baseWord=${base} | targetGrammar=${target}`)
    console.log(`   correctAnswer=${correct} | expectedAnswers=[${(q.expectedAnswers ?? []).join(", ")}]`)
    console.log(`   transformation=${q.transformation}`)
    console.log("   reconstructed:", reconstructConjugationSentence(q.question, correct))
    console.log(`   morphology (reference known=${morph.known}): ${morph.known ? (morph.ok ? "✓ correct" : `✗ WRONG, expected ${morph.expected}`) : "unknown → AI-verified"}`)
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Validated Part 2 questions: ${vPart2.length}`)
  console.log(`Reference patterns hit: ${knownChecked} | known-but-WRONG: ${knownWrong}`)
  console.log(`Missing required fields: ${missingFields} | answer not in expectedAnswers: ${answerNotInExpected}`)
}

main().catch((e) => {
  console.log("SCRIPT ERROR:", e)
  process.exit(1)
})
