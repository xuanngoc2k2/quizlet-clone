import type { Metadata, Viewport } from "next"
import { TRPCProvider } from "@/lib/trpc-provider"
import { SessionProvider } from "@/components/layout/SessionProvider"
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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    shortcut: "/favicon.ico",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#4F46E5",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="pb-safe-bottom bg-slate-50 text-slate-900">
        <SessionProvider>
          <TRPCProvider>
            <ClientShell>{children}</ClientShell>
          </TRPCProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
