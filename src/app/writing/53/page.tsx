import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Writing53List } from "@/components/writing/Writing53List"

export default function Writing53ListPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-8">
        <Writing53List />
      </main>
      <BottomNav />
    </div>
  )
}
