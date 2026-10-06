"use client"

import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { api } from "@/lib/trpc-provider"
import { WritingQuestion51Practice } from "@/components/writing/WritingQuestion51Practice"
import type { WritingQuestion51 } from "@/lib/writing-types"

export default function Writing51PracticePage({ params }: { params: { id: string } }) {
  const { data, isLoading, error } = api.writing51.getQuestion.useQuery({ id: params.id })
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-8">
        <Link
          href="/writing/51"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách câu 51
        </Link>
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        )}
        {(error || !data) && !isLoading && (
          <p className="py-12 text-center text-rose-600">Không tìm thấy đề bài</p>
        )}
        {data && <WritingQuestion51Practice question={data as unknown as WritingQuestion51} />}
      </main>
      <BottomNav />
    </div>
  )
}
