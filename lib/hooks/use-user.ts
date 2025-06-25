"use client"

// Placeholder for lib/hooks/use-user.ts
import { useState, useEffect } from "react"

export function useUser() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Simulate fetching user data
    setTimeout(() => {
      setUser({ id: "user123", name: "Demo User", email: "demo@example.com" })
    }, 100)
  }, [])

  const updateUser = (newUserData: any) => {
    setUser(newUserData)
  }

  return { user, updateUser }
}
