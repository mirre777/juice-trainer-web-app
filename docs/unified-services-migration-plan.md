# Unified Services Migration Plan

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

### Components (Client Operations)
9. **components/clients/add-client-modal.tsx** - Update to use UnifiedClientService.addClient()
10. **components/clients/client-actions.tsx** - Update to use UnifiedClientService.deleteClient()

### Hooks
11. **lib/hooks/use-client-data.ts** - Update to use UnifiedClientService.subscribeToClients()
12. **lib/hooks/use-client-data-api.ts** - Update to use UnifiedClientService.getClients()
13. **lib/hooks/use-client-data-hybrid.ts** - Update to use UnifiedClientService methods
14. **hooks/use-current-user.ts** - Update to use UnifiedAuthService.getCurrentUser()

### Pages
15. **app/clients/ClientPage.tsx** - Update to use UnifiedClientService
16. **app/clients/page.tsx** - Verify it uses the updated ClientPage component

### Services (To be deprecated/updated)
17. **lib/auth/auth-service.ts** - Mark as deprecated, redirect to UnifiedAuthService
18. **lib/firebase/client-service.ts** - Mark functions as deprecated, redirect to UnifiedClientService
19. **lib/firebase/user-service.ts** - Update getCurrentUser functions to use UnifiedAuthService
20. **lib/services/client-user-service.ts** - Update to use UnifiedAuthService

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
- components/auth/auth-form.tsx (storeInviteCode)
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
