/**
 * Verify TOPIK Set Test question generation + validation pipeline (no DB).
 * Runs the REAL production code paths:
 *   generateFullTest → patchQuestionTexts → validateAndFixQuestions
 * against 20 mock items, then reports each question + reconstructed sentence.
 *
 * Run:
 *   GEMINI_API_KEY="<key>" DATABASE_URL="postgresql://dummy" npx tsx scripts/verify-set-test-validation.ts
 */
import {
  buildSetTestPrompt,
  generateFullTest,
  patchQuestionTexts,
  rewriteInvalidQuestions,
  runValidation,
  validateAndFixConjugationQuestions,
  validateAndFixQuestions,
  type GeneratedQuestion,
  type SetItem,
} from "@/server/routers/set-test"
import { computeDifficultyCounts, computePartCounts } from "@/lib/set-test-distribution"
import {
  buildValidationPrompt,
  getOptionIndex,
  needsBlankValidation,
  questionIsValid,
  reconstructSentence,
  validationBatchSchema,
  type ValidationItem,
} from "@/lib/set-test-validation"
import { callGeminiJSON } from "@/server/lib/gemini"

const items: SetItem[] = [
  { key: "item_1", id: "c1", term: "-거나", type: "grammar", definition: "hoặc ... hoặc" },
  { key: "item_2", id: "c2", term: "-지만", type: "grammar", definition: "nhưng" },
  { key: "item_3", id: "c3", term: "-(으)려고", type: "grammar", definition: "để (mục đích)" },
  { key: "item_4", id: "c4", term: "-도록", type: "grammar", definition: "để cho / đến mức" },
  { key: "item_5", id: "c5", term: "-아/어서", type: "grammar", definition: "vì nên (nguyên nhân)" },
  { key: "item_6", id: "c6", term: "-니까", type: "grammar", definition: "vì ... nên" },
  { key: "item_7", id: "c7", term: "-(으)ㄹ 때", type: "grammar", definition: "khi" },
  { key: "item_8", id: "c8", term: "-는 중이다", type: "grammar", definition: "đang ..." },
  { key: "item_9", id: "c9", term: "-(으)ㄹ 수 있다", type: "grammar", definition: "có thể" },
  { key: "item_10", id: "c10", term: "-고 있다", type: "grammar", definition: "đang ..." },
  { key: "item_11", id: "c11", term: "-기 전에", type: "grammar", definition: "trước khi" },
  { key: "item_12", id: "c12", term: "-은/ㄴ 후에", type: "grammar", definition: "sau khi" },
  { key: "item_13", id: "c13", term: "-다가", type: "grammar", definition: "đang thì ..." },
  { key: "item_14", id: "c14", term: "-(으)면", type: "grammar", definition: "nếu" },
  { key: "item_15", id: "c15", term: "-는 것 같다", type: "grammar", definition: "dường như" },
  { key: "item_16", id: "c16", term: "-았/었더니", type: "grammar", definition: "vì đã ... nên ..." },
  { key: "item_17", id: "c17", term: "주말", type: "vocabulary", definition: "cuối tuần" },
  { key: "item_18", id: "c18", term: "친구", type: "vocabulary", definition: "bạn bè" },
  { key: "item_19", id: "c19", term: "공부하다", type: "vocabulary", definition: "học tập" },
  { key: "item_20", id: "c20", term: "쉬다", type: "vocabulary", definition: "nghỉ ngơi" },
]

async function demoBugRejection() {
  console.log("\n=== DEMO: validator rejects the reported bug question ===")
  const bugItem: ValidationItem = {
    itemKey: "bug_1",
    question: "주말에는 집에서 쉬거나 친구를 ____ 만나요.",
    options: ["만나거나", "만나려고", "만나느라고", "만나도록"],
    target: "-거나",
  }
  const raw = await callGeminiJSON(buildValidationPrompt([bugItem]), {
    temperature: 0.2,
    maxTokens: 4096,
  })
  const parsed = validationBatchSchema.parse(raw)
  const outcome = parsed.results[0]
  const verdict = questionIsValid(bugItem.question, bugItem.options, "만나거나", {
    isValid: outcome.isValid,
    correctAnswerIndex: outcome.correctAnswerIndex,
    issues: outcome.issues,
  })
  console.log("question:", bugItem.question)
  console.log("validator verdict:", JSON.stringify(outcome))
  console.log("questionIsValid (generated answer=만나거나):", verdict)
  if (verdict) {
    console.log("⚠️ WARNING: bug question passed validation!")
  } else {
    console.log("✅ Bug question REJECTED — will be regenerated before saving.")
  }
}

function report(questions: GeneratedQuestion[]) {
  const byPart: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const q of questions) byPart[q.part] = (byPart[q.part] ?? 0) + 1

  console.log(`\n=== PIPELINE RESULT: ${questions.length} questions ===`)
  console.log("Part distribution:", JSON.stringify(byPart))

  let issues = 0
  for (const q of questions) {
    const opts = q.options ?? []
    const isMC = opts.length > 0
    const answerIdx = getOptionIndex(opts, q.correctAnswer)
    const hasBlank = /_{3,}/.test(q.question)
    const dupOptions = new Set(opts).size !== opts.length
    const exactlyOne = isMC ? answerIdx !== -1 : true

    if ((isMC && !exactlyOne) || dupOptions) issues++

    console.log(`\n[${q.itemKey}] part=${q.part} diff=${q.difficulty} target-listed`)
    console.log("Q:", q.question)
    if (opts.length) {
      opts.forEach((o, i) => console.log(`   ${i}. ${o}${i === answerIdx ? "  ← correct" : ""}`))
      if (hasBlank) {
        console.log("reconstructed (correct):", reconstructSentence(q.question, q.correctAnswer))
      }
    } else {
      console.log("answer:", q.correctAnswer)
    }
  }

  console.log(`\nStructural issues (missing correct answer in options / dup options): ${issues}`)
  return issues
}

async function main() {
  console.log("Mock items:", items.length)
  await demoBugRejection()

  const itemKeys = items.map((it) => it.key)
  const counts = computePartCounts(items.length)
  const difficultyMix = computeDifficultyCounts(items.length)
  const compileArgs = {
    title: "TOPIK Set Test — Verify",
    items,
    counts,
    difficultyMix,
    previousTexts: [],
    note: "",
    weakBlock: "",
  }
  const keyToTarget = new Map(items.map((it) => [it.key, it.term]))

  console.log("\n=== Generating full test via production pipeline ===")
  const questions = await generateFullTest(compileArgs, itemKeys)
  console.log("Generated raw:", questions.length, "questions")
  const deduped = await patchQuestionTexts(questions, new Set())
  console.log("After dedupe:", deduped.length)

  console.log("\n=== DEBUG: manual validation rounds ===")
  let current = deduped
  for (let round = 0; round < 3; round++) {
    const results = await runValidation(current, keyToTarget)
    const invalid = current
      .filter((q) => needsBlankValidation(q.part, q.options, q.question))
      .filter((q) => {
        const o = results.get(q.itemKey)
        return !(o && questionIsValid(q.question, q.options ?? [], q.correctAnswer, o))
      })
    console.log(`Round ${round}: ${invalid.length} invalid / ${current.length} total`)

    for (const q of invalid) {
      const o = results.get(q.itemKey)
      console.log(`  ❌ ${q.itemKey}: ${q.question}`)
      console.log(`     options: ${(q.options ?? []).map((x, i) => `${i}=${x}`).join(" | ")}`)
      console.log(`     correct: "${q.correctAnswer}"  idx=${getOptionIndex(q.options, q.correctAnswer)}`)
      console.log(`     verdict: ${JSON.stringify(o)}`)
    }

    if (invalid.length === 0) break
    if (round === 2) {
      console.log("\nSTILL INVALID after 3 rounds — stopping debug loop.")
      break
    }
    const fixed = await rewriteInvalidQuestions(current, invalid.map((q) => q.itemKey), keyToTarget)
    const changed = fixed.filter((q, i) => JSON.stringify(q) !== JSON.stringify(current[i]))
    console.log(`  → rewrite returned ${fixed.length} questions, ${changed.length} changed`)
    current = fixed
  }

  console.log("\n=== FINAL REPORT (debug result) ===")
  report(current)

  console.log("\n=== Part 2 conjugation validation (production pipeline) ===")
  const keyToItemInfo = new Map(items.map((it) => [it.key, { term: it.term, type: it.type }]))
  const conjFixed = await validateAndFixConjugationQuestions(current, keyToItemInfo)
  const conjPart2 = conjFixed.filter((q) => q.part === 2)
  console.log(`Part 2 after conjugation validation: ${conjPart2.length} questions`)
  for (const q of conjPart2) {
    console.log(`  [${q.itemKey}] Q: ${q.question}`)
    console.log(`     base=${q.baseWord ?? "?"} target=${q.targetGrammar ?? "?"} answer=${q.correctAnswer} expected=[${(q.expectedAnswers ?? []).join(", ")}] transform=${q.transformation ? "✓" : "✗"}`)
  }
}

main().catch((err) => {
  console.error("\n❌ Pipeline FAILED:")
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
