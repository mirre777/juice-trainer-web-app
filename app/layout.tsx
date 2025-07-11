import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"
import { Toaster } from "@/components/ui/toaster"
import { ToastProvider } from "@/components/ui/toast-context"
import { FeedbackProvider } from "@/components/feedback/feedback-provider"
import { FloatingFeedbackButton } from "@/components/feedback/floating-feedback-button"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Juice - Personal Training Platform",
  description: "The ultimate platform for personal trainers and their clients",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider>
            <FeedbackProvider>
              {children}
              <FloatingFeedbackButton />
              <Toaster />
            </FeedbackProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
