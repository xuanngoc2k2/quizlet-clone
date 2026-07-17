import type { Metadata, Viewport } from "next"
import { TRPCProvider } from "@/lib/trpc-provider"
import { ClientShell } from "@/components/layout/ClientShell"
import "@/styles/globals.css"

export const metadata: Metadata = {
  title: {
    default: "Quizlet Clone",
    template: "%s | Quizlet Clone",
  },
  description: "Study with flashcards, quizzes, and more",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quizlet Clone",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#2563EB",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="pb-safe-bottom bg-gray-50">
        <TRPCProvider>
          <ClientShell>{children}</ClientShell>
        </TRPCProvider>
      </body>
    </html>
  )
}
