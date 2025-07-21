"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export function ProtectedRoute({ children, requiredRole = "user" }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("[ProtectedRoute] Checking user role, required:", requiredRole)

        const response = await fetch("/api/auth/me", {
          credentials: "include",
        })

        console.log("[ProtectedRoute] API response status:", response.status)

        if (!response.ok) {
          console.log("[ProtectedRoute] Failed to get user data (" + response.status + "), redirecting to login")
          router.push("/login")
          return
        }

        const userData = await response.json()
        console.log("[ProtectedRoute] Full user data received:", userData)

        const userRole = userData.role
        console.log("[ProtectedRoute] User role extracted:", JSON.stringify(userRole))
        console.log("[ProtectedRoute] Required role:", JSON.stringify(requiredRole))

        const roleMatch = userRole === requiredRole || requiredRole === "user"
        console.log("[ProtectedRoute] Role match result:", roleMatch)

        if (roleMatch) {
          console.log("[ProtectedRoute] ✅ User authorized")
          setIsAuthorized(true)
        } else {
          console.log("[ProtectedRoute] ❌ User not authorized")
          console.log(
            "[ProtectedRoute] User role:",
            JSON.stringify(userRole),
            "Required:",
            JSON.stringify(requiredRole),
          )
          router.push("/login")
        }
      } catch (error) {
        console.error("[ProtectedRoute] Error checking auth:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [requiredRole, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#CCFF00]"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
