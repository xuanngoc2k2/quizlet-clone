"use client"

import { useState } from "react"
import { api } from "@/lib/trpc-provider"
import { Button } from "@/components/ui/Button"
import { Target, CalendarDays, ChevronRight, Pencil, X, Check } from "lucide-react"

// ─── Goal Edit Modal ──────────────────────────────────────────────────────────

interface GoalFormData {
  examType: "TOPIK_I" | "TOPIK_II"
  targetLevel: number
  currentLevel: number | undefined
  examDate: string
  dailyStudyMinutes: number
}

function GoalEditModal({
  current,
  onClose,
}: {
  current: GoalFormData | null
  onClose: () => void
}) {
  const utils = api.useUtils()
  const setGoal = api.dashboard.setGoal.useMutation({
    onSuccess: () => {
      utils.dashboard.getGoal.invalidate()
      utils.dashboard.summary.invalidate()
      onClose()
    },
  })

  const [form, setForm] = useState<GoalFormData>({
    examType: current?.examType ?? "TOPIK_II",
    targetLevel: current?.targetLevel ?? 4,
    currentLevel: current?.currentLevel,
    examDate: current?.examDate ?? "",
    dailyStudyMinutes: current?.dailyStudyMinutes ?? 30,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGoal.mutate({
      examType: form.examType,
      targetLevel: form.targetLevel,
      currentLevel: form.currentLevel,
      examDate: form.examDate || undefined,
      dailyStudyMinutes: form.dailyStudyMinutes,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-primary-900">
            Set TOPIK Goal
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-400 hover:bg-primary-50 hover:text-primary-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Exam Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-700">
              Exam type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["TOPIK_I", "TOPIK_II"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, examType: t }))}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    form.examType === t
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-primary-100 text-primary-500 hover:border-primary-200"
                  }`}
                >
                  {t === "TOPIK_I" ? "TOPIK I (Level 1–2)" : "TOPIK II (Level 3–6)"}
                </button>
              ))}
            </div>
          </div>

          {/* Target Level */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-700">
              Target level
            </label>
            <div className="flex gap-2">
              {(form.examType === "TOPIK_I" ? [1, 2] : [3, 4, 5, 6]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, targetLevel: lvl }))}
                  className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-all ${
                    form.targetLevel === lvl
                      ? "border-primary-500 bg-primary-600 text-white"
                      : "border-primary-100 text-primary-500 hover:border-primary-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Current Level */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-700">
              Current level{" "}
              <span className="font-normal text-primary-400">(optional)</span>
            </label>
            <select
              value={form.currentLevel ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  currentLevel: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              className="w-full rounded-xl border border-primary-100 bg-primary-50/50 px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Not set</option>
              {[0, 1, 2, 3, 4, 5, 6].map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl === 0 ? "Beginner (no level)" : `Level ${lvl}`}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-700">
              Exam date{" "}
              <span className="font-normal text-primary-400">(optional)</span>
            </label>
            <input
              type="date"
              value={form.examDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
              className="w-full rounded-xl border border-primary-100 bg-primary-50/50 px-3 py-2 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* Daily Goal */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-700">
              Daily study goal:{" "}
              <span className="font-semibold text-primary-600">
                {form.dailyStudyMinutes} min/day
              </span>
            </label>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={form.dailyStudyMinutes}
              onChange={(e) =>
                setForm((f) => ({ ...f, dailyStudyMinutes: Number(e.target.value) }))
              }
              className="w-full accent-primary-600"
            />
            <div className="mt-1 flex justify-between text-xs text-primary-400">
              <span>5 min</span>
              <span>120 min</span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={setGoal.isPending}
              className="flex-1"
            >
              <Check className="h-4 w-4" />
              Save Goal
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-primary-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface GoalData {
  examType: string
  targetLevel: number
  currentLevel?: number | null
  examDate?: string | null
  daysRemaining?: number | null
  dailyStudyMinutes?: number | null
}

interface TopikGoalCardProps {
  goal: GoalData | null
  isLoading?: boolean
}

export function TopikGoalCard({ goal, isLoading }: TopikGoalCardProps) {
  const [editOpen, setEditOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="card-base flex flex-col gap-4">
        <div className="h-5 w-32 animate-pulse rounded-lg bg-primary-100" />
        <div className="h-20 animate-pulse rounded-xl bg-primary-50" />
        <div className="h-8 animate-pulse rounded-xl bg-primary-100" />
      </div>
    )
  }

  if (!goal) {
    return (
      <>
        {editOpen && (
          <GoalEditModal current={null} onClose={() => setEditOpen(false)} />
        )}
        <div className="card-base flex flex-col items-center justify-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-400">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-primary-800">Set your TOPIK goal</p>
            <p className="mt-1 text-sm text-primary-400">
              Choose your target level and exam date to personalize your dashboard.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setEditOpen(true)}>
            Set Goal
          </Button>
        </div>
      </>
    )
  }

  // Compute progress percentage (very rough estimate based on levels)
  const currentLvl = goal.currentLevel ?? 0
  const progressPercent =
    goal.targetLevel > 0
      ? Math.round((currentLvl / goal.targetLevel) * 100)
      : 0

  const levelLabel =
    goal.examType === "TOPIK_I" ? "TOPIK I" : "TOPIK II"

  return (
    <>
      {editOpen && (
        <GoalEditModal
          current={{
            examType: goal.examType as "TOPIK_I" | "TOPIK_II",
            targetLevel: goal.targetLevel,
            currentLevel: goal.currentLevel ?? undefined,
            examDate: goal.examDate ?? "",
            dailyStudyMinutes: goal.dailyStudyMinutes ?? 30,
          }}
          onClose={() => setEditOpen(false)}
        />
      )}

      <div className="card-base flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Target className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-primary-400">
              My TOPIK Goal
            </h2>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-primary-300 hover:bg-primary-50 hover:text-primary-500 transition-colors"
            aria-label="Edit goal"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Goal info */}
        <div>
          <p className="font-display text-2xl font-bold text-primary-900">
            {levelLabel}
          </p>
          <p className="text-sm text-primary-500">
            Target Level{" "}
            <span className="font-semibold text-primary-700">{goal.targetLevel}</span>
            {goal.currentLevel != null && (
              <> · Current Level <span className="font-semibold text-primary-700">{goal.currentLevel}</span></>
            )}
          </p>
        </div>

        {/* Exam date & countdown */}
        {goal.examDate && (
          <div className="flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary-500" />
            <div className="min-w-0">
              <p className="text-xs text-primary-400">Exam date</p>
              <p className="text-sm font-semibold text-primary-800">
                {new Date(goal.examDate).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            {goal.daysRemaining != null && (
              <div className="ml-auto shrink-0 text-right">
                <p className="font-display text-xl font-bold text-primary-600 leading-none">
                  {goal.daysRemaining}
                </p>
                <p className="text-[10px] text-primary-400">days left</p>
              </div>
            )}
          </div>
        )}

        {/* Progress toward target */}
        {goal.currentLevel != null && (
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-primary-400">
              <span>Level progress</span>
              <span className="font-semibold text-primary-600">{progressPercent}%</span>
            </div>
            <ProgressBar percent={progressPercent} />
          </div>
        )}

        {/* Study plan link */}
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center justify-center gap-1 rounded-xl border border-primary-100 py-2 text-sm font-medium text-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-colors"
        >
          Edit Study Plan
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </>
  )
}
