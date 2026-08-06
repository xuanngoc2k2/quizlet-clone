export type ImportedCard = { term: string; definition: string; type: "vocabulary" | "grammar" }

export type ImportResult = {
  cards: ImportedCard[]
  skipped: number
  errors: string[]
}

export function normalizeType(raw: string | undefined): "vocabulary" | "grammar" {
  const t = (raw ?? "").trim().toLowerCase()
  if (t === "grammar" || t === "ngữ pháp" || t === "ngu phap") return "grammar"
  return "vocabulary"
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim()
  return undefined
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

export function parseJSON(content: string): ImportResult {
  const errors: string[] = []
  let data: unknown
  try {
    data = JSON.parse(stripBom(content))
  } catch {
    return { cards: [], skipped: 0, errors: ["File JSON không hợp lệ — kiểm tra lại cú pháp."] }
  }

  if (data && typeof data === "object" && !Array.isArray(data) && "cards" in data) {
    data = (data as { cards: unknown }).cards
  }

  if (!Array.isArray(data)) {
    return { cards: [], skipped: 0, errors: ["JSON phải là một mảng các object { term, definition }."] }
  }

  const cards: ImportedCard[] = []
  let skipped = 0

  for (const item of data) {
    if (!item || typeof item !== "object") {
      skipped++
      continue
    }
    const rec = item as Record<string, unknown>
    const get = (key: string): unknown => {
      const match = Object.keys(rec).find((k) => k.trim().toLowerCase() === key)
      return match === undefined ? undefined : rec[match]
    }

    const term = toStringValue(get("term"))
    const definition = toStringValue(get("definition"))
    const type = toStringValue(get("type"))

    if (!term || !definition) {
      skipped++
      continue
    }
    cards.push({ term, definition, type: normalizeType(type) })
  }

  return { cards, skipped, errors }
}

function parseCSVRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ",") {
        row.push(field)
        field = ""
      } else if (ch === "\n") {
        row.push(field)
        field = ""
        rows.push(row)
        row = []
      } else if (ch !== "\r") {
        field += ch
      }
    }
  }
  row.push(field)
  rows.push(row)
  return rows
}

function isHeaderRow(row: string[]): boolean {
  const first = (row[0] ?? "").trim().toLowerCase()
  return first === "term"
}

export function parseCSV(content: string): ImportResult {
  const rows = parseCSVRows(stripBom(content))
  const cards: ImportedCard[] = []
  let skipped = 0

  rows.forEach((rawRow, index) => {
    const row = rawRow.map((cell) => cell.trim())
    if (row.every((cell) => !cell)) return
    if (index === 0 && isHeaderRow(row)) return

    const [term, definition, type] = row
    if (!term || !definition) {
      skipped++
      return
    }
    cards.push({ term, definition, type: normalizeType(type) })
  })

  return { cards, skipped, errors: [] }
}

export function parseImportFile(fileName: string, content: string): ImportResult {
  const name = fileName.toLowerCase()
  if (name.endsWith(".json")) return parseJSON(content)
  if (name.endsWith(".csv")) return parseCSV(content)

  const json = parseJSON(content)
  if (json.errors.length === 0) return json
  return parseCSV(content)
}
