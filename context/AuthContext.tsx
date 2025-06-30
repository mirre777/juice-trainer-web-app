"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

interface User {
  id: string
  email: string
  name: string
  role: "trainer" | "client"
  avatar?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  signup: (email: string, password: string, name: string, role: "trainer" | "client") => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
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
    const savedUser = localStorage.getItem("auth_user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error("Failed to parse saved user:", error)
        localStorage.removeItem("auth_user")
      }
    }
    setIsLoading(false)
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
        id: "user_" + Date.now(),
        email,
        name: email.split("@")[0],
        role: email.includes("trainer") ? "trainer" : "client",
        avatar: "/placeholder-user.jpg",
        createdAt: new Date().toISOString(),
      }

      setUser(mockUser)
    } catch (error) {
      console.error("Login failed:", error)
      throw new Error("Invalid credentials")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("auth_user")
  }, [])

  const signup = useCallback(async (email: string, password: string, name: string, role: "trainer" | "client") => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newUser: User = {
        id: "user_" + Date.now(),
        email,
        name,
        role,
        avatar: "/placeholder-user.jpg",
        createdAt: new Date().toISOString(),
      }

      setUser(newUser)
    } catch (error) {
      console.error("Signup failed:", error)
      throw new Error("Signup failed")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      if (!user) throw new Error("No user logged in")

      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800))

        const updatedUser = { ...user, ...data }
        setUser(updatedUser)
      } catch (error) {
        console.error("Profile update failed:", error)
        throw new Error("Failed to update profile")
      } finally {
        setIsLoading(false)
      }
    },
    [user],
  )

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    signup,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
