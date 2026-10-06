"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { WritingQuestion51Importer } from "@/components/writing/WritingQuestion51Importer"

export default function NewWriting51Page() {
  const router = useRouter()
  return <div className="flex min-h-screen flex-col"><Header /><main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-8"><button type="button" onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600"><ArrowLeft className="h-4 w-4" />Quay lại</button><div className="mb-6"><h1 className="font-display text-2xl font-bold text-slate-900">Thêm đề câu 51</h1><p className="mt-1 text-sm text-slate-500">Upload ảnh đề để AI phân tích passage, blank và đáp án.</p></div><WritingQuestion51Importer onSaved={(id) => router.push(`/writing/51/${id}`)} /></main><BottomNav /></div>
}