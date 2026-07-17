"use client"

import { useMemo } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"

function renderLatex(text: string): string {
  try {
    return katex.renderToString(text, { throwOnError: false, displayMode: false })
  } catch {
    return text
  }
}

export function MathText({ text }: { text: string }) {
  const html = useMemo(() => {
    const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g)
    return parts
      .map((part) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const inner = part.slice(2, -2)
          try {
            return katex.renderToString(inner, { throwOnError: false, displayMode: true })
          } catch {
            return part
          }
        }
        if (part.startsWith("$") && part.endsWith("$")) {
          const inner = part.slice(1, -1)
          return renderLatex(inner)
        }
        return escapeHtml(part)
      })
      .join("")
  }, [text])

  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
