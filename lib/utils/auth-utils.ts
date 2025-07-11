import { getCookie } from "cookies-next"

export interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  error: string | null
}

export function getAuthState(): AuthState {
  try {
    const userId = getCookie("user_id")

    if (!userId) {
      return {
        isAuthenticated: false,
        userId: null,
        error: "No authentication found",
      }
    }

    return {
      isAuthenticated: true,
      userId: userId as string,
      error: null,
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      userId: null,
      error: "Authentication check failed",
    }
  }
}
