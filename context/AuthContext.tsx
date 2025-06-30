"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

interface User {
  id: string
  email: string
  name: string
  role: "trainer" | "client"
  avatar?: string
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  signup: (email: string, password: string, name: string, role: "trainer" | "client") => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem("auth_user")
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser)
          setUser({
            ...parsedUser,
            createdAt: new Date(parsedUser.createdAt),
          })
        }
      } catch (error) {
        console.error("Error loading user from localStorage:", error)
        localStorage.removeItem("auth_user")
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  // Save user to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("auth_user", JSON.stringify(user))
    } else {
      localStorage.removeItem("auth_user")
    }
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock user data
      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: email.split("@")[0],
        role: email.includes("trainer") ? "trainer" : "client",
        avatar: "/placeholder.svg",
        createdAt: new Date(),
      }

      setUser(mockUser)
    } catch (error) {
      throw new Error("Invalid credentials")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signup = useCallback(async (email: string, password: string, name: string, role: "trainer" | "client") => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name,
        role,
        avatar: "/placeholder.svg",
        createdAt: new Date(),
      }

      setUser(newUser)
    } catch (error) {
      throw new Error("Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const updateProfile = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return

      setIsLoading(true)

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        const updatedUser = { ...user, ...updates }
        setUser(updatedUser)
      } catch (error) {
        throw new Error("Failed to update profile")
      } finally {
        setIsLoading(false)
      }
    },
    [user],
  )

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        signup,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
