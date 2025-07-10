import { getCookie } from "cookies-next"

export interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  error?: string
}

export function getAuthState(): AuthState {
  try {
    // First try to get from cookies (server-side compatible)
    let userId = getCookie("userId") as string | undefined

    // If not in cookies, try localStorage (client-side only)
    if (!userId && typeof window !== "undefined") {
      userId = localStorage.getItem("userId") || undefined
    }

    // Also try alternative cookie names that might be used
    if (!userId) {
      userId = getCookie("trainerId") as string | undefined
    }

    if (!userId && typeof window !== "undefined") {
      userId = localStorage.getItem("trainerId") || undefined
    }

    console.log("Auth state check - userId found:", userId)

    if (!userId) {
      return {
        isAuthenticated: false,
        userId: null,
        error: "No user ID found. Please log in again.",
      }
    }

    return {
      isAuthenticated: true,
      userId: userId,
    }
  } catch (error) {
    console.error("Error getting auth state:", error)
    return {
      isAuthenticated: false,
      userId: null,
      error: "Authentication error occurred",
    }
  }
}

export function setAuthState(userId: string) {
  try {
    // Set in both cookies and localStorage for redundancy
    document.cookie = `userId=${userId}; path=/; max-age=86400; SameSite=Lax`
    document.cookie = `trainerId=${userId}; path=/; max-age=86400; SameSite=Lax`

    if (typeof window !== "undefined") {
      localStorage.setItem("userId", userId)
      localStorage.setItem("trainerId", userId)
    }
  } catch (error) {
    console.error("Error setting auth state:", error)
  }
}

export function clearAuthState() {
  try {
    // Clear cookies
    document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "trainerId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("userId")
      localStorage.removeItem("trainerId")
    }
  } catch (error) {
    console.error("Error clearing auth state:", error)
  }
}
