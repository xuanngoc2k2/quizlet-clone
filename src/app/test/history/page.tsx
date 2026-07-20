"use client"

import { useRouter } from "next/navigation"
import { api } from "@/lib/trpc-provider"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/Button"
import { Clock, RotateCw, Trash2, Loader2, FileText } from "lucide-react"

export default function TestHistoryPage() {
  const router = useRouter()
  const { data: tests, isLoading, error } = api.testHistory.list.useQuery()
  const deleteTest = api.testHistory.delete.useMutation()

  async function handleDelete(id: string) {
    if (!confirm("Xóa bài test này?")) return
    await deleteTest.mutateAsync({ id })
  }

  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="flex-1 px-4 pb-24 pt-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-primary-900">Lịch sử bài test</h1>
            <p className="text-xs text-primary-500">Các bài test đã tạo</p>
          </div>
          <Button onClick={() => router.push("/test")} variant="gradient" size="sm">
            Test mới
          </Button>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="mb-3 h-6 w-6 animate-spin text-primary-400" />
            <p className="text-sm text-primary-500">Đang tải...</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error.message}
          </div>
        )}

        {tests && tests.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <FileText className="mb-3 h-10 w-10 text-primary-300" />
            <p className="text-sm font-medium text-primary-500">Chưa có bài test nào</p>
            <p className="mt-1 text-xs text-primary-400">Tạo test mới để bắt đầu</p>
            <Button onClick={() => router.push("/test")} variant="gradient" className="mt-4">
              Tạo test mới
            </Button>
          </div>
        )}

        {tests && tests.length > 0 && (
          <div className="flex flex-col gap-3">
            {tests.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-primary-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-primary-900">{t.title}</h3>
                    <p className="mt-0.5 line-clamp-1 text-xs text-primary-500">{t.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-primary-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                      <span>{t.attemptCount} lần làm</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => router.push(`/test?retake=${t.id}`)}
                    variant="gradient"
                    size="sm"
                    className="flex-1"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Làm lại
                  </Button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="flex items-center justify-center rounded-xl border border-red-200 px-3 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
