"use client"

import { AddCardModal } from "./AddCardModal"

type AddFlashcardModalProps = {
  open: boolean
  onClose: () => void
  term: string
  definition: string
}

export function AddFlashcardModal({ open, onClose, term, definition }: AddFlashcardModalProps) {
  return (
    <AddCardModal open={open} onClose={onClose} term={term} definition={definition} editable />
  )
}
