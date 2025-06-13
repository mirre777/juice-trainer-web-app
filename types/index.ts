// Re-export all types from this file
export * from "./client"
export * from "./exercise-history"
export * from "./global"
export * from "./workout-program"

// Add any missing type definitions here
export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  error: string | null
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "coach" | "client"
}

export interface TokenData {
  access_token: string
  refresh_token?: string
  expires_at: number
  token_type: string
  scope?: string
}
