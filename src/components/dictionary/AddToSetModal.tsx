"use client"

import { AddCardModal } from "./AddCardModal"

type AddToSetModalProps = {
  open: boolean
  onClose: () => void
  term: string
  definition: string
}

export function AddToSetModal({ open, onClose, term, definition }: AddToSetModalProps) {
  return (
    <AddCardModal open={open} onClose={onClose} term={term} definition={definition} />
  )
}
