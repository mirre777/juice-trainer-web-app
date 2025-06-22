"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast-provider"
import { Calendar, Loader2, LogOut } from "lucide-react"
import { useGoogleAuth } from "@/lib/client-token-service"

export function GoogleCalendarAuthButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading, logout } = useGoogleAuth()

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      // Use the direct approach instead
      const response = await fetch("/api/auth/google/direct")

      if (!response.ok) {
        throw new Error(`Failed to get auth URL: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.authUrl) {
        // Navigate to the auth URL
        window.location.href = data.authUrl
      } else {
        throw new Error("Invalid response from auth endpoint")
      }
    } catch (error) {
      console.error("Google sign in error", error)
      toast.error({
        title: "Authentication Error",
        description: "Failed to connect to Google Calendar. Please try again.",
      })
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      logout()
    } catch (error) {
      console.error("Google sign out error", error)
      toast.error({
        title: "Error",
        description: "Failed to sign out. Please try again.",
      })
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <Button variant="outline" disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking authentication...
      </Button>
    )
  }

  if (isAuthenticated) {
    return (
      <Button variant="outline" onClick={handleSignOut} disabled={isLoading} className="w-full">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
        Disconnect Google Calendar
      </Button>
    )
  }

  return (
    <Button onClick={handleSignIn} disabled={isLoading} className="w-full">
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
      Connect Google Calendar
    </Button>
  )
}
