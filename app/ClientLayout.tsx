"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { UnifiedHeader } from "@/components/unified-header"
import { FeedbackProvider } from "@/components/feedback/feedback-provider"
import { FloatingFeedbackButton } from "@/components/feedback/floating-feedback-button"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render header on certain pages
  const hideHeader =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/pricing" ||
    pathname?.startsWith("/invite/") ||
    pathname?.startsWith("/shared/") ||
    pathname === "/set-password" ||
    pathname === "/mobile-app-success" ||
    pathname === "/signup-juice-app"

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <FeedbackProvider>
        <div className="min-h-screen bg-background">
          {!hideHeader && <UnifiedHeader />}
          <main className={hideHeader ? "" : "pt-16"}>{children}</main>
          <FloatingFeedbackButton />
        </div>
        <Toaster />
      </FeedbackProvider>
    </ThemeProvider>
  )
}
