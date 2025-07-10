import { getCookie } from "cookies-next"

export interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  error?: string
}

export function getAuthState(): AuthState {
  try {
    // Check for user_id cookie (this is what the system actually uses)
    let userId = getCookie("user_id") as string | undefined

    console.log("Auth: Checking user_id cookie:", userId)

    // Fallback to localStorage if available (client-side only)
    if (!userId && typeof window !== "undefined") {
      userId = localStorage.getItem("user_id") || undefined
      console.log("Auth: Checking localStorage user_id:", userId)
    }

    if (!userId) {
      console.log("Auth: No user_id found in cookies or localStorage")
      return {
        isAuthenticated: false,
        userId: null,
        error: "No authentication found. Please log in.",
      }
    }

    console.log("Auth: Found user_id:", userId)
    return {
      isAuthenticated: true,
      userId: userId,
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
