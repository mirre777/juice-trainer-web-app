# Firebase Integration

This document outlines how Firebase is integrated into the Juice Coaching Platform application.

## Configuration

Firebase is configured in `lib/firebase/firebase.ts` using environment variables:

\`\`\`typescript
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

export { app, db, auth, storage }
\`\`\`

## Authentication

Firebase Authentication is used for user authentication. The application supports:

- Email/Password authentication
- Google OAuth authentication

### Email/Password Authentication

Email/password authentication is implemented in `lib/firebase/user-service.ts`:

\`\`\`typescript
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

export async function signUpWithEmail(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Error signing up:", error);
    return { success: false, error };
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Error signing in:", error);
    return { success: false, error };
  }
}
\`\`\`

### Google OAuth Authentication

Google OAuth authentication is implemented using custom server routes and token management:

- `app/api/auth/google/callback/route.ts` - Handles the OAuth callback
- `app/api/auth/google/refresh/route.ts` - Refreshes the OAuth token
- `app/api/auth/google/logout/route.ts` - Handles logout
- `lib/auth/token-service.ts` - Manages token encryption and storage
- `lib/auth/client-token-service.ts` - Client-side token management

## Firestore

Firestore is used as the database for storing:

- User profiles
- Workout programs
- Client data
- Exercise history
- Session data

### Service Files

Firebase operations are organized into service files:

- `lib/firebase/user-service.ts` - User-related operations
- `lib/firebase/client-service.ts` - Client-related operations
- `lib/firebase/workout-service.ts` - Workout-related operations

### Data Structure

The application uses a subcollection pattern for organizing client data:

#### Users Collection

\`\`\`
/users/{userId}
  - email: string
  - name: string
  - role: 'admin' | 'coach' | 'client'
  - clients: string[] (array of client document IDs) - only for coaches
  - trainers: string[] (array of trainer user IDs) - only for clients
  - inviteCode: string (optional, stored during signup for processing)
  - createdAt: timestamp
  - updatedAt: timestamp
  
  /clients/{clientId} (subcollection - only for coaches)
    - name: string
    - email: string
    - phone: string
    - status: 'Pending' | 'Accepted Invitation' | 'Active'
    - inviteCode: string
    - inviteSentAt: timestamp
    - inviteAcceptedAt: timestamp (optional)
    - isTemporary: boolean
    - userId: string (reference to user, once account is created)
    - createdAt: timestamp
    - updatedAt: timestamp
\`\`\`

**Note**: The `inviteCode` field in the user document is populated during signup when a user signs up via an invitation link. This field was previously not being set during the signup process, causing the `processInvitation` function to fail in linking client documents. The field now gets properly populated to ensure the client's status is updated to "Active" and the trainer-client relationship is established.

#### Programs Collection

\`\`\`
/programs/{programId}
  - name: string
  - description: string
  - coachId: string (reference to user)
  - weeks: number
  - createdAt: timestamp
  - updatedAt: timestamp
  - weeks: [
      {
        number: number,
        days: [
          {
            number: number,
            exercises: [
              {
                name: string,
                sets: number,
                reps: string,
                weight: string,
                notes: string
              }
            ]
          }
        ]
      }
    ]
\`\`\`

#### Workouts Collection

\`\`\`
/workouts/{workoutId}
  - clientId: string (reference to client)
  - programId: string (reference to program)
  - week: number
  - day: number
  - completed: boolean
  - completedAt: timestamp
  - exercises: [
      {
        name: string,
        sets: [
          {
            weight: string,
            reps: string,
            completed: boolean
          }
        ]
      }
    ]
\`\`\`

### Demo Mode

In demo mode, the application uses mock data instead of fetching from Firebase. This is implemented by:

1. Checking the `isDemo` prop in components
2. Using mock data from `lib/demo-data.ts` when in demo mode
3. Bypassing Firebase calls when in demo mode

Example:
\`\`\`typescript
// lib/firebase/client-service.ts
export async function fetchClients(trainerId: string, isDemo = false) {
  // Return mock data if in demo mode
  if (isDemo || trainerId === "demo-trainer-id") {
    return mockClients;
  }
  
  // Otherwise, fetch from Firebase
  try {
    const clientsCollectionRef = collection(db, "users", trainerId, "clients");
    const querySnapshot = await getDocs(clientsCollectionRef);
    
    const clients = [];
    querySnapshot.forEach((doc) => {
      clients.push({ id: doc.id, ...doc.data() });
    });
    
    return clients;
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}
\`\`\`

## Storage

Firebase Storage is used for storing:

- User profile images
- Exercise demonstration images/videos
- Program attachments

Example usage:
\`\`\`typescript
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadProfileImage(userId: string, file: File) {
  try {
    const storageRef = ref(storage, `profile-images/${userId}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return { success: false, error };
  }
}
\`\`\`

## Security Rules

Firestore security rules ensure that:

1. Users can only access their own data
2. Coaches can access data for their clients
3. Admins can access all data

Example security rules:
\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Coaches can read/write their own clients (in subcollection)
    match /users/{userId}/clients/{clientId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Programs can be read by the coach who created them or clients assigned to them
    match /programs/{programId} {
      allow read: if request.auth != null && 
        (resource.data.coachId == request.auth.uid || 
         exists(/databases/$(database)/documents/clients/$(request.auth.uid)) && 
         get(/databases/$(database)/documents/clients/$(request.auth.uid)).data.programId == programId);
      allow write: if request.auth != null && 
        (resource.data.coachId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
\`\`\`

## Real-time Updates

The application uses Firestore's real-time capabilities to provide live updates:

\`\`\`typescript
// Example of setting up a real-time listener
export function subscribeToClients(trainerId: string, callback: (clients: Client[]) => void) {
  const clientsCollectionRef = collection(db, "users", trainerId, "clients");
  
  // Set up the real-time listener
  const unsubscribe = onSnapshot(clientsCollectionRef, (snapshot) => {
    const clients = snapshot.docs.map(doc => mapClientData(doc.id, doc.data()));
    callback(clients);
  }, (error) => {
    console.error("Error subscribing to clients:", error);
  });
  
  // Return the unsubscribe function
  return unsubscribe;
}
\`\`\`

## Best Practices

1. **Use Batch Operations** for related updates to ensure atomicity
2. **Listen for Real-time Updates** when appropriate
3. **Implement Proper Error Handling** for all Firebase operations
4. **Use Security Rules** to enforce access control
5. **Optimize Queries** to minimize reads and writes
6. **Handle Demo Mode** by checking the `isDemo` prop and using mock data
7. **Separate Firebase Logic** into service files for better organization
8. **Use Subcollections** for hierarchical data like clients under trainers
