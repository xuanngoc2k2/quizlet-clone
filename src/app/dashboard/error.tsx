"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { AlertCircle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertCircle className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">Something went wrong!</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          We encountered an error while loading your dashboard. Please try again.
        </p>
      </div>
      <Button onClick={() => reset()} variant="secondary">
        Try again
      </Button>
    </div>
  )
}
