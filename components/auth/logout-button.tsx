"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
  onClick?: () => void
  showConfirmation?: boolean
  showIcon?: boolean
}

export function LogoutButton({
  variant = "default",
  className = "",
  onClick,
  showConfirmation = false,
  showIcon = false,
}: LogoutButtonProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (showConfirmation) {
      const confirmed = window.confirm("Are you sure you want to log out?")
      if (!confirmed) return
    }

    setIsLoggingOut(true)

    try {
      const response = await fetch("/api/auth/logout", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Clear any local storage
        if (typeof window !== "undefined") {
          localStorage.clear()
          sessionStorage.clear()
        }

        if (onClick) {
          onClick()
        }

        // Force redirect to login page
        window.location.href = "/login"
      } else {
        console.error("[LogoutButton] Error during logout:", response.statusText)
        setIsLoggingOut(false)
      }
    } catch (error) {
      console.error("[LogoutButton] Error during logout:", error)
      setIsLoggingOut(false)
    }
  }

  const performLogout = async () => {
    console.log("[LogoutButton] performLogout called")
    setIsLoggingOut(true)

    try {
      console.log("[LogoutButton] Calling logout API...")
      const response = await fetch("/api/auth/logout", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("[LogoutButton] Logout API response:", response.status)

      if (response.ok) {
        console.log("[LogoutButton] Logout process finished, isLoggingOut set to false")
        setIsLoggingOut(false)

        if (onClick) {
          onClick()
        }

        // Redirect to login page
        router.push("/login")
      } else {
        console.error("[LogoutButton] Error during logout:", response.statusText)
        setIsLoggingOut(false)
      }
    } catch (error) {
      console.error("[LogoutButton] Error during logout:", error)
      setIsLoggingOut(false)
    }
  }

  return (
    <Button variant={variant} className={className} onClick={handleLogout} disabled={isLoggingOut}>
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {isLoggingOut ? "Logging out..." : "Log Out"}
    </Button>
  )
}
