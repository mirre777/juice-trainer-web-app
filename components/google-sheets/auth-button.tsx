"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function GoogleSheetsAuthButton() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/google/status")
      const data = await response.json()
      setIsConnected(data.isConnected)
    } catch (error) {
      console.error("Failed to check auth status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuth = async () => {
    if (isConnected) {
      // Disconnect
      try {
        setIsLoading(true)
        await fetch("/api/auth/google/logout", { method: "POST" })
        setIsConnected(false)
        toast({
          title: "Disconnected",
          description: "Your Google account has been disconnected.",
        })
      } catch (error) {
        console.error("Failed to disconnect:", error)
        toast({
          title: "Error",
          description: "Failed to disconnect your Google account.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    } else {
      // Connect
      try {
        // Get the auth URL
        const response = await fetch("/api/auth/google/sheets-auth")
        const { url } = await response.json()

        // Redirect to Google auth
        window.location.href = url
      } catch (error) {
        console.error("Failed to start auth:", error)
        toast({
          title: "Error",
          description: "Failed to connect to Google Sheets.",
          variant: "destructive",
        })
      }
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking connection...
      </Button>
    )
  }

  return (
    <Button variant={isConnected ? "outline" : "default"} onClick={handleAuth}>
      {isConnected ? "Disconnect Google Sheets" : "Connect Google Sheets"}
    </Button>
  )
}
