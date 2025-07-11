export function getTrainerIdFromClientCookies(): string | null {
  try {
    // Check for user_id cookie first (this is what the middleware sets)
    const userIdMatch = document.cookie.match(/(?:^|;\s*)user_id=([^;]+)/)
    if (userIdMatch) {
      return decodeURIComponent(userIdMatch[1])
    }

    // Fallback to trainer_id for backward compatibility
    const trainerIdMatch = document.cookie.match(/(?:^|;\s*)trainer_id=([^;]+)/)
    if (trainerIdMatch) {
      return decodeURIComponent(trainerIdMatch[1])
    }

    // Check localStorage as fallback
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("user_id")
      if (storedUserId) {
        return storedUserId
      }

      const storedTrainerId = localStorage.getItem("trainer_id")
      if (storedTrainerId) {
        return storedTrainerId
      }
    }

    return null
  } catch (error) {
    console.error("Error getting trainer ID from client cookies:", error)
    return null
  }
}

export function setTrainerIdInClientStorage(trainerId: string): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("user_id", trainerId)
      // Also set trainer_id for backward compatibility
      localStorage.setItem("trainer_id", trainerId)
    }
  } catch (error) {
    console.error("Error setting trainer ID in client storage:", error)
  }
}

export function clearTrainerIdFromClientStorage(): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_id")
      localStorage.removeItem("trainer_id")
    }
  } catch (error) {
    console.error("Error clearing trainer ID from client storage:", error)
  }
}

export interface AuthState {
  isAuthenticated: boolean
  userId: string | null
  error?: string
}

export function getAuthState(): AuthState {
  try {
    const userId = getTrainerIdFromClientCookies()

    console.log("Auth: Found user_id:", userId)

    if (!userId) {
      console.log("Auth: No user_id found in cookies or localStorage")
      return {
        isAuthenticated: false,
        userId: null,
        error: "No authentication found. Please log in.",
      }
    }

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
  clearTrainerIdFromClientStorage()
}
