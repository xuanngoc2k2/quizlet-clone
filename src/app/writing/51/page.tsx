"use client"

import Link from "next/link"
import { Plus, ChevronLeft, ChevronRight, FileText, Loader2, Users } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/Button"
import { api } from "@/lib/trpc-provider"
import { useSession } from "next-auth/react"
import { useState } from "react"

export default function Writing51ListPage() {
  const [page, setPage] = useState(1)
  const { data: session } = useSession()
  const { data, isLoading } = api.writing51.listQuestions.useQuery({ page })
  const isAdmin = session?.user?.role === "ADMIN"
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">쓰기 연습 · Câu 51</h1>
            <p className="mt-1 text-sm text-slate-500">Điền cụm từ thích hợp vào chỗ trống</p>
          </div>
          {isAdmin && (
            <Link href="/writing/51/new">
              <Button variant="gradient" size="sm">
                <Plus className="h-4 w-4" />
                Thêm đề câu 51
              </Button>
            </Link>
          )}
        </div>
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        )}
        {!isLoading && data?.questions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
            <p className="font-semibold text-slate-700">Chưa có đề câu 51</p>
            {isAdmin && (
              <Link href="/writing/51/new" className="mt-4 inline-block">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Thêm đề đầu tiên
                </Button>
              </Link>
            )}
          </div>
        )}
        <div className="space-y-2">
          {data?.questions.map((question) => (
            <Link
              key={question.id}
              href={`/writing/51/${question.id}`}
              className="card-hover block p-4"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-emerald-500 text-xs font-bold text-white">
                  {question.questionNumber}
                </span>
                <span className="font-semibold text-slate-800">{question.title}</span>
                <span className="ml-auto text-xs text-slate-500">{question.score}점</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{question.instruction}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                <span>{question.blankCount} blank</span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {question._count.attempts} lần làm
                </span>
                {isAdmin && (
                  <span className="flex items-center gap-1 font-medium text-primary-600">
                    <Users className="h-3 w-3" />
                    {question.participantCount} người
                  </span>
                )}
                {question.latestScore !== null && (
                  <span>
                    Gần nhất: {question.latestScore}/{question.latestMaxScore}
                  </span>
                )}
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
              aria-label="Trang trước"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
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
              aria-label="Trang sau"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
