import { getCookie } from "cookies-next"

export interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  error?: string
}

export function getAuthState(): AuthState {
  try {
    console.log("[getAuthState] Starting auth state check...")

    // Check all possible cookie names
    const cookieNames = ["user_id", "userId", "trainerId", "auth_user_id"]
    let userId: string | null = null

    for (const cookieName of cookieNames) {
      const cookieValue = getCookie(cookieName) as string | undefined
      if (cookieValue) {
        console.log(`[getAuthState] Found userId in cookie '${cookieName}':`, cookieValue)
        userId = cookieValue
        break
      }
    }

    // If not found in cookies, check localStorage (client-side only)
    if (!userId && typeof window !== "undefined") {
      const localStorageKeys = ["user_id", "userId", "trainerId", "auth_user_id"]

      for (const key of localStorageKeys) {
        const value = localStorage.getItem(key)
        if (value) {
          console.log(`[getAuthState] Found userId in localStorage '${key}':`, value)
          userId = value
          break
        }
      }
    }

    // Log all available cookies for debugging
    if (typeof document !== "undefined") {
      console.log("[getAuthState] All cookies:", document.cookie)
    }

    if (!userId) {
      console.log("[getAuthState] No userId found in any location")
      return {
        isAuthenticated: false,
        userId: null,
        error: "No user ID found. Please log in again.",
      }
    }

    console.log("[getAuthState] Authentication successful with userId:", userId)
    return {
      isAuthenticated: true,
      userId: userId,
    }
  } catch (error) {
    console.error("[getAuthState] Error getting auth state:", error)
    return {
      isAuthenticated: false,
      userId: null,
      error: "Authentication error occurred",
    }
  }
}

export function setAuthState(userId: string) {
  try {
    console.log("[setAuthState] Setting auth state for userId:", userId)

    // Set multiple cookie variations for compatibility
    const cookieOptions = "path=/; max-age=86400; SameSite=Lax"
    document.cookie = `user_id=${userId}; ${cookieOptions}`
    document.cookie = `userId=${userId}; ${cookieOptions}`
    document.cookie = `trainerId=${userId}; ${cookieOptions}`
    document.cookie = `auth_user_id=${userId}; ${cookieOptions}`

    // Also set in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("user_id", userId)
      localStorage.setItem("userId", userId)
      localStorage.setItem("trainerId", userId)
      localStorage.setItem("auth_user_id", userId)
    }

    console.log("[setAuthState] Auth state set successfully")
  } catch (error) {
    console.error("[setAuthState] Error setting auth state:", error)
  }
}

export function clearAuthState() {
  try {
    console.log("[clearAuthState] Clearing auth state...")

    // Clear all cookie variations
    const expiredCookie = "path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = `user_id=; ${expiredCookie}`
    document.cookie = `userId=; ${expiredCookie}`
    document.cookie = `trainerId=; ${expiredCookie}`
    document.cookie = `auth_user_id=; ${expiredCookie}`

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_id")
      localStorage.removeItem("userId")
      localStorage.removeItem("trainerId")
      localStorage.removeItem("auth_user_id")
    }

    console.log("[clearAuthState] Auth state cleared successfully")
  } catch (error) {
    console.error("[clearAuthState] Error clearing auth state:", error)
  }
}
