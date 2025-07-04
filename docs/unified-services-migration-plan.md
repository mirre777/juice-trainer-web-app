# Unified Services Migration Plan

## Overview
This document outlines all the places that need to be updated to use the new unified `authService` and `clientService` instead of the scattered authentication and client fetching methods.

## Files That Need Updates

### 1. Authentication-Related Files

#### Components using authentication:
- `components/auth/protected-route.tsx` - Currently uses `/api/auth/me` directly
- `components/auth/logout-button.tsx` - Currently uses `/api/auth/logout` directly  
- `components/auth/auth-form.tsx` - Currently uses `/api/auth/login` and `/api/auth/signup` directly
- `app/ClientLayout.tsx` - May have auth checks
- `components/unified-header.tsx` - Likely has user info display

#### Hooks using authentication:
- `hooks/use-current-user.ts` - Custom auth hook that should be replaced
- `lib/services/auth-service.ts` - Old auth service to be replaced
- `context/AuthContext.tsx` - Firebase auth context that may conflict

### 2. Client Data Fetching Files

#### Hooks to replace:
- `lib/hooks/use-client-data.ts` - Direct Firestore approach
- `lib/hooks/use-client-data-api.ts` - API approach (keep logic, use unified service)
- `lib/hooks/use-client-data-hybrid.ts` - Hybrid approach (keep logic, use unified service)

#### Components using client data:
- `app/clients/ClientPage.tsx` - Main clients page
- `app/clients/page.tsx` - Clients page wrapper
- `app/programs/ProgramsPageClient.tsx` - Programs page using client data
- `components/clients/add-client-modal.tsx` - Adding clients
- `components/clients/client-actions.tsx` - Client operations
- `components/clients/clients-list.tsx` - Displaying clients
- `components/clients/client-card.tsx` - Individual client display

#### API Routes (keep as-is, but ensure consistency):
- `app/api/clients/route.ts` - Main clients API
- `app/api/clients/[id]/route.ts` - Individual client API
- `app/api/auth/me/route.ts` - User info API
- `app/api/auth/login/route.ts` - Login API
- `app/api/auth/logout/route.ts` - Logout API

### 3. Service Files to Update/Replace

#### Files to replace:
- `lib/services/auth-service.ts` - Replace with unified auth service
- `lib/services/client-user-service.ts` - Merge into unified services
- `lib/auth/auth-service.ts` - Old Firebase auth service

#### Files to keep but update:
- `lib/firebase/client-service.ts` - Keep for Firestore operations, but ensure API consistency
- `lib/firebase/user-service.ts` - Keep for Firestore operations

## Migration Strategy

### Phase 1: Update Authentication
1. Replace all direct `/api/auth/*` calls with `authService` methods
2. Update `ProtectedRoute` to use `authService.hasRole()`
3. Update logout buttons to use `authService.logout()`
4. Update auth forms to use `authService.login()`

### Phase 2: Update Client Data Fetching
1. Create new unified hooks that use `clientService`
2. Update all components to use the new unified hooks
3. Ensure consistent error handling and loading states

### Phase 3: Testing and Cleanup
1. Test all authentication flows
2. Test all client data operations
3. Remove old unused hooks and services
4. Update documentation

## Benefits After Migration

### Consistency:
- All auth operations use the same method (cookies + API)
- All client operations use the same service
- Consistent error handling across the app

### Maintainability:
- Single place to update auth logic
- Single place to update client fetching logic
- Easier to debug and test

### Performance:
- Centralized caching
- Reduced duplicate API calls
- Better state management

## Files That Will Be Deprecated

After migration, these files can be removed:
- `lib/hooks/use-client-data.ts` (replaced by unified hook)
- `lib/services/auth-service.ts` (replaced by unified auth service)
- `lib/services/client-user-service.ts` (merged into unified services)
- Multiple scattered auth methods

## Implementation Order

1. **Create unified services** ✅ (Done)
2. **Update ProtectedRoute** (High priority - affects all protected pages)
3. **Update auth components** (Login, logout, etc.)
4. **Create unified client hooks** (Replace existing hooks)
5. **Update client components** (Use new unified hooks)
6. **Update programs page** (Use unified services)
7. **Test and cleanup** (Remove old files)

This migration will significantly improve the codebase organization and maintainability.
\`\`\`

Should I proceed with implementing these updates step by step, starting with the highest priority items like `ProtectedRoute` and authentication components?
