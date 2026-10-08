"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Writing54Importer } from "@/components/writing/Writing54Importer"

export default function NewWriting54Page() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.replace("/writing/54")
    }
  }, [router, session?.user?.role, status])

  if (status !== "authenticated" || session.user.role !== "ADMIN") return null

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-8">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-lg font-bold text-white">
            54
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Thêm đề câu 54</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload ảnh đề TOPIK II · AI sẽ trích xuất nội dung và barem
          </p>
        </div>
        <Writing54Importer onSaved={(id) => router.push(`/writing/54/${id}`)} />
      </main>
      <BottomNav />
    </div>
  )
}
