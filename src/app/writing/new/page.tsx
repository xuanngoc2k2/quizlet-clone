"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { QuestionImporter } from "@/components/writing/QuestionImporter"

export default function NewWritingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.replace("/writing/53")
    }
  }, [router, session?.user?.role, status])

  if (status === "loading") return null

  if (session?.user?.role !== "ADMIN") {
    return null
  }

  function handleSaved(id: string) {
    router.push(`/writing/${id}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-8">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-emerald-500 text-lg font-bold text-white shadow-lg">
            53
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Thêm đề mới</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload ảnh đề TOPIK — AI sẽ tự đọc và điền thông tin
          </p>
        </div>

        <QuestionImporter onSaved={handleSaved} />
      </main>
      <BottomNav />
    </div>
  )
}
