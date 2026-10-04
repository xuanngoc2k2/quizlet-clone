const COLS = 25
const ROWS = 12

export function isDecimalPoint(text: string, index: number): boolean {
  return (
    text[index] === "." &&
    index > 0 &&
    index < text.length - 1 &&
    /[0-9]/.test(text[index - 1]) &&
    /[0-9]/.test(text[index + 1])
  )
}

export function tokenizeNumber(value: string): string[] {
  const decimalIndex = value.indexOf(".")

  if (decimalIndex === -1) {
    const cells: string[] = []
    for (let i = 0; i < value.length; i += 2) {
      cells.push(value.slice(i, i + 2))
    }
    return cells
  }

  const cells: string[] = []
  const integerPart = value.slice(0, decimalIndex)
  const fractionPart = value.slice(decimalIndex + 1)

  for (let i = 0; i < integerPart.length; i += 2) {
    const group = integerPart.slice(i, i + 2)
    if (i + group.length === integerPart.length && group.length === 1) {
      cells.push(`${group}.`)
    } else {
      cells.push(group)
    }
  }

  if (integerPart.length % 2 === 0) {
    cells.push(`.${fractionPart.slice(0, 1)}`)
    for (let i = 1; i < fractionPart.length; i += 2) {
      cells.push(fractionPart.slice(i, i + 2))
    }
  } else {
    for (let i = 0; i < fractionPart.length; i += 2) {
      cells.push(fractionPart.slice(i, i + 2))
    }
  }

  return cells
}

export function tokenizeWriting(text: string): string[] {
  const cells: string[] = []
  let i = 0

  while (i < text.length) {
    if (/[0-9]/.test(text[i])) {
      const start = i
      while (i < text.length && /[0-9]/.test(text[i])) i++
      if (isDecimalPoint(text, i)) {
        i++
        while (i < text.length && /[0-9]/.test(text[i])) i++
      }
      cells.push(...tokenizeNumber(text.slice(start, i)))
      continue
    }

    cells.push(text[i])
    i++
  }

  return cells
}

/**
 * Convert 원고지 cells array → plain Korean text.
 * Empty cells at end of each row are trimmed (paragraph break detection).
 * Trailing empty rows are removed.
 */
export function serializeCells(cells: string[]): string {
  const lines: string[] = []
  for (let row = 0; row < ROWS; row++) {
    const rowCells = cells.slice(row * COLS, (row + 1) * COLS)
    const rowText = rowCells.join("").trimEnd()
    lines.push(rowText)
  }
  // Remove trailing empty lines
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop()
  }
  return lines.join("\n")
}

export function deserializeCells(text: string): string[] {
  const cells: string[] = []
  const lines = text.split("\n")

  for (let i = 0; i < lines.length; i++) {
    const lineCells = tokenizeWriting(lines[i])

    if (lineCells.length === 0) {
      cells.push(...Array(COLS).fill(""))
      continue
    }

    for (let start = 0; start < lineCells.length; start += COLS) {
      const rowCells = lineCells.slice(start, start + COLS)
      cells.push(...rowCells)
      // Pad the rest of the row with empty strings
      while (rowCells.length < COLS) {
        cells.push("")
        rowCells.push("")
      }
    }
  }

  // Pad the rest of the 300 cells
  while (cells.length < COLS * ROWS) {
    cells.push("")
  }

  // Trim to exact size
  if (cells.length > COLS * ROWS) {
    cells.length = COLS * ROWS
  }

  return cells
}

/**
 * Count non-empty cells (space counts, newline does not apply here
 * since we use positional model — every empty string = empty cell).
 */
export function countCells(cells: string[]): number {
  return cells.filter((c) => c !== "").length
}

export function countChars(cells: string[]): number {
  return cells.filter((c) => c !== "").join("").length
}

/**
 * Validate Korean Wongojip formatting rules locally.
 * Returns a map of cellIndex -> errorMessage.
 */
export function validateWongojip(cells: string[]): Record<number, string> {
  const errors: Record<number, string> = {}

  const COLS = 25
  const ROWS = 12
  const TOTAL = COLS * ROWS

  let lastContentIdx = -1
  for (let i = TOTAL - 1; i >= 0; i--) {
    if (cells[i] !== "") {
      lastContentIdx = i
      break
    }
  }

  if (lastContentIdx === -1) return errors

  if (cells[0] !== " " && cells[0] !== "") {
    errors[0] = "Dòng đầu tiên của bài viết phải lùi vào một ô (dùng dấu cách)."
  }

  for (let i = 0; i <= lastContentIdx; i++) {
    const c = cells[i]
    const row = Math.floor(i / COLS)
    const col = i % COLS

    if (c === "") {
      let hasContentAfter = false
      for (let j = i + 1; j < (row + 1) * COLS; j++) {
        if (cells[j] !== "") {
          hasContentAfter = true
          break
        }
      }
      if (hasContentAfter) {
        errors[i] = "Ô trống bất thường. Hãy dùng dấu cách (Space) thay vì để trống ô."
      }
      continue
    }

    if (c === " ") {
      if (i > 0 && cells[i - 1] === " ") {
        errors[i] = "Khoảng trắng thừa (không dùng nhiều khoảng trắng liên tiếp)."
        errors[i - 1] = "Khoảng trắng thừa (không dùng nhiều khoảng trắng liên tiếp)."
      }
    }

    if (col === 0) {
      if (row > 0 && c === " ") {
        errors[i] = "Chỉ lùi đầu dòng ở dòng đầu tiên của bài (câu 53 viết một đoạn duy nhất). Các dòng sau bắt đầu từ ô đầu tiên."
      }
      if (/^[.,?!\]})”’]$/.test(c)) {
        errors[i] = "Dấu câu không được đặt ở ô đầu tiên của dòng."
      }
    }

    if ((c === "." || c === ",") && i < TOTAL - 1) {
      if (cells[i + 1] === " ") {
        errors[i + 1] = "Không để khoảng trắng sau dấu chấm hoặc phẩy."
      }
    }

    if ((c === "?" || c === "!") && i < TOTAL - 1) {
      const next = cells[i + 1]
      if (next !== "" && next !== " " && !/^[\]})”’]$/.test(next)) {
        errors[i + 1] = "Cần để một khoảng trắng sau dấu hỏi hoặc chấm than."
      }
    }
  }

  return errors
}

