export type CardType = "vocabulary" | "grammar"

export type CardInput = {
  term: string
  definition: string
  type: CardType
}

export function termKey(term: string): string {
  return term.trim().toLowerCase()
}

export function isDuplicateTerm(cards: { term: string }[], term: string): boolean {
  const key = termKey(term)
  return cards.some((card) => termKey(card.term) === key)
}

export function buildCardInput(
  term: string,
  definition: string,
  type: CardType = "vocabulary",
): CardInput {
  return { term: term.trim(), definition: definition.trim(), type }
}
