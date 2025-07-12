import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { FeedbackProvider } from "@/components/feedback/feedback-provider"
import { FloatingFeedbackButton } from "@/components/feedback/floating-feedback-button"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Juice - Personal Training Platform",
  description: "Streamline your personal training business with Juice",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <FeedbackProvider>
              {children}
              <FloatingFeedbackButton />
              <Toaster />
            </FeedbackProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
