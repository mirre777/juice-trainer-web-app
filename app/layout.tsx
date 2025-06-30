import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/providers/toast-provider"
import { FeedbackProvider } from "@/context/FeedbackContext"
import { FloatingFeedbackButton } from "@/components/FloatingFeedbackButton"
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <ToastProvider />
            <FeedbackProvider>
              {children}
              <FloatingFeedbackButton />
            </FeedbackProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
