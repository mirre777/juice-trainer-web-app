import { getCookie } from "cookies-next"

export interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  error?: string
}

export function getAuthState(): AuthState {
  try {
    // Check for authentication cookies
    const userId = getCookie("user_id")
    const authToken = getCookie("auth_token")

    console.log("[getAuthState] Checking auth state:", {
      userId: userId ? "present" : "missing",
      authToken: authToken ? "present" : "missing",
    })

    if (!userId && !authToken) {
      return {
        isAuthenticated: false,
        userId: null,
        error: "No authentication found",
      }
    }

    return {
      isAuthenticated: true,
      userId: (userId as string) || null,
    }
  } catch (error) {
    console.error("[getAuthState] Error checking auth state:", error)
    return {
      isAuthenticated: false,
      userId: null,
      error: "Error checking authentication",
    }
  }
}

export function clearAuthState(): void {
  try {
    // Clear authentication cookies
    document.cookie = "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    console.log("[clearAuthState] Cleared authentication state")
  } catch (error) {
    console.error("[clearAuthState] Error clearing auth state:", error)
  }
}

export function setAuthState(userId: string, token?: string): void {
  try {
    // Set authentication cookies
    document.cookie = `user_id=${userId}; path=/; max-age=86400` // 24 hours

    if (token) {
      document.cookie = `auth_token=${token}; path=/; max-age=86400` // 24 hours
    }

    console.log("[setAuthState] Set authentication state for user:", userId)
  } catch (error) {
    console.error("[setAuthState] Error setting auth state:", error)
  }
}
