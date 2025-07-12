import type React from "react"
import type { Metadata } from "next"
import { Sen, Inter } from "next/font/google"
import "./globals.css"
import { ClientLayout } from "./ClientLayout"

// Initialize the Sen font
const sen = Sen({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-sen",
  display: "swap",
})

// Initialize the Inter font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Juice Trainer - Personal Training Platform",
  description: "Professional personal training platform for trainers and clients",
  generator: "Next.js",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sen.variable} ${inter.variable}`}>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
