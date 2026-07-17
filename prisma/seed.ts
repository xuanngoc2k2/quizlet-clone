import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const sampleSets = [
  {
    title: "Japanese N5 Vocabulary",
    description: "Basic Japanese words for JLPT N5",
    cards: [
      { term: "水", definition: "water", order: 0 },
      { term: "火", definition: "fire", order: 1 },
      { term: "山", definition: "mountain", order: 2 },
      { term: "川", definition: "river", order: 3 },
      { term: "花", definition: "flower", order: 4 },
      { term: "犬", definition: "dog", order: 5 },
      { term: "猫", definition: "cat", order: 6 },
      { term: "魚", definition: "fish", order: 7 },
      { term: "鳥", definition: "bird", order: 8 },
      { term: "月", definition: "moon", order: 9 },
    ],
  },
  {
    title: "React Interview Questions",
    description: "Common React concepts for frontend interviews",
    cards: [
      { term: "Virtual DOM", definition: "A lightweight JavaScript representation of the real DOM", order: 0 },
      { term: "useEffect", definition: "Hook for side effects in functional components", order: 1 },
      { term: "useMemo", definition: "Hook that memoizes a computed value", order: 2 },
      { term: "useCallback", definition: "Hook that memoizes a function reference", order: 3 },
      { term: "useRef", definition: "Hook that persists values across renders without re-rendering", order: 4 },
      { term: "Context API", definition: "A way to pass data through the component tree without props drilling", order: 5 },
      { term: "React.memo", definition: "Higher-order component that prevents unnecessary re-renders", order: 6 },
      { term: "StrictMode", definition: "Development mode wrapper that highlights potential problems", order: 7 },
    ],
  },
  {
    title: "Korean TOPIK 1 Grammar",
    description: "Beginner Korean grammar patterns",
    cards: [
      { term: "-입니다", definition: "Formal statement ending (is/are)", order: 0 },
      { term: "-이/가", definition: "Subject particle", order: 1 },
      { term: "-을/를", definition: "Object particle", order: 2 },
      { term: "-은/는", definition: "Topic particle", order: 3 },
      { term: "-에", definition: "Location/time particle (at/in/to)", order: 4 },
      { term: "-에서", definition: "Action location particle (at/in/from)", order: 5 },
      { term: "-고", definition: "Connective ending (and)", order: 6 },
      { term: "-지만", definition: "Connective ending (but)", order: 7 },
      { term: "-아/어요", definition: "Informal polite ending", order: 8 },
      { term: "-겠-", definition: "Future/volitional suffix (will)", order: 9 },
    ],
  },
]

async function main() {
  console.log("Seeding database...")

  for (const set of sampleSets) {
    const created = await prisma.flashcardSet.create({
      data: {
        title: set.title,
        description: set.description,
        cards: {
          create: set.cards,
        },
      },
    })
    console.log(`  Created set: ${created.title} (${set.cards.length} cards)`)
  }

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
