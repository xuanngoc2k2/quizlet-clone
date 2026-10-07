import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Writing54List } from "@/components/writing/Writing54List"

export default function Writing54ListPage() {
  return <div className="flex min-h-screen flex-col"><Header /><main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-8"><Writing54List /></main><BottomNav /></div>
}
