"use client"

import { CheckCircle2, XCircle } from "lucide-react"

type ProgressBarProps = {
  current: number
  total: number
  correct: number
  incorrect: number
}

export function ProgressBar({ current, total, correct, incorrect }: ProgressBarProps) {
  const pct = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="mb-6">
      <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
        <span className="text-primary-500">
          {current} / {total}
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {correct}
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <XCircle className="h-3.5 w-3.5" />
            {incorrect}
          </span>
        </div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-primary-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
