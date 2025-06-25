"use client"

import type React from "react"

import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import LoadingSpinner from "@/components/shared/loading-spinner" // Corrected import

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "trainer" | "client" | "admin"
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated, userRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log(
      "ProtectedRoute: useEffect triggered. Loading:",
      loading,
      "IsAuthenticated:",
      isAuthenticated,
      "UserRole:",
      userRole,
      "RequiredRole:",
      requiredRole,
    )
    if (!loading) {
      if (!isAuthenticated) {
        console.log("ProtectedRoute: Not authenticated, redirecting to /login.")
        router.push("/login")
      } else if (requiredRole && userRole && userRole !== requiredRole) {
        console.log(
          `ProtectedRoute: User role (${userRole}) does not match required role (${requiredRole}), redirecting to /dashboard.`,
        )
        router.push("/dashboard")
      } else {
        console.log("ProtectedRoute: User authenticated and authorized. Rendering children.")
      }
    } else {
      console.log("ProtectedRoute: Still loading authentication state.")
    }
  }, [loading, isAuthenticated, requiredRole, userRole, router])

  if (loading) {
    console.log("ProtectedRoute: Displaying loading spinner.")
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthenticated || (requiredRole && userRole && userRole !== requiredRole)) {
    console.log("ProtectedRoute: Not authenticated or not authorized. Returning null (waiting for redirect).")
    return null
  }

  console.log("ProtectedRoute: Rendering children.")
  return <>{children}</>
}
