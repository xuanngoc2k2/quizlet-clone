"use client"

import { BookOpen, Ear, FileText, SpellCheck } from "lucide-react"

interface SkillProgress {
  totalCards?: number
  graduatedCards?: number
  coveragePercent?: number | null
  totalAttempts?: number
  accuracy: number | null
  hasData: boolean
}

interface ProgressOverviewProps {
  progress: {
    vocabulary: SkillProgress
    grammar: SkillProgress
    reading: SkillProgress
    listening: SkillProgress
  }
  isLoading?: boolean
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-primary-400">{label}</span>
      <span className="font-semibold text-primary-700">{value}</span>
    </div>
  )
}

function SkillCard({
  title,
  icon: Icon,
  color,
  bgColor,
  data,
  type,
}: {
  title: string
  icon: React.ElementType
  color: string
  bgColor: string
  data: SkillProgress
  type: "cards" | "tests"
}) {
  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgColor} ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-primary-900">{title}</h3>
      </div>
      
      {!data.hasData ? (
        <div className="flex h-12 items-center justify-center text-xs text-primary-400 italic">
          Not enough data
        </div>
      ) : (
        <div className="space-y-1.5">
          {type === "cards" ? (
            <>
              <StatItem label="Mastered" value={`${data.graduatedCards} / ${data.totalCards}`} />
              <StatItem label="Coverage" value={`${data.coveragePercent}%`} />
            </>
          ) : (
            <>
              <StatItem label="Questions" value={data.totalAttempts ?? 0} />
              <StatItem label="Accuracy" value={`${data.accuracy}%`} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function ProgressOverview({ progress, isLoading }: ProgressOverviewProps) {
  if (isLoading) {
    return (
      <div className="card-base">
        <div className="mb-4 h-5 w-40 animate-pulse rounded-lg bg-primary-100" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-primary-50" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card-base">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary-400">
        Progress Overview
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SkillCard
          title="Vocabulary"
          icon={BookOpen}
          color="text-blue-600"
          bgColor="bg-blue-100"
          data={progress.vocabulary}
          type="cards"
        />
        <SkillCard
          title="Grammar"
          icon={SpellCheck}
          color="text-emerald-600"
          bgColor="bg-emerald-100"
          data={progress.grammar}
          type="cards"
        />
        <SkillCard
          title="Reading"
          icon={FileText}
          color="text-orange-600"
          bgColor="bg-orange-100"
          data={progress.reading}
          type="tests"
        />
        <SkillCard
          title="Listening"
          icon={Ear}
          color="text-purple-600"
          bgColor="bg-purple-100"
          data={progress.listening}
          type="tests"
        />
      </div>
    </div>
  )
}
