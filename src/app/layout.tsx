import type { Metadata, Viewport } from "next"
import { TRPCProvider } from "@/lib/trpc-provider"
import "@/styles/globals.css"

export const metadata: Metadata = {
  title: "Quizlet Clone",
  description: "Study with flashcards, quizzes, and more",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quizlet Clone",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="pb-safe-bottom">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
