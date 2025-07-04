# Unified Services Migration Plan

## Overview
This document outlines the complete migration from the current fragmented authentication and client data fetching to the new unified services (`UnifiedAuthService` and `UnifiedClientService`).

## Files That Need Updates

### API Routes (Authentication)
1. **app/api/auth/login/route.ts** - Replace entire authentication logic with UnifiedAuthService.signIn()
2. **app/api/auth/logout/route.ts** - Replace with UnifiedAuthService.signOut()
3. **app/api/auth/me/route.ts** - Replace with UnifiedAuthService.getCurrentUser()
4. **app/api/auth/signup/route.ts** - Update to use UnifiedAuthService for consistency

### API Routes (Client Operations)
5. **app/api/clients/route.ts** - Replace with UnifiedClientService.getClients()
6. **app/api/clients/[id]/route.ts** - Replace with UnifiedClientService.getClient()

### Components (Authentication)
7. **components/auth/auth-form.tsx** - Update to use UnifiedAuthService instead of direct API calls
8. **components/auth/logout-button.tsx** - Update to use UnifiedAuthService.signOut()
9. **components/auth/protected-route.tsx** - Use UnifiedAuthService.getCurrentUser() instead of direct API calls

### Components (Client Operations)
10. **components/clients/add-client-modal.tsx** - Update to use UnifiedClientService.addClient()
11. **components/clients/client-actions.tsx** - Update to use UnifiedClientService.deleteClient()
12. **components/clients/clients-list.tsx** - Replace direct Firestore calls with UnifiedClientService

### Hooks
13. **lib/hooks/use-client-data.ts** - Update to use UnifiedClientService.subscribeToClients()
14. **lib/hooks/use-client-data-api.ts** - Mark as deprecated, redirect to UnifiedClientService.getClients()
15. **lib/hooks/use-client-data-hybrid.ts** - Mark as deprecated, no longer needed
16. **hooks/use-current-user.ts** - Update to use UnifiedAuthService.getCurrentUser()

### Pages
17. **app/clients/ClientPage.tsx** - Update to use UnifiedClientService
18. **app/clients/page.tsx** - Verify it uses the updated ClientPage component

### Services (To be deprecated/updated)
19. **lib/auth/auth-service.ts** - Mark as deprecated, redirect to UnifiedAuthService
20. **lib/firebase/client-service.ts** - Mark functions as deprecated, redirect to UnifiedClientService
21. **lib/firebase/user-service.ts** - Update getCurrentUser functions to use UnifiedAuthService
22. **lib/services/client-user-service.ts** - Update to use UnifiedAuthService

## Migration Priority

### Phase 1: Core Services (High Priority)
- UnifiedAuthService implementation ✅
- UnifiedClientService implementation ✅
- Update API routes for auth and clients

### Phase 2: Components (Medium Priority)  
- Update auth components
- Update client components
- Update hooks

### Phase 3: Cleanup (Low Priority)
- Mark old services as deprecated
- Update remaining pages
- Remove unused code

## Files That Import Current Services

### Files importing from lib/firebase/client-service.ts:
- app/api/auth/login/route.ts (processLoginInvitation)
- components/clients/add-client-modal.tsx (checkDuplicateEmail)
- components/clients/client-actions.tsx (deleteClient)
- lib/hooks/use-client-data.ts (not directly, but uses patterns)

### Files importing from lib/firebase/user-service.ts:
- app/api/auth/me/route.ts (direct Firestore access)
- components/auth/auth-form.tsx (storeInvitationCode)
- lib/firebase/client-service.ts (getUserById)

### Files importing from lib/auth/auth-service.ts:
- app/api/auth/signup/route.ts (signIn function)

## Testing Strategy
1. Update API routes first and test with existing frontend
2. Update one component at a time and test functionality
3. Update hooks and test real-time updates
4. Full integration testing

## Rollback Plan
- Keep old services intact until migration is complete
- Use feature flags if needed
- Gradual migration allows for easy rollback of individual components

## Phase 1: Update Core Components

### 1.1 Update AuthForm Component
**File:** `components/auth/auth-form.tsx`

**Changes:**
- Replace direct API calls with `UnifiedAuthService.signIn()`
- Update error handling to use unified error types
- Simplify authentication flow

**Current Issues:**
- Direct fetch calls to `/api/auth/login`
- Manual cookie management
- Inconsistent error handling

**New Implementation:**
\`\`\`typescript
// Replace the handleSubmit function with:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError(null)
  setLoading(true)

  try {
    const result = await UnifiedAuthService.signIn(email, password, invitationCode)
    
    if (!result.success) {
      setError(result.error?.message || `Failed to ${mode}. Please try again.`)
      setLoading(false)
      return
    }

    // Handle successful login based on user role
    if (result.user?.role === "trainer") {
      router.push("/overview")
    } else {
      router.push("/mobile-app-success")
    }
  } catch (err) {
    setError(`An unexpected error occurred. Please try again.`)
    setLoading(false)
  }
}
\`\`\`

### 1.2 Update LogoutButton Component
**File:** `components/auth/logout-button.tsx`

**Changes:**
- Replace direct API call with `UnifiedAuthService.signOut()`
- Simplify logout flow

**New Implementation:**
\`\`\`typescript
const handleLogout = async () => {
  if (showConfirmation) {
    const confirmed = window.confirm("Are you sure you want to log out?")
    if (!confirmed) return
  }

  setIsLoggingOut(true)

  try {
    const result = await UnifiedAuthService.signOut()
    
    if (result.success) {
      if (onClick) onClick()
      window.location.href = "/login"
    } else {
      console.error("[LogoutButton] Error during logout:", result.error)
      setIsLoggingOut(false)
    }
  } catch (error) {
    console.error("[LogoutButton] Error during logout:", error)
    setIsLoggingOut(false)
  }
}
\`\`\`

### 1.3 Update ProtectedRoute Component
**File:** `components/auth/protected-route.tsx`

**Changes:**
- Use `UnifiedAuthService.getCurrentUser()` instead of direct API calls
- Implement proper role-based access control

## Phase 2: Update Client Data Fetching

### 2.1 Replace useClientData Hook
**File:** `lib/hooks/use-client-data.ts`

**Complete Replacement:**
\`\`\`typescript
"use client"

import { useState, useEffect } from "react"
import { UnifiedClientService } from "@/lib/services/unified-client-service"
import type { Client } from "@/types/client"

export function useClientData(isDemo = false) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Demo clients data
  const demoClients: Client[] = [
    {
      id: "1",
      name: "Salty Snack",
      initials: "SS",
      status: "Active",
      progress: 38,
      sessions: { completed: 12, total: 30 },
      completion: 38,
      notes: "Working on strength training and nutrition plan.",
      bgColor: "#f3f4f6",
      textColor: "#111827",
      lastWorkout: { name: "Upper Body Strength", date: "2 days ago", completion: 85 },
      metrics: [
        { name: "Weight", value: "165 lbs", change: "+2 lbs" },
        { name: "Body Fat", value: "18%", change: "-1.5%" },
        { name: "Squat 1RM", value: "225 lbs", change: "+15 lbs" },
      ],
      email: "salty@example.com",
      goal: "Build muscle",
      program: "Strength Training",
      createdAt: new Date(),
      inviteCode: "",
      userId: "demo-user-1",
      phone: "",
      hasLinkedAccount: true,
    },
  ]

  useEffect(() => {
    if (isDemo) {
      setClients(demoClients)
      setLoading(false)
      return
    }

    const fetchClients = async () => {
      try {
        setLoading(true)
        setError(null)

        const result = await UnifiedClientService.getClients()
        
        if (result.success && result.clients) {
          setClients(result.clients)
        } else {
          setError(result.error?.message || "Failed to load clients")
          setClients([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load clients")
        setClients([])
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [isDemo])

  const refetch = async () => {
    if (!isDemo) {
      setLoading(true)
      try {
        const result = await UnifiedClientService.getClients()
        if (result.success && result.clients) {
          setClients(result.clients)
        } else {
          setError(result.error?.message || "Failed to refetch clients")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to refetch clients")
      } finally {
        setLoading(false)
      }
    }
  }

  return { clients, loading, error, refetch }
}
\`\`\`

### 2.2 Update AddClientModal Component
**File:** `components/clients/add-client-modal.tsx`

**Key Changes:**
- Replace direct API calls with `UnifiedClientService.addClient()`
- Update import statements
- Simplify client creation flow

**Import Updates:**
\`\`\`typescript
// Add this import at the top
import { UnifiedClientService } from "@/lib/services/unified-client-service"
\`\`\`

**Replace createClientDirectly function:**
\`\`\`typescript
const createClientDirectly = async (skipDuplicateCheck = false) => {
  console.log("🚀 [ADD CLIENT] Starting client creation...")

  const formErrors = validateForm()
  if (Object.keys(formErrors).length > 0) {
    setErrors(formErrors)
    return
  }

  setIsSubmitting(true)
  setErrorMessage(null)

  try {
    // Demo mode
    if (isDemo) {
      const newClient = { id: "demo-client-id", name: name, email: email, phone: phone }
      setCreatedClient(newClient)
      setTrainerInviteCode("DEMO123")
      setShowInviteDialog(true)
      setIsSubmitting(false)
      return
    }

    // Check for duplicate email (unless we're skipping the check)
    if (!skipDuplicateCheck && email.trim()) {
      // Use UnifiedClientService for duplicate check
      const result = await UnifiedClientService.getClients()
      if (result.success && result.clients) {
        const duplicate = result.clients.find(c => c.email.toLowerCase() === email.toLowerCase().trim())
        if (duplicate) {
          setDuplicateClient(duplicate)
          setShowDuplicateDialog(true)
          setIsSubmitting(false)
          return
        }
      }
    }

    // Update invite code if needed
    if (needsInviteCode && newInviteCode.trim()) {
      console.log("📝 [ADD CLIENT] Setting new invite code...")
      const codeUpdated = await updateTrainerInviteCode(newInviteCode.toUpperCase())
      if (!codeUpdated) {
        throw new Error("Failed to set invite code")
      }
    }

    // Create client using unified service
    const result = await UnifiedClientService.addClient({
      name,
      email: email || "",
      phone: phone || "",
    })

    if (result.success && result.clientId) {
      console.log("✅ [ADD CLIENT] Client created successfully")

      const newClient = {
        id: result.clientId,
        name: name,
        email: email,
        phone: phone,
      }
      setCreatedClient(newClient)

      const finalInviteCode = needsInviteCode ? newInviteCode.toUpperCase() : trainerInviteCode

      if (finalInviteCode && finalInviteCode.trim() !== "") {
        setShowInviteDialog(true)
        onClose()
      } else {
        onClose()
        toast({
          title: "Client Added",
          description: "Client added successfully! Set up your invite code in Settings to send invitations.",
        })
      }

      if (onAddClient) {
        onAddClient(result.clientId)
      }
    } else {
      throw new Error(result.error?.message || "Failed to create client")
    }
  } catch (error: any) {
    console.error("💥 [ADD CLIENT] Error:", error)
    setErrorMessage(error.message || "Failed to add client")
    toast({
      title: "Error",
      description: error.message || "Failed to add client",
      variant: "destructive",
    })
  } finally {
    setIsSubmitting(false)
  }
}
\`\`\`

### 2.3 Update ClientsList Component
**File:** `components/clients/clients-list.tsx`

**Key Changes:**
- Replace direct Firestore calls with `UnifiedClientService`
- Update status change handling

**Import Updates:**
\`\`\`typescript
// Replace existing imports with:
import { UnifiedClientService } from "@/lib/services/unified-client-service"
// Remove: import { updateClient } from "@/lib/firebase/client-service"
// Remove: import { getCookie } from "cookies-next"
\`\`\`

**Update handleStatusChange function:**
\`\`\`typescript
const handleStatusChange = async (clientId: string, newStatus: "Active" | "On Hold" | "Inactive") => {
  try {
    const result = await UnifiedClientService.updateClient(clientId, { status: newStatus })

    if (result.success) {
      toast({
        title: "Status updated",
        description: `Client status changed to ${newStatus}`,
      })
    } else {
      toast({
        title: "Error",
        description: result.error?.message || "Failed to update client status",
        variant: "destructive",
      })
    }
  } catch (error) {
    console.error("Error updating client status:", error)
    toast({
      title: "Error",
      description: "An unexpected error occurred",
      variant: "destructive",
    })
  }
}
\`\`\`

## Phase 3: Update API Routes

### 3.1 Update /api/auth/me Route
**File:** `app/api/auth/me/route.ts`

**Complete Replacement:**
\`\`\`typescript
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { UnifiedAuthService } from "@/lib/services/unified-auth-service"

export async function GET() {
  try {
    console.log("🚀 Starting /api/auth/me request")

    const result = await UnifiedAuthService.getCurrentUser()

    if (!result.success || !result.user) {
      console.log("❌ User not authenticated")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const response = {
      uid: result.user.uid,
      email: result.user.email,
      name: result.user.name || "",
      ...(result.user.role && { role: result.user.role }),
      ...(result.user.user_type && { user_type: result.user.user_type }),
      universalInviteCode: result.user.universalInviteCode || "",
      inviteCode: result.user.inviteCode || "",
    }

    console.log("📤 Sending successful response")
    return NextResponse.json(response)
  } catch (error: any) {
    console.error("💥 Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
\`\`\`

### 3.2 Update /api/auth/login Route
**File:** `app/api/auth/login/route.ts`

**Complete Replacement:**
\`\`\`typescript
import { NextResponse } from "next/server"
import { UnifiedAuthService } from "@/lib/services/unified-auth-service"

export async function POST(request: Request) {
  try {
    const { email, password, invitationCode } = await request.json()

    console.log(`[API:login] 🚀 Processing login for ${email}`)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await UnifiedAuthService.signIn(email, password, invitationCode)

    if (!result.success) {
      console.log(`[API:login] ❌ Login failed:`, result.error)
      return NextResponse.json(
        { error: result.error?.message || "Login failed" },
        { status: result.error?.type === "AUTH_INVALID_CREDENTIALS" ? 401 : 400 }
      )
    }

    console.log(`[API:login] ✅ Login successful for user: ${result.user?.uid}`)

    return NextResponse.json({
      success: true,
      userId: result.user?.uid,
      message: result.message || "Login successful!",
      authMethod: "firebase",
      invitationProcessed: !!invitationCode,
      pendingApproval: !!invitationCode,
    })
  } catch (error) {
    console.error("[API:login] ❌ Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred. Please try again later." }, { status: 500 })
  }
}
\`\`\`

### 3.3 Update /api/auth/logout Route
**File:** `app/api/auth/logout/route.ts`

**Complete Replacement:**
\`\`\`typescript
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { UnifiedAuthService } from "@/lib/services/unified-auth-service"

export async function GET() {
  try {
    const result = await UnifiedAuthService.signOut()

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: result.error?.message || "Failed to logout" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error during logout:", error)
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 })
  }
}
\`\`\`

### 3.4 Update /api/clients Route
**File:** `app/api/clients/route.ts`

**Complete Replacement:**
\`\`\`typescript
import { type NextRequest, NextResponse } from "next/server"
import { UnifiedClientService } from "@/lib/services/unified-client-service"

export async function GET(request: NextRequest) {
  console.log("[API /api/clients] === REQUEST RECEIVED ===")

  try {
    const result = await UnifiedClientService.getClients()

    if (!result.success) {
      console.log("❌ [API /api/clients] Failed to fetch clients:", result.error)
      return NextResponse.json(
        { success: false, error: result.error?.message || "Failed to fetch clients" },
        { status: result.error?.type === "AUTH_UNAUTHORIZED" ? 401 : 500 }
      )
    }

    console.log("✅ [API /api/clients] Successfully fetched clients:", result.clients?.length || 0)

    return NextResponse.json({
      success: true,
      clients: result.clients || [],
      totalClients: result.clients?.length || 0,
    })
  } catch (error) {
    console.error("[API /api/clients] ❌ Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientData = await request.json()

    const result = await UnifiedClientService.addClient(clientData)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error?.message || "Failed to create client" },
        { status: result.error?.type === "AUTH_UNAUTHORIZED" ? 401 : 400 }
      )
    }

    return NextResponse.json({
      success: true,
      clientId: result.clientId,
      message: result.message,
    })
  } catch (error) {
    console.error("[API /api/clients] POST Error:", error)
    return NextResponse.json({ success: false, error: "Failed to create client" }, { status: 500 })
  }
}
\`\`\`

## Phase 4: Update Page Components

### 4.1 Update ClientsPage
**File:** `app/clients/page.tsx`

**Changes:**
- Update to use `UnifiedAuthService` for role checking

**New Implementation:**
\`\`\`typescript
import type { Metadata } from "next"
import ClientPage from "./ClientPage"
import { ProtectedRoute } from "@/components/auth/protected-route"

export const metadata: Metadata = {
  title: "Clients | Juice",
  description: "Manage your coaching clients",
}

export default function ClientsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <ClientPage />
    </ProtectedRoute>
  )
}
\`\`\`

### 4.2 Update ClientPage Component
**File:** `app/clients/ClientPage.tsx`

**Key Changes:**
- Replace `useClientDataAPI` with updated `useClientData`
- Update import statements

**Import Updates:**
\`\`\`typescript
// Replace:
// import { useClientDataAPI } from "@/lib/hooks/use-client-data-api"
// With:
import { useClientData } from "@/lib/hooks/use-client-data"
\`\`\`

## Phase 5: Update Context and Providers

### 5.1 Update AuthContext
**File:** `context/AuthContext.tsx`

**Key Changes:**
- Integrate with `UnifiedAuthService`
- Provide consistent auth state management

**Updated Implementation:**
\`\`\`typescript
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { UnifiedAuthService, type AuthUser } from "@/lib/services/unified-auth-service"

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string, invitationCode?: string) => Promise<{ success: boolean; error?: any }>
  signOut: () => Promise<{ success: boolean; error?: any }>
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ success: false }),
  signOut: async () => ({ success: false }),
  refetch: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const result = await UnifiedAuthService.getCurrentUser()
      if (result.success && result.user) {
        setUser(result.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const signIn = async (email: string, password: string, invitationCode?: string) => {
    const result = await UnifiedAuthService.signIn(email, password, invitationCode)
    if (result.success && result.user) {
      setUser(result.user)
    }
    return result
  }

  const signOut = async () => {
    const result = await UnifiedAuthService.signOut()
    if (result.success) {
      setUser(null)
    }
    return result
  }

  const refetch = async () => {
    await fetchUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export const useAuthContext = () => useContext(AuthContext)
\`\`\`

## Phase 6: Remove Deprecated Files

### Files to Remove:
1. `lib/hooks/use-client-data-api.ts` - Replaced by updated `use-client-data.ts`
2. `lib/hooks/use-client-data-hybrid.ts` - No longer needed
3. `lib/auth/auth-service.ts` - Replaced by `UnifiedAuthService`
4. `lib/services/auth-service.ts` - Replaced by `UnifiedAuthService`

## Phase 7: Update Import Statements Across Codebase

### Files that need import updates:

1. **All components using client data:**
   - Replace `import { fetchClients } from "@/lib/firebase/client-service"` with `import { UnifiedClientService } from "@/lib/services/unified-client-service"`

2. **All components using authentication:**
   - Replace direct API calls with `import { UnifiedAuthService } from "@/lib/services/unified-auth-service"`

3. **Middleware updates:**
   - Update `middleware.ts` to use `UnifiedAuthService.isAuthenticated()`

## Migration Checklist

- [ ] Phase 1: Update core auth components
- [ ] Phase 2: Update client data fetching
- [ ] Phase 3: Update API routes
- [ ] Phase 4: Update page components
- [ ] Phase 5: Update context providers
- [ ] Phase 6: Remove deprecated files
- [ ] Phase 7: Update all import statements
- [ ] Test authentication flow
- [ ] Test client data fetching
- [ ] Test real-time updates
- [ ] Test error handling
- [ ] Update documentation

## Testing Strategy

1. **Unit Tests:**
   - Test `UnifiedAuthService` methods
   - Test `UnifiedClientService` methods
   - Test error handling scenarios

2. **Integration Tests:**
   - Test complete auth flow
   - Test client CRUD operations
   - Test real-time subscriptions

3. **E2E Tests:**
   - Test login/logout flow
   - Test client management workflow
   - Test invitation flow

## Rollback Plan

If issues arise during migration:
1. Keep backup of original files
2. Use feature flags to toggle between old/new services
3. Monitor error rates and performance
4. Have rollback scripts ready

## Performance Considerations

1. **Caching Strategy:**
   - Implement client-side caching for user data
   - Use React Query for server state management
   - Cache frequently accessed client data

2. **Error Handling:**
   - Implement retry logic for failed requests
   - Provide meaningful error messages
   - Log errors for debugging

3. **Real-time Updates:**
   - Optimize Firestore listeners
   - Implement connection state management
   - Handle offline scenarios
