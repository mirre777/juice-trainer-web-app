"use client"

import type React from "react"

import { useRouter } from "next/router"
import { useEffect } from "react"
import { useSession } from "next-auth/react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return <div>Loading...</div> // Or a loading spinner
  }

  if (status === "authenticated") {
    return <>{children}</>
  }

  return null
}

export default ProtectedRoute
