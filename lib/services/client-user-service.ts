// Client-side user service that uses UnifiedAuthService for consistency

import { UnifiedAuthService } from "./unified-auth-service"

export interface User {
  uid: string
  email: string
  name: string
  role?: string
  user_type?: string
  universalInviteCode?: string
  inviteCode?: string
}

// Get current user using unified auth service
export async function getCurrentUserFromAPI(): Promise<User | null> {
  try {
    console.log("[getCurrentUserFromAPI] Getting user via UnifiedAuthService")

    const authResult = await UnifiedAuthService.getCurrentUser()

    if (authResult.success && authResult.user) {
      console.log("[getCurrentUserFromAPI] User retrieved successfully:", {
        uid: authResult.user.uid,
        email: authResult.user.email,
        role: authResult.user.role,
      })

      // Convert AuthUser to User format for backward compatibility
      return {
        uid: authResult.user.uid,
        email: authResult.user.email,
        name: authResult.user.name || "",
        role: authResult.user.role,
        user_type: authResult.user.user_type,
        universalInviteCode: authResult.user.universalInviteCode,
        inviteCode: authResult.user.inviteCode,
      }
    } else {
      console.log("[getCurrentUserFromAPI] No authenticated user found")
      return null
    }
  } catch (error) {
    console.error("[getCurrentUserFromAPI] Error:", error)
    return null
  }
}

// Check if user is authenticated using unified service
export async function isAuthenticated(): Promise<boolean> {
  const result = await UnifiedAuthService.isAuthenticated()
  return result
}

// Get user role using unified service
export async function getUserRole(): Promise<string | null> {
  try {
    const authResult = await UnifiedAuthService.getCurrentUser()
    return authResult.success && authResult.user ? authResult.user.role || null : null
  } catch (error) {
    console.error("[getUserRole] Error:", error)
    return null
  }
}
