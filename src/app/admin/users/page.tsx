"use client"

import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel"
import { Button } from "@/components/ui/Button"

export default function AdminUsersPage() {
  return (
    <div className="flex min-h-screen-safe flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">
              Admin
            </p>
            <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-bold text-slate-900">
              <ShieldCheck className="h-6 w-6 text-primary-600" /> Quản lý user
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Bật hoặc tắt quyền sử dụng các tính năng AI theo tài khoản.
            </p>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Về trang chủ
            </Button>
          </Link>
        </div>
        <AdminUsersPanel />
      </main>
      <BottomNav />
    </div>
  )
}
