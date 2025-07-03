// Client-side user service that uses API endpoints instead of direct Firebase calls

export interface User {
  uid: string
  email: string
  name: string
  role?: string
  user_type?: string
  universalInviteCode?: string
  inviteCode?: string
}

// Get current user from API endpoint
export async function getCurrentUserFromAPI(): Promise<User | null> {
  try {
    console.log("[getCurrentUserFromAPI] Fetching user from /api/auth/me")

    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include", // Include cookies
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("[getCurrentUserFromAPI] Response status:", response.status)

    if (response.status === 401) {
      console.log("[getCurrentUserFromAPI] User not authenticated")
      return null
    }

    if (!response.ok) {
      console.error("[getCurrentUserFromAPI] API error:", response.status, response.statusText)
      return null
    }

    const userData = await response.json()
    console.log("[getCurrentUserFromAPI] User data received:", {
      uid: userData.uid,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    })

    return userData
  } catch (error) {
    console.error("[getCurrentUserFromAPI] Error fetching user:", error)
    return null
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUserFromAPI()
  return user !== null
}

// Get user role
export async function getUserRole(): Promise<string | null> {
  const user = await getCurrentUserFromAPI()
  return user?.role || null
}
