"use client"

import { UnifiedHeader } from "@/components/unified-header"
import { usePathname } from "next/navigation"
import type React from "react"

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()

  // Define paths where the header should NOT be shown
  const noHeaderPaths = [
    "/login",
    "/signup",
    "/set-password",
    "/invite-app",
    "/mobile-app-success",
    "/payment-success",
    "/pricing", // Pricing page might have its own header or no header
  ]

  // Check if the current path starts with any of the noHeaderPaths
  const shouldHideHeader = noHeaderPaths.some((path) => pathname?.startsWith(path))

  // Special handling for shared workout pages
  const isSharedWorkoutPage = pathname?.startsWith("/shared/") || pathname?.startsWith("/share/")

  // If it's a shared workout page, and it's not the root landing page, hide the header
  // The root landing page (`/`) handles shared workouts internally and has its own layout.
  const hideHeaderForSharedWorkout =
    isSharedWorkoutPage && pathname !== "/" && pathname !== "/login" && pathname !== "/signup"

  return (
    <>
      {/* Render UnifiedHeader only if not on a path where it should be hidden */}
      {!shouldHideHeader && !hideHeaderForSharedWorkout && <UnifiedHeader />}
      <main>{children}</main>
    </>
  )
}
