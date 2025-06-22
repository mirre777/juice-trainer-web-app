"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface LogoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogoutModal({ open, onOpenChange }: LogoutModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
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
        // Clear localStorage and sessionStorage
        if (typeof window !== "undefined") {
          localStorage.clear()
          sessionStorage.clear()
        }

        // Close modal
        onOpenChange(false)

        // Refresh page - let the app's auth logic handle the redirect
        window.location.reload()
      } else {
        console.error("Logout failed:", response.status, response.statusText)
        alert("Logout failed. Please try again.")
        setIsLoggingOut(false)
      }
    } catch (error) {
      console.error("Error during logout:", error)
      alert("Logout failed. Please try again.")
      setIsLoggingOut(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Out</DialogTitle>
          <DialogDescription>Are you sure you want to log out of your account?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoggingOut}>
            Cancel
          </Button>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-[#D2FF28] text-black hover:bg-[#B8E024] disabled:opacity-50"
          >
            {isLoggingOut ? "Logging out..." : "Log Out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
