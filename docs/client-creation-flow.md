# Client Creation Flow

This document outlines the client creation and invitation flow in the Juice Coaching Platform.

## Overview

The client creation flow consists of several steps:

1. Coach creates a client in the system
2. System generates an invitation code
3. Coach sends the invitation to the client
4. Client accepts the invitation
5. Client creates an account or logs in
6. Client is associated with the coach

## Data Model

### Key Relationships

- **Trainer's `clients` array**: Contains client document IDs from the trainer's clients subcollection
- **Client document**: Stored in the trainer's clients subcollection, contains:
  - Client information (name, email, etc.)
  - Invitation code
  - Client status
  - User ID (once the client creates an account)

### Flow Diagram

\`\`\`
Trainer User Document
└── clients array [clientDocId1, clientDocId2, ...]
    └── Each ID references a document in the clients subcollection

Trainer's Clients Subcollection
└── Client Document (clientDocId)
    ├── name, email, etc.
    ├── inviteCode: "a1b2c3d4"
    ├── status: "Pending" → "Accepted Invitation" → "Active"
    ├── isTemporary: true → false (after account creation)
    ├── inviteSentAt: timestamp
    ├── inviteAcceptedAt: timestamp (when accepted)
    └── userId: null → "firebase-user-id" (after account creation)
\`\`\`

## Components Involved

### Client Creation

- `components/clients/add-client-modal.tsx` - Modal for adding a new client
- `components/clients/client-invitation-dialog.tsx` - Dialog for showing the invitation link
- `lib/firebase/client-service.ts` - Service for creating clients in Firebase

### Invitation Management

- `app/api/invitations/[code]/route.ts` - API route for getting invitation details
- `app/api/invitations/[code]/validate/route.ts` - API route for validating invitation codes
- `app/invite/[code]/page.tsx` - Page for accepting invitations
- `components/invitation/invitation-code-entry.tsx` - Component for entering invitation codes
- `hooks/use-invitation.ts` - Hook for managing invitations

## Flow Details

### 1. Client Creation

When a coach creates a client:

\`\`\`tsx
// components/clients/add-client-modal.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  setIsSubmitting(true);
  
  try {
    // Create client in Firebase
    const result = await createClient(userId, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      // other client data...
    });
    
    if (result.success) {
      // Show invitation dialog with the code
      setInviteCode(result.inviteCode);
      setClientId(result.clientId);
      setStep(2); // Move to invitation step
    } else {
      toast.error({ title: 'Error', description: 'Failed to create client' });
    }
  } catch (error) {
    console.error('Error creating client:', error);
    toast.error({ title: 'Error', description: 'An unexpected error occurred' });
  } finally {
    setIsSubmitting(false);
  }
};
\`\`\`

### 2. Client Document Creation

The system creates a client document in the trainer's subcollection:

\`\`\`typescript
// lib/firebase/client-service.ts
export async function createClient(trainerId: string, clientData: {...}) {
  try {
    // Generate a unique invitation code
    const inviteCode = generateRandomString(8);
    
    // Create client document data
    const clientDocData = {
      ...clientData,
      status: "Pending",
      inviteCode: inviteCode,
      inviteSent: true,
      inviteSentAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isTemporary: true,
      // Note: userId is not set yet
    };
    
    // Create a new client document in the trainer's clients subcollection
    const clientsCollectionRef = collection(db, "users", trainerId, "clients");
    const newClientRef = await addDoc(clientsCollectionRef, clientDocData);
    
    // Add the client document ID to the trainer's clients array
    const trainerRef = doc(db, "users", trainerId);
    await updateDoc(trainerRef, {
      clients: arrayUnion(newClientRef.id),
      updatedAt: serverTimestamp(),
    });
    
    return {
      success: true,
      clientId: newClientRef.id,
      inviteCode: inviteCode,
    };
  } catch (error) {
    console.error("Error creating client:", error);
    return { success: false, error };
  }
}
\`\`\`

### 3. Invitation Link

The coach sends the invitation link to the client:

\`\`\`tsx
// components/clients/client-invitation-dialog.tsx
function generateInviteLink(code: string, trainerName: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  const encodedName = encodeURIComponent(trainerName);
  return `${baseUrl}/invite/${code}?tn=${encodedName}`;
}
\`\`\`

### 4. Client Accepts Invitation

The client visits the invitation link and accepts it:

\`\`\`tsx
// app/invite/[code]/page.tsx
const handleAcceptInvitation = async () => {
  try {
    // Update the client status to "Accepted Invitation"
    const response = await fetch(`/api/invitations/${code}/accept`, {
      method: 'POST',
    });
    
    if (response.ok) {
      // Redirect to signup or login
      router.push(`/signup?invite=${code}`);
    } else {
      setError('Failed to accept invitation');
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
    setError('An unexpected error occurred');
  }
};
\`\`\`

### 5. Client Creates Account

After accepting the invitation, the client creates an account:

\`\`\`tsx
// components/auth/auth-form.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // Create user account
    const result = await signUp({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      inviteCode: invitationCode, // The inviteCode is now correctly passed and stored in the user document during signup
    });
    
    if (result.success) {
      // If there's an invitation code, process it
      if (invitationCode) {
        await processInvitation(invitationCode, result.user.uid);
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    }
  } catch (error) {
    console.error('Error signing up:', error);
  }
};
\`\`\`

### 6. Client Association

The client is associated with the coach by updating both the client document and user document:

\`\`\`typescript
// app/api/auth/signup/route.ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // Create user account and store invite code
    const result = await signUp({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      inviteCode: invitationCode, // Store invite code in user document
    });
    
    if (result.success) {
      // Process the invitation automatically
      if (invitationCode) {
        await processInvitation(invitationCode, result.user.uid);
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    }
  } catch (error) {
    console.error('Error signing up:', error);
  }
};
\`\`\`

\`\`\`typescript
// lib/firebase/client-service.ts
export async function processInvitation(inviteCode: string, userId: string) {
  try {
    // Find the client with this invitation code by searching trainer subcollections
    // ... (search logic)
    
    // When found:
    // 1. Update the client document with the user ID
    await updateDoc(clientRef, {
      userId: userId,         // Add the user ID to the client document
      isTemporary: false,
      status: "Active",       // Change status to Active
      updatedAt: serverTimestamp(),
    });
    
    // 2. Add the trainer to the user's trainers list
    const userRef = doc(collection(db, "users"), userId);
    await updateDoc(userRef, {
      trainers: arrayUnion(trainerId),
      updatedAt: serverTimestamp(),
    });
    
    return { success: true, trainerId, clientId };
  } catch (error) {
    console.error("Error processing invitation:", error);
    return { success: false, error };
  }
}
\`\`\`

## Data Access Patterns

### Fetching Clients for a Trainer

\`\`\`typescript
export async function fetchClients(trainerUid: string) {
  // Get all client documents from the trainer's clients subcollection
  const clientsCollectionRef = collection(db, "users", trainerUid, "clients");
  const clientsSnapshot = await getDocs(clientsCollectionRef);
  
  // Map the documents to client objects
  const clients = clientsSnapshot.docs.map(doc => mapClientData(doc.id, doc.data()));
  
  return clients;
}
\`\`\`

### Finding a Client by User ID

\`\`\`typescript
export async function findClientByUserId(trainerId: string, userId: string) {
  // Query the trainer's clients subcollection for a client with the given user ID
  const clientsCollectionRef = collection(db, "users", trainerId, "clients");
  const q = query(clientsCollectionRef, where("userId", "==", userId));
  const clientsSnapshot = await getDocs(q);
  
  if (!clientsSnapshot.empty) {
    const doc = clientsSnapshot.docs[0];
    return mapClientData(doc.id, doc.data());
  }
  
  return null;
}
\`\`\`

## Best Practices

1. **Consistent References**: Always use client document IDs in the trainer's clients array
2. **User Association**: Store the user ID in the client document after account creation
3. **Status Tracking**: Use the status field to track the client's journey:
   - "Pending" → Initial state when invitation is sent
   - "Accepted Invitation" → Client has accepted but hasn't created an account (or account is pending trainer approval)
   - "Active" → Client has created an account and is fully onboarded (trainer has approved connection)
   - "On Hold" → Client's status is temporarily paused by the trainer
   - "Inactive" → Client is no longer actively training
   - "Deleted" → Client has been soft-deleted by the trainer
4. **Secure Invitation Codes**: Invitation codes should be unique and hard to guess
5. **Expiration**: Invitations should expire after a certain period
6. **Validation**: Always validate invitation codes before accepting them
