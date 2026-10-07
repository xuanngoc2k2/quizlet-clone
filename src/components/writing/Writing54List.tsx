"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Clock, FileText, Loader2, PenLine, Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { api } from "@/lib/trpc-provider"

export function Writing54List() {
  const [page, setPage] = React.useState(1)
  const { data, isLoading } = api.writing54.listQuestions.useQuery({ page })
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">쓰기 연습 · Câu 54</h1>
          <p className="mt-0.5 text-sm text-slate-500">TOPIK II · 원고지 600~700자 · 50 điểm</p>
        </div>
        <Link href="/writing/54/new">
          <Button variant="gradient" size="sm">
            <Plus className="h-4 w-4" />
            Thêm đề
          </Button>
        </Link>
      </div>
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      )}
      {!isLoading && data?.questions.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
          <PenLine className="mb-3 h-8 w-8 text-slate-400" />
          <p className="font-semibold text-slate-700">Chưa có đề câu 54</p>
          <Link href="/writing/54/new" className="mt-4">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Thêm đề đầu tiên
            </Button>
          </Link>
        </div>
      )}
      <div className="space-y-2">
        {data?.questions.map((question) => (
          <Link key={question.id} href={`/writing/54/${question.id}`} className="block">
            <div className="card-hover p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 text-xs font-bold text-white">
                  54
                </span>
                {question.examRef && (
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] text-orange-700">
                    {question.examRef}
                  </span>
                )}
                <span className="ml-auto text-[11px] text-slate-500">
                  {question.rangeMin}~{question.rangeMax}자
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-slate-800">{question.instruction}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {question._count.attempts} lần làm
                </span>
                {question.latestScore !== null && (
                  <span className="font-semibold text-emerald-600">
                    Gần nhất: {question.latestScore}/50
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(question.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {data && data.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((value) => value - 1)}
            disabled={page === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-slate-500">
            Trang {page} / {data.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => value + 1)}
            disabled={page === data.totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  )
}
