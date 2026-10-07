"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, LockKeyhole, PenLine } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"

export default function WritingListPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-8">
        <div className="mb-7">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">쓰기 연습</h1>
            <p className="mt-1 text-sm text-slate-500">
              Chọn dạng câu TOPIK II để bắt đầu luyện viết
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <WritingTypeCard
            href="/writing/51"
            number="51"
            title="Điền vào chỗ trống"
            description="Hoàn thành đoạn văn bằng cụm từ phù hợp."
            icon={<BookOpen className="h-5 w-5" />}
          />
          <WritingTypeCard
            href="/writing/53"
            number="53"
            title="Viết bài theo biểu đồ"
            description="Phân tích số liệu và viết bài 200~300자."
            icon={<PenLine className="h-5 w-5" />}
          />
          <WritingTypeCard
            number="52"
            title="Viết câu theo tranh"
            description="Luyện viết câu mô tả theo hình ảnh."
            disabled
          />
          <WritingTypeCard
            href="/writing/54"
            number="54"
            title="Bài luận"
            description="Luyện viết bài luận theo chủ đề xã hội."
            icon={<PenLine className="h-5 w-5" />}
          />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}

function WritingTypeCard({
  href,
  number,
  title,
  description,
  icon,
  disabled = false,
}: {
  href?: string
  number: string
  title: string
  description: string
  icon?: React.ReactNode
  disabled?: boolean
}) {
  const content = (
    <div
      className={`card-hover flex min-h-36 items-center gap-4 p-5 ${
        disabled ? "cursor-not-allowed opacity-65" : ""
      }`}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-emerald-500 text-lg font-bold text-white shadow-sm">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {icon ?? <LockKeyhole className="h-4 w-4 text-slate-400" />}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-600">
          {disabled ? "Sắp ra mắt" : "Bắt đầu luyện"}
          {!disabled && <ArrowRight className="h-3.5 w-3.5" />}
        </span>
      </div>
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
