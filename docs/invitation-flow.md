--- a/docs/invitation-flow.md
+++ b/docs/invitation-flow.md
@@ -4,7 +4,7 @@
 
 ## Current Data Structure
 
-The invitation system uses client documents in trainer subcollections to store invitation data:
+The invitation system uses client documents in trainer subcollections to store invitation data, and the client's user document to store the invite code:
 
 \`\`\`
 /users/{trainerId}/clients/{clientId}
@@ -12,7 +12,10 @@
   - inviteCode: "a1b2c3d4"
   - status: "Pending" → "Accepted Invitation" → "Active"
   - isTemporary: true → false (after account creation)
+  - inviteAcceptedAt: timestamp (when accepted)
   - inviteSentAt: timestamp
-  - inviteAcceptedAt: timestamp (when accepted)
   - userId: null → "firebase-user-id" (after account creation)
+\`\`\`
+
+\`\`\`
+/users/{userId} (Client's user account)
+  - inviteCode: "a1b2c3d4" (stored during signup for processing)
 \`\`\`
 
 ## 1. Adding a Client & Generating Invitation
@@ -74,6 +77,7 @@
 3. During signup, the client enters the invitation code or it's passed automatically from the URL
 4. The signup process calls the `/api/auth/signup` route which:
    - Creates the Firebase user account
+   - **Crucially, the `inviteCode` is now stored in the user document.**
    - Stores the invite code in the user document:
      \`\`\`typescript
      {
@@ -106,6 +110,8 @@
 ## Status Flow
 
 1. **Pending** → Initial state when invitation is sent
-2. **Accepted Invitation** → Client has accepted the invitation but hasn't created an account yet
-3. **Active** → Client has created an account and is fully onboarded
+2. **Accepted Invitation** → Client has accepted the invitation but hasn't created an account yet (or account is pending trainer approval)
+3. **Active** → Client has created an account and is fully onboarded (trainer has approved connection)
+4. **On Hold** → Client's status is temporarily paused by the trainer
+5. **Inactive** → Client is no longer actively training
+6. **Deleted** → Client has been soft-deleted by the trainer
\`\`\`
