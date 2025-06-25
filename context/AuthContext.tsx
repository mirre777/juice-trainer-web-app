"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getAuth, onAuthStateChanged, type User } from "firebase/auth"
import { firebaseApp } from "@/lib/firebase/firebase"
import { getUserData } from "@/lib/firebase/user-data-service"

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  userRole: string | null
  userData: any | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userData, setUserData] = useState<any | null>(null)

  useEffect(() => {
    console.log("AuthContext: Initializing auth state listener.")
    const auth = getAuth(firebaseApp)
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log(
        "AuthContext: onAuthStateChanged callback fired. Current user:",
        currentUser ? currentUser.uid : "null",
      )
      setUser(currentUser)
      setIsAuthenticated(!!currentUser)

      if (currentUser) {
        console.log("AuthContext: User is logged in. Fetching user data for UID:", currentUser.uid)
        try {
          const fetchedUserData = await getUserData(currentUser.uid)
          setUserData(fetchedUserData)
          setUserRole(fetchedUserData?.role || null)
          console.log("AuthContext: Fetched user data:", fetchedUserData)
          console.log("AuthContext: User role set to:", fetchedUserData?.role || "null")
        } catch (error) {
          console.error("AuthContext: Error fetching user data:", error)
          setUserData(null)
          setUserRole(null)
        }
      } else {
        console.log("AuthContext: User is logged out.")
        setUserData(null)
        setUserRole(null)
      }
      setLoading(false)
      console.log("AuthContext: Loading set to false. IsAuthenticated:", !!currentUser, "UserRole:", userRole)
    })

    return () => {
      console.log("AuthContext: Cleaning up auth state listener.")
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, userRole, userData }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
