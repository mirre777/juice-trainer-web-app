import { getCookie } from "cookies-next"

export interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  error?: string
}

export function getAuthState(): AuthState {
  try {
    // First try to get user ID from cookie
    let userId = getCookie("user_id")

    if (userId) {
      console.log("Auth: Found user ID in cookie:", userId)
      return {
        isAuthenticated: true,
        userId: userId as string,
      }
    }

    // Fallback to localStorage if available (client-side only)
    if (typeof window !== "undefined") {
      userId = localStorage.getItem("user_id")

      if (userId) {
        console.log("Auth: Found user ID in localStorage:", userId)
        return {
          isAuthenticated: true,
          userId: userId,
        }
      }

      // Check for other auth indicators
      const authToken = localStorage.getItem("auth_token") || getCookie("auth_token")
      if (authToken) {
        console.log("Auth: Found auth token but no user ID")
        return {
          isAuthenticated: false,
          userId: null,
          error: "Authentication token found but user ID missing. Please log in again.",
        }
      }
    }

    console.log("Auth: No authentication found")
    return {
      isAuthenticated: false,
      userId: null,
      error: "No authentication found. Please log in.",
    }
  } catch (error) {
    console.error("Auth: Error checking authentication state:", error)
    return {
      isAuthenticated: false,
      userId: null,
      error: "Error checking authentication. Please try again.",
    }
  }
}

export function clearAuthState(): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_id")
      localStorage.removeItem("auth_token")
    }
    // Note: Cookies should be cleared server-side
  } catch (error) {
    console.error("Auth: Error clearing auth state:", error)
  }
}
