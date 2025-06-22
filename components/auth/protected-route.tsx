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
  fallbackPath = "/mobile-app-success",
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
          credentials: "include", // Ensure cookies are sent
        })

        if (!response.ok) {
          console.log(`[ProtectedRoute] Failed to get user data (${response.status}), redirecting to login`)
          router.push("/login")
          return
        }

        const userData = await response.json()
        console.log(`[ProtectedRoute] User data:`, userData)

        const userRole = userData.role || null
        const hasRequiredRole = userRole === requiredRole

        console.log(
          `[ProtectedRoute] User role: "${userRole}", required: "${requiredRole}", authorized: ${hasRequiredRole}`,
        )

        if (hasRequiredRole) {
          setIsAuthorized(true)
          setUserId(userData.uid || userData.id) // Set user ID for feedback button
        } else {
          console.log(`[ProtectedRoute] User not authorized, redirecting to ${fallbackPath}`)
          router.push(fallbackPath)
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

  // Show loading while checking authorization
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

  // Don't render anything if not authorized (will redirect)
  if (isAuthorized !== true) {
    return null
  }

  // Only render children when explicitly authorized
  return (
    <>
      {children}
      <FloatingFeedbackButton userId={userId} />
    </>
  )
}
