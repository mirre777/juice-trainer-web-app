"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LoadingSpinner from "@/components/shared/loading-spinner"
import { FloatingFeedbackButton } from "@/components/feedback/floating-feedback-button"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  fallbackPath?: string
}

export function ProtectedRoute({
  children,
  requiredRole = "trainer",
  fallbackPath = "/login", // CHANGED: Default to login instead of mobile-app-success
}: ProtectedRouteProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        console.log(`[ProtectedRoute] Checking user role, required: ${requiredRole}`)

        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store", // Ensure fresh data
        })

        console.log(`[ProtectedRoute] API response status: ${response.status}`)

        if (!response.ok) {
          console.log(`[ProtectedRoute] Failed to get user data (${response.status}), redirecting to login`)
          router.push("/login")
          return
        }

        const userData = await response.json()
        console.log(`[ProtectedRoute] Full user data received:`, userData)

        const userRole = userData.role || userData.user_type || null
        console.log(`[ProtectedRoute] User role extracted: "${userRole}"`)
        console.log(`[ProtectedRoute] Required role: "${requiredRole}"`)

        // More flexible role checking
        const hasRequiredRole =
          userRole === requiredRole ||
          (requiredRole === "trainer" && userRole === "trainer") ||
          (requiredRole === "user" && (userRole === "user" || userRole === "client"))

        console.log(`[ProtectedRoute] Role match result: ${hasRequiredRole}`)

        if (hasRequiredRole) {
          console.log(`[ProtectedRoute] ✅ User authorized, showing protected content`)
          setIsAuthorized(true)
          setUserId(userData.uid || userData.id)
        } else {
          console.log(`[ProtectedRoute] ❌ User not authorized`)
          console.log(`[ProtectedRoute] User role: "${userRole}", Required: "${requiredRole}"`)

          // Special handling for trainers who shouldn't see mobile app success
          if (userRole === "trainer" && requiredRole === "trainer") {
            console.log(`[ProtectedRoute] Trainer detected but role check failed - this shouldn't happen`)
            setIsAuthorized(true) // Force authorization for trainers
            setUserId(userData.uid || userData.id)
          } else if (userRole === "trainer") {
            console.log(`[ProtectedRoute] Trainer trying to access non-trainer content, redirecting to overview`)
            router.push("/overview")
          } else {
            console.log(`[ProtectedRoute] Redirecting to fallback: ${fallbackPath}`)
            router.push(fallbackPath)
          }
          return
        }
      } catch (error) {
        console.error("[ProtectedRoute] Error checking user role:", error)
        router.push("/login")
        return
      } finally {
        setIsLoading(false)
      }
    }

    checkUserRole()
  }, [requiredRole, fallbackPath, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (isAuthorized !== true) {
    return null
  }

  return (
    <>
      {children}
      <FloatingFeedbackButton userId={userId} />
    </>
  )
}
