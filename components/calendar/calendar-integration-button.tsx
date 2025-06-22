"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Loader2 } from "lucide-react"
import { useToast } from "@/components/toast-provider"
import { useGoogleAuth } from "@/lib/client-token-service"

export function CalendarIntegrationButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading, logout } = useGoogleAuth()

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      // Use the direct approach
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
      toast.success({
        title: "Disconnected",
        description: "Successfully disconnected from Google Calendar",
      })
    } catch (error) {
      console.error("Google sign out error", error)
      toast.error({
        title: "Error",
        description: "Failed to sign out. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <Button variant="outline" disabled className="ml-2">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking...
      </Button>
    )
  }

  if (isAuthenticated) {
    return (
      <Button variant="outline" onClick={handleSignOut} disabled={isLoading} className="ml-2">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
        Disconnect Calendar
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignIn}
      disabled={isLoading}
      className="ml-2 bg-black text-white hover:bg-gray-800"
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
      Connect Calendar
    </Button>
  )
}
