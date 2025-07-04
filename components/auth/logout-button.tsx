"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useUnifiedAuth } from "@/hooks/use-unified-auth"

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
  const { logout } = useUnifiedAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (showConfirmation) {
      const confirmed = window.confirm("Are you sure you want to log out?")
      if (!confirmed) return
    }

    setIsLoggingOut(true)

    try {
      console.log("[LogoutButton] Starting logout process...")
      const success = await logout()

      if (success) {
        console.log("[LogoutButton] Logout successful")
        if (onClick) {
          onClick()
        }
      } else {
        console.error("[LogoutButton] Logout failed")
        setIsLoggingOut(false)
      }
    } catch (error) {
      console.error("[LogoutButton] Logout error:", error)
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
