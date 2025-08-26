

import type React from "react"
import { Sen, Inter } from "next/font/google"
import { ToastProvider } from "@/components/ui/toast-context"
import "./globals.css"
import { SkeletonTheme } from "react-loading-skeleton"
import { LayoutWrapper } from "@/components/layout-wrapper"

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sen.variable} ${inter.variable}`}>
      <body>
        <SkeletonTheme baseColor="#202020" highlightColor="#444">
          <ToastProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </ToastProvider>
        </SkeletonTheme>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
