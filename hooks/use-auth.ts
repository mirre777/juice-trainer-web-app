"use client"

// Placeholder for hooks/use-auth.ts
import { useState, useEffect } from "react"

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Simulate auth check
    setTimeout(() => {
      const mockUser = { id: "mock-user-123", email: "test@example.com", role: "trainer" }
      setUser(mockUser)
      setIsAuthenticated(true)
      setUserRole(mockUser.role)
      setLoading(false)
    }, 100)
  }, [])

  return { user, loading, isAuthenticated, userRole }
}
