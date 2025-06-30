"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "../lib/firebase/firebase"
import { getCookie } from "cookies-next"

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("[AuthProvider] Setting up auth state listener")

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("[AuthProvider] Auth state changed:", firebaseUser?.uid || "no user")

      if (firebaseUser) {
        setUser(firebaseUser)
      } else {
        // Check for user in cookies as fallback
        const userId = getCookie("user_id")?.toString()
        if (userId) {
          console.log("[AuthProvider] Found user in cookies:", userId)
          // Create a mock user object for cookie-based auth
          const mockUser = {
            uid: userId,
            email: getCookie("user_email")?.toString() || "",
            displayName: getCookie("user_name")?.toString() || "",
          } as User
          setUser(mockUser)
        } else {
          setUser(null)
        }
      }

      setLoading(false)
    })

    return () => {
      console.log("[AuthProvider] Cleaning up auth listener")
      unsubscribe()
    }
  }, [])

  console.log("[AuthProvider] Current state:", { user: user?.uid, loading })

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

// Export the useAuth hook that was missing
export const useAuth = () => useContext(AuthContext)

// Export the useAuthContext hook that was missing
export const useAuthContext = () => useContext(AuthContext)
