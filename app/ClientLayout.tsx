"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { UnifiedHeader } from "@/components/unified-header"
import { FeedbackProvider } from "@/components/feedback/feedback-provider"
import { FloatingFeedbackButton } from "@/components/feedback/floating-feedback-button"
import { DemoBanner } from "@/components/demo-banner"
import { ToastProvider } from "@/components/ui/toast-context"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return null
  }

  // Check if we should show the header
  const shouldShowHeader =
    !pathname?.startsWith("/shared/") &&
    !pathname?.startsWith("/demo/client-workout") &&
    pathname !== "/login" &&
    pathname !== "/signup" &&
    pathname !== "/pricing" &&
    !pathname?.startsWith("/invite/")

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <ToastProvider>
        <FeedbackProvider>
          <div className="min-h-screen bg-background">
            <DemoBanner />
            {shouldShowHeader && <UnifiedHeader />}
            <main className={shouldShowHeader ? "pt-16" : ""}>{children}</main>
            <FloatingFeedbackButton />
          </div>
          <Toaster />
        </FeedbackProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
