import { getCookie } from "cookies-next"

export interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  error?: string
}

export function getAuthState(): AuthState {
  try {
    console.log("[getAuthState] Checking auth state...")

    // The app uses 'user_id' cookie as seen in middleware.ts and api/auth/me/route.ts
    const userId = getCookie("user_id") as string | undefined

    console.log("[getAuthState] user_id cookie:", userId ? "found" : "not found")

    if (!userId) {
      return {
        isAuthenticated: false,
        userId: null,
        error: "Not authenticated. Please log in.",
      }
    }

    return {
      isAuthenticated: true,
      userId: userId,
    }
  } catch (error) {
    console.error("[getAuthState] Error:", error)
    return {
      isAuthenticated: false,
      userId: null,
      error: "Authentication error occurred",
    }
  }
}

export function setAuthState(userId: string) {
  try {
    // Set the same cookie that the backend expects
    document.cookie = `user_id=${userId}; path=/; max-age=86400; SameSite=Lax`
    console.log("[setAuthState] Set user_id cookie for:", userId)
  } catch (error) {
    console.error("[setAuthState] Error:", error)
  }
}

export function clearAuthState(): void {
  try {
    // Clear the user_id cookie
    document.cookie = "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    console.log("[clearAuthState] Cleared user_id cookie")
  } catch (error) {
    console.error("[clearAuthState] Error:", error)
  }
}
