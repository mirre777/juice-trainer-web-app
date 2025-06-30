import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/AuthContext"
import { FeedbackProvider } from "@/context/FeedbackContext"
import FloatingFeedbackButton from "@/components/FloatingFeedbackButton"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Juice Trainer - Personal Training Platform",
  description: "Professional personal training platform for trainers and clients",
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
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
