"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  fallbackPath?: string
}

export default function ProtectedRoute({ children, requiredRole, fallbackPath = "/login" }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthorization()
  }, [requiredRole])

  const checkAuthorization = async () => {
    try {
      console.log(`[ProtectedRoute] Checking user role, required: ${requiredRole}`)

      const response = await fetch("/api/auth/me")
      console.log(`[ProtectedRoute] API response status: ${response.status}`)

      if (!response.ok) {
        console.log(`[ProtectedRoute] Failed to get user data (${response.status}), redirecting to login`)
        setIsAuthorized(false)
        setIsLoading(false)
        router.push(fallbackPath)
        return
      }

      const responseData = await response.json()
      console.log(`[ProtectedRoute] Full user data received:`, responseData)

      // Extract user data correctly from the API response
      const userData = responseData.user || responseData
      console.log(`[ProtectedRoute] Extracted user data:`, userData)

      if (!userData) {
        console.log(`[ProtectedRoute] No user data found`)
        setIsAuthorized(false)
        setIsLoading(false)
        router.push(fallbackPath)
        return
      }

      // Extract role from user data
      const userRole = userData.role
      console.log(`[ProtectedRoute] User role extracted: "${userRole}"`)
      console.log(`[ProtectedRoute] Required role: "${requiredRole}"`)

      if (requiredRole) {
        const hasRequiredRole = userRole === requiredRole
        console.log(`[ProtectedRoute] Role match result: ${hasRequiredRole}`)

        if (!hasRequiredRole) {
          console.log(`[ProtectedRoute] ❌ User not authorized`)
          console.log(`[ProtectedRoute] User role: "${userRole}", Required: "${requiredRole}"`)
          setIsAuthorized(false)
          setIsLoading(false)
          router.push(fallbackPath)
          return
        }
      }

      console.log(`[ProtectedRoute] ✅ User authorized`)
      setIsAuthorized(true)
      setIsLoading(false)
    } catch (error) {
      console.error(`[ProtectedRoute] Authorization check failed:`, error)
      setIsAuthorized(false)
      setIsLoading(false)
      router.push(fallbackPath)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking authorization...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Access denied. Redirecting...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
