"use client"

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
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>
          {current} / {total}
        </span>
        <span>
          ✅ {correct} ❌ {incorrect}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
