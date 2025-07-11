// Client-side auth utilities - no server imports allowed

export async function getTrainerIdFromCookies(): Promise<string | null> {
  try {
    // Check for user_id cookie first (current system)
    const userIdCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user_id="))
      ?.split("=")[1]

    if (userIdCookie) {
      return userIdCookie
    }

    // Fallback to trainer_id cookie for backward compatibility
    const trainerIdCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("trainer_id="))
      ?.split("=")[1]

    if (trainerIdCookie) {
      return trainerIdCookie
    }

    // Check localStorage as fallback
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("user_id") || localStorage.getItem("trainer_id")
      if (storedUserId) {
        return storedUserId
      }
    }

    return null
  } catch (error) {
    console.error("Error getting trainer ID from cookies:", error)
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const trainerId = await getTrainerIdFromCookies()
    return !!trainerId
  } catch (error) {
    console.error("Error checking authentication:", error)
    return false
  }
}

export async function getCurrentUser() {
  try {
    const response = await fetch("/api/auth/me")
    if (response.ok) {
      const data = await response.json()
      return data.user
    }
    return null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
