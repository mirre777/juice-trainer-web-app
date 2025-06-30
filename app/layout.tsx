import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import ToastProvider from "@/components/providers/toast-provider"
import FeedbackProvider from "@/context/FeedbackContext"
import AuthProvider from "@/context/AuthContext"
import FloatingFeedbackButton from "@/components/FloatingFeedbackButton"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Juice Trainer",
  description: "Professional fitness coaching platform",
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ToastProvider>
              <FeedbackProvider>
                {children}
                <FloatingFeedbackButton />
              </FeedbackProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
