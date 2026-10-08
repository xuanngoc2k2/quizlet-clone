"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Plus, FileText, Loader2, PenLine, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { api } from "@/lib/trpc-provider"
import { getWritingScoreStatus } from "@/lib/writing-score-status"

export function Writing53List() {
  const [page, setPage] = useState(1)
  const { data: session } = useSession()
  const { data, isLoading } = api.writing.listQuestions.useQuery({ page })
  const questions = data?.questions
  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">쓰기 연습 · Câu 53</h1>
          <p className="mt-0.5 text-sm text-slate-500">TOPIK II · 원고지 200~300자</p>
        </div>
        {isAdmin && (
          <Link href="/writing/new">
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" />
              Thêm đề
            </Button>
          </Link>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      )}

      {!isLoading && questions?.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <PenLine className="h-7 w-7 text-slate-500" />
          </div>
          <p className="font-semibold text-slate-700">Chưa có đề nào</p>
          {isAdmin && (
            <>
              <p className="mt-1 text-sm text-slate-500">
                Nhấn “Thêm đề” để upload ảnh đề thi TOPIK
              </p>
              <Link href="/writing/new" className="mt-4">
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4" />
                  Thêm đề đầu tiên
                </Button>
              </Link>
            </>
          )}
        </div>
      )}

      {!isLoading && questions && questions.length > 0 && (
        <div className="space-y-2 py-1">
          {questions.map((question) => {
            const scoreStatus = getWritingScoreStatus(
              question._count.attempts,
              question.latestScore,
            )

            return (
              <Link key={question.id} href={`/writing/53/${question.id}`} className="block">
                <div className={`card-hover p-4 ${scoreStatus.cardClassName}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-emerald-500 text-xs font-bold text-white">
                      53
                    </span>
                    {question.examRef && (
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-600">
                        {question.examRef}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-slate-500">
                      {question.rangeMin}~{question.rangeMax}자
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-800">{question.instruction}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${scoreStatus.badgeClassName}`}
                    >
                      {scoreStatus.label}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {question._count.attempts} lần làm
                    </span>
                    {question.latestScore !== null && (
                      <span>Gần nhất: {question.latestScore}/30 điểm</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(question.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((currentPage) => currentPage - 1)}
            disabled={page === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-slate-500">
            Trang {page} / {data.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((currentPage) => currentPage + 1)}
            disabled={page === data.totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  )
}
