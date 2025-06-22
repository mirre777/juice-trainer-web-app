"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast-provider"
import { Calendar, Loader2 } from "lucide-react"

export function SimpleGoogleCalendarAuthButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      // Redirect to the auth endpoint
      window.location.href = "/api/auth/google/simple"
    } catch (error) {
      console.error("Google sign in error", error)
      toast.error({
        title: "Authentication Error",
        description: "Failed to connect to Google Calendar. Please try again.",
      })
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSignIn} disabled={isLoading} className="w-full">
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
      Connect Google Calendar
    </Button>
  )
}
