"use client"

import { useState } from "react"
import { ShieldCheck, Sparkles, UserRound } from "lucide-react"
import { api } from "@/lib/trpc-provider"

export function AdminUsersPanel() {
  const [search, setSearch] = useState("")
  const usersQuery = api.admin.listUsers.useQuery({ search: search || undefined })
  const updateUser = api.admin.updateUser.useMutation({
    onSuccess: () => usersQuery.refetch(),
  })

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">{usersQuery.data?.length ?? 0} tài khoản</p>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tên hoặc email"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="hidden grid-cols-[minmax(0,1fr)_130px_150px_100px] gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
          <span>User</span>
          <span>Role</span>
          <span>AI access</span>
          <span>Sets</span>
        </div>
        {usersQuery.isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Đang tải danh sách...</div>
        ) : usersQuery.data?.length ? (
          usersQuery.data.map((user) => {
            const isAdmin = user.role === "ADMIN"
            return (
              <div
                key={user.id}
                className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_130px_150px_100px] sm:items-center sm:gap-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {user.image ? (
                    <img src={user.image} alt="" className="h-9 w-9 rounded-full" />
                  ) : (
                    <UserRound className="h-9 w-9 rounded-full bg-slate-100 p-2 text-slate-500" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {user.name || "Chưa có tên"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user.email || "Không có email"}
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="sm:hidden">Role:</span>
                  <select
                    value={user.role}
                    disabled={
                      user.email?.toLowerCase() === "xuanngoc2k2@gmail.com" || updateUser.isPending
                    }
                    onChange={(event) =>
                      updateUser.mutate({
                        userId: user.id,
                        role: event.target.value as "USER" | "ADMIN",
                        canUseAI: user.canUseAI,
                      })
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm disabled:bg-slate-50"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  {isAdmin && <ShieldCheck className="h-4 w-4 text-primary-600" />}
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={user.canUseAI}
                    disabled={
                      user.email?.toLowerCase() === "xuanngoc2k2@gmail.com" || updateUser.isPending
                    }
                    onChange={(event) =>
                      updateUser.mutate({
                        userId: user.id,
                        role: user.role as "USER" | "ADMIN",
                        canUseAI: event.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-primary-600"
                  />
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>{user.canUseAI ? "Được phép" : "Đã tắt"}</span>
                </label>
                <span className="text-sm text-slate-500 sm:text-center">{user._count.sets}</span>
              </div>
            )
          })
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">Không tìm thấy user.</div>
        )}
      </div>
      {updateUser.error && <p className="text-sm text-rose-600">{updateUser.error.message}</p>}
    </section>
  )
}
