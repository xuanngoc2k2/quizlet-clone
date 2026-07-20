import dynamic from "next/dynamic"

const TestPageInner = dynamic(() => import("./TestPageInner"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen-safe flex-col">
      <div className="flex-1 px-4 pb-24 pt-4">
        <div className="flex flex-col items-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-200 border-t-primary-500" />
        </div>
      </div>
    </div>
  ),
})

export default function TestPage() {
  return <TestPageInner />
}
