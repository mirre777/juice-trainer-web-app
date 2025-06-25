"use client"

import type React from "react"

import { useRouter } from "next/router"
import { useEffect } from "react"
import { useSession } from "next-auth/react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const router = useRouter()
  const { status, data: session } = useSession()

  useEffect(() => {
    if (status === "loading") {
      return // Do nothing while loading
    }

    if (status === "unauthenticated") {
      router.push("/auth/signin") // Redirect to signin page if not authenticated
    } else if (session && requiredRoles && requiredRoles.length > 0) {
      const userRoles = session.user?.roles || []
      const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role))

      if (!hasRequiredRole) {
        router.push("/unauthorized") // Redirect to unauthorized page if missing required role
      }
    }
  }, [status, session, router, requiredRoles])

  if (
    status === "loading" ||
    (session &&
      requiredRoles &&
      requiredRoles.length > 0 &&
      !requiredRoles.some((role) => session.user?.roles?.includes(role)))
  ) {
    return <div>Loading...</div> // Or a loading spinner
  }

  if (status === "authenticated") {
    return <>{children}</>
  }

  return null // Or a fallback component
}

export default ProtectedRoute
