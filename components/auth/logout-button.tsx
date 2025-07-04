"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { UnifiedAuthService } from "@/lib/services/unified-auth-service"
import { useToast } from "@/hooks/use-toast"

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  showIcon?: boolean
  className?: string
}

export function LogoutButton({
  variant = "ghost",
  size = "default",
  showIcon = true,
  className = "",
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      console.log("🚪 [LogoutButton] Starting logout process")

      // Use unified auth service for logout
      const authResult = await UnifiedAuthService.signOut()

      if (!authResult.success) {
        console.error("❌ [LogoutButton] Logout failed:", authResult.error?.message)
        toast({
          title: "Logout Failed",
          description: authResult.error?.message || "Failed to log out. Please try again.",
          variant: "destructive",
        })
        return
      }

      console.log("✅ [LogoutButton] Logout successful")

      toast({
        title: "Logged Out",
        description: authResult.message || "You have been logged out successfully.",
      })

      // Redirect to login page
      router.push("/login")
    } catch (error: any) {
      console.error("💥 [LogoutButton] Unexpected error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred during logout.",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleLogout} disabled={isLoggingOut} className={className}>
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  )
}
