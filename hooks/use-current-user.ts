"use client"

import { useState, useEffect } from "react"
import { getCookie } from "cookies-next"
import { ErrorType, handleClientError } from "@/lib/utils/error-handler"

export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    try {
      // Try to get the user ID from the cookie
      const userIdFromCookie = getCookie("user_id") as string
      console.log("[useCurrentUser] User ID from cookie:", userIdFromCookie) // Added log
      if (userIdFromCookie) {
        setUserId(userIdFromCookie)
      } else {
        console.warn("[useCurrentUser] No user ID found in cookies") // Added log
        // Fallback to checking if we're in demo mode
        const pathname = window.location.pathname
        if (pathname.includes("/demo/")) {
          console.log("[useCurrentUser] Demo mode detected, using demo user ID") // Added log
          setUserId("demo-user-123")
        }
      }
    } catch (err) {
      const appError = handleClientError(err, {
        component: "useCurrentUser",
        operation: "getCurrentUser",
        message: "Failed to get current user",
        errorType: ErrorType.AUTH_ERROR,
      })

      console.error("[useCurrentUser] Error getting current user:", appError) // Added log
      setError(appError)
    } finally {
      setLoading(false)
      console.log("[useCurrentUser] Finished loading user data. userId:", userId, "loading:", false) // Added final log
    }
  }, [])

  return { user: { uid: userId }, loading, error } // Return user as an object with uid
}
