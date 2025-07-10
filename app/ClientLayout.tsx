"use client"

import type React from "react"
import { AuthProvider } from "@/context/AuthContext"
import { FeedbackProvider } from "@/components/feedback/feedback-provider"
import { FloatingFeedbackButton } from "@/components/feedback/floating-feedback-button"
import { ErrorBoundary } from "@/components/error-boundary"
import { usePathname } from "next/navigation"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show feedback on auth pages
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup")

  return (
    <ErrorBoundary>
      <AuthProvider>
        <FeedbackProvider>
          {children}
          {!isAuthPage && <FloatingFeedbackButton />}
        </FeedbackProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
