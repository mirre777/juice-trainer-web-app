# Unified Services Migration Plan

## Overview
This document outlines the migration from direct Firebase calls and mixed authentication patterns to unified services that provide consistent API interfaces across the application.

## Migration Status: IN PROGRESS ✅

## Files That Need Updates

### API Routes (Authentication) - PHASE 1
1. **app/api/auth/login/route.ts** ✅ - Replace entire authentication logic with UnifiedAuthService.signIn()
2. **app/api/auth/logout/route.ts** ⏳ - Replace with UnifiedAuthService.signOut()
3. **app/api/auth/me/route.ts** ✅ - Replace with UnifiedAuthService.getCurrentUser()
4. **app/api/auth/signup/route.ts** ⏳ - Update to use UnifiedAuthService for consistency

### API Routes (Client Operations) - PHASE 1
5. **app/api/clients/route.ts** ✅ - Replace with UnifiedClientService.getClients()
6. **app/api/clients/[id]/route.ts** ⏳ - Replace with UnifiedClientService.getClient()

### Components (Authentication) - PHASE 2
7. **components/auth/auth-form.tsx** ✅ - Update to use UnifiedAuthService instead of direct API calls
8. **components/auth/logout-button.tsx** ⏳ - Update to use UnifiedAuthService.signOut()

### Components (Client Operations) - PHASE 2
9. **components/clients/add-client-modal.tsx** ✅ - Update to use UnifiedClientService.addClient()
10. **components/clients/client-actions.tsx** ⏳ - Update to use UnifiedClientService.deleteClient()

### Hooks - PHASE 2
11. **lib/hooks/use-client-data.ts** ⏳ - Update to use UnifiedClientService.subscribeToClients()
12. **lib/hooks/use-client-data-api.ts** ⏳ - Update to use UnifiedClientService.getClients()
13. **lib/hooks/use-client-data-hybrid.ts** ⏳ - Update to use UnifiedClientService methods
14. **hooks/use-current-user.ts** ✅ - Update to use UnifiedAuthService.getCurrentUser()

### Pages - PHASE 2
15. **app/clients/ClientPage.tsx** ✅ - Update to use UnifiedClientService
16. **app/clients/page.tsx** ✅ - Verify it uses the updated ClientPage component

### Services (To be deprecated/updated) - PHASE 3
17. **lib/auth/auth-service.ts** ⏳ - Mark as deprecated, redirect to UnifiedAuthService
18. **lib/firebase/client-service.ts** ⏳ - Mark functions as deprecated, redirect to UnifiedClientService
19. **lib/firebase/user-service.ts** ✅ - Update getCurrentUser functions to use UnifiedAuthService
20. **lib/services/client-user-service.ts** ⏳ - Update to use UnifiedAuthService

## Migration Priority

### Phase 1: Core Services (High Priority) - IN PROGRESS
- [x] UnifiedAuthService implementation
- [x] UnifiedClientService implementation  
- [x] Update core API routes for auth and clients
- [x] Update user service integration

### Phase 2: Components (Medium Priority) - IN PROGRESS
- [x] Update auth components
- [x] Update core client components
- [x] Update primary hooks
- [x] Update main client page

### Phase 3: Cleanup (Low Priority) - PENDING
- [ ] Mark old services as deprecated
- [ ] Update remaining pages
- [ ] Remove unused code
- [ ] Add deprecation warnings

## Files That Import Current Services

### Files importing from lib/firebase/client-service.ts:
- app/api/auth/login/route.ts (processLoginInvitation) ✅ UPDATED
- components/clients/add-client-modal.tsx (checkDuplicateEmail) ✅ UPDATED
- components/clients/client-actions.tsx (deleteClient) ⏳ PENDING
- lib/hooks/use-client-data.ts (not directly, but uses patterns) ⏳ PENDING

### Files importing from lib/firebase/user-service.ts:
- app/api/auth/me/route.ts (direct Firestore access) ✅ UPDATED
- components/auth/auth-form.tsx (storeInvitationCode) ✅ UPDATED
- lib/firebase/client-service.ts (getUserById) ✅ UPDATED

### Files importing from lib/auth/auth-service.ts:
- app/api/auth/signup/route.ts (signIn function) ⏳ PENDING

## Testing Strategy
1. ✅ Update API routes first and test with existing frontend
2. ✅ Update one component at a time and test functionality  
3. ⏳ Update hooks and test real-time updates
4. ⏳ Full integration testing

## Rollback Plan
- Keep original services intact until migration is complete
- Use feature flags if needed
- Gradual migration allows for easy rollback of individual components

## Import/Export Changes Made

### New Imports Added:
\`\`\`typescript
// In API routes
import { UnifiedAuthService } from '@/lib/services/unified-auth-service'
import { UnifiedClientService } from '@/lib/services/unified-client-service'

// In components and hooks
import type { AuthResult, ClientResult } from '@/lib/services/...'
\`\`\`

### Deprecated Imports Removed:
\`\`\`typescript
// Removed direct Firebase imports in components
import { signInWithEmailAndPassword } from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'

// Removed direct service imports where replaced
import { fetchClients } from '@/lib/firebase/client-service'
import { getCurrentUser } from '@/lib/firebase/user-service'
\`\`\`

## Next Steps
1. Complete remaining API routes (logout, signup)
2. Update remaining client components
3. Update all hooks to use unified services
4. Add deprecation warnings to old services
5. Full testing and validation
