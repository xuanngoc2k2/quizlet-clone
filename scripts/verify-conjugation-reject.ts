/**
 * Verify that a Part 2 question with a WRONG conjugation (for a known
 * reference pattern) is caught and rewritten correctly by the production
 * validateAndFixConjugationQuestions pipeline.
 *
 * Run:
 *   GEMINI_API_KEY="<key>" DATABASE_URL="postgresql://dummy" npx tsx scripts/verify-conjugation-reject.ts
 */
import {
  runConjugationValidation,
  validateAndFixConjugationQuestions,
  type GeneratedQuestion,
} from "@/server/routers/set-test"
import { checkConjugationMorphology, reconstructConjugationSentence } from "@/lib/set-test-conjugation"

const base: GeneratedQuestion = {
  itemKey: "item_1",
  part: 2,
  difficulty: "medium",
  question: "아침에 하늘이 (맑다) ____ 공기가 좋아요.",
  correctAnswer: "맑는다",
  baseWord: "맑다",
  targetGrammar: "-아서/어서",
  expectedAnswers: ["맑는다"],
  transformation: "맑다 + -아서/어서 → 맑는다",
  explanation: "test",
}

async function main() {
  const q = base
  console.log("Question:", q.question)
  console.log("correctAnswer (WRONG):", q.correctAnswer)
  console.log("deterministic check:", JSON.stringify(checkConjugationMorphology(q.baseWord!, q.targetGrammar!, q.correctAnswer)))

  const results = await runConjugationValidation([q])
  const outcome = results.get("item_1")
  console.log("\nAI validator verdict:", JSON.stringify(outcome))

  console.log("\n=== validateAndFixConjugationQuestions (should catch + rewrite) ===")
  let out: GeneratedQuestion[]
  try {
    out = await validateAndFixConjugationQuestions([q])
  } catch (e) {
    console.log("FAILED:", (e as Error).message)
    return
  }
  const fixed = out.find((x) => x.itemKey === "item_1")!
  console.log("\nRewritten question:", fixed.question)
  console.log("baseWord:", fixed.baseWord, "| targetGrammar:", fixed.targetGrammar)
  console.log("correctAnswer:", fixed.correctAnswer)
  console.log("expectedAnswers:", fixed.expectedAnswers)
  console.log("transformation:", fixed.transformation)
  console.log("reconstructed:", reconstructConjugationSentence(fixed.question, fixed.correctAnswer))
  const morph = checkConjugationMorphology(fixed.baseWord || "", fixed.targetGrammar || "", fixed.correctAnswer)
  console.log("final morphology:", morph.known ? (morph.ok ? "✓ correct" : `✗ WRONG (${morph.expected})`) : "unknown")
}

main().catch((e) => {
  console.log("SCRIPT ERROR:", e)
  process.exit(1)
})
