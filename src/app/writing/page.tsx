"use client"

import Link from "next/link"
import { Plus, FileText, Loader2, PenLine, Clock } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/Button"
import { api } from "@/lib/trpc-provider"

export default function WritingListPage() {
  const { data: questions, isLoading } = api.writing.listQuestions.useQuery()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        {/* Title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-primary-900">쓰기 연습</h1>
            <p className="mt-0.5 text-sm text-primary-500">TOPIK II · Câu 53 · 원고지 200~300자</p>
          </div>
          <Link href="/writing/new">
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" />
              Thêm đề
            </Button>
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && questions?.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-primary-200 bg-white py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
              <PenLine className="h-7 w-7 text-primary-400" />
            </div>
            <p className="font-semibold text-primary-700">Chưa có đề nào</p>
            <p className="mt-1 text-sm text-primary-400">
              Nhấn &ldquo;Thêm đề&rdquo; để upload ảnh đề thi TOPIK
            </p>
            <Link href="/writing/new" className="mt-4">
              <Button variant="primary" size="sm">
                <Plus className="h-4 w-4" />
                Thêm đề đầu tiên
              </Button>
            </Link>
          </div>
        )}

        {/* List */}
        {!isLoading && questions && questions.length > 0 && (
          <div className="space-y-3">
            {questions.map((q) => (
              <Link key={q.id} href={`/writing/${q.id}`}>
                <div className="card-hover p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-emerald-500 text-xs font-bold text-white">
                      53
                    </span>
                    {q.examRef && (
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-600">
                        {q.examRef}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-primary-400">
                      {q.rangeMin}~{q.rangeMax}자
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-primary-800">{q.instruction}</p>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-primary-400">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {q._count.attempts} lần làm
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(q.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
