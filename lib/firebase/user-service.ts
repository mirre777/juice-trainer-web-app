import { db } from "./firebase"
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
  type Timestamp,
} from "firebase/firestore"
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"

// Log Firebase config to debug
console.log("Firebase Config Check:", {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "SET" : "MISSING",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "SET" : "MISSING",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "SET" : "MISSING",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "SET" : "MISSING",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "SET" : "MISSING",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "SET" : "MISSING",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ? "SET" : "MISSING",
})

export interface User {
  id: string
  email: string
  name?: string
  role?: "trainer" | "client" | "admin"
  isApproved?: boolean
  status?: "active" | "pending_approval" | "inactive"
  createdAt?: Timestamp
  updatedAt?: Timestamp
  invitationCode?: string
  universalInviteCode?: string
  pendingUsers?: string[]
}

// Get current authenticated user
export async function getCurrentUser(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    const auth = getAuth()

    if (auth.currentUser) {
      console.log("[getCurrentUser] User already available:", auth.currentUser.uid)
      resolve(auth.currentUser)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("[getCurrentUser] Auth state changed:", user?.uid || "null")
      unsubscribe()
      resolve(user)
    })
  })
}

// Get current user's Firestore data
export async function getCurrentUserData(): Promise<User | null> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.log("[getCurrentUserData] No authenticated user")
      return null
    }

    return await getUserById(currentUser.uid)
  } catch (error) {
    console.error("[getCurrentUserData] Error getting current user data:", error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    console.log("Getting user by email:", email)
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log("No user found with email:", email)
      return null
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data() as User
    console.log("Found user:", { id: userDoc.id, email: userData.email })

    return {
      id: userDoc.id,
      ...userData,
    }
  } catch (error) {
    console.error("Error getting user by email:", error)
    throw error
  }
}

export async function createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
  try {
    console.log("Creating user:", userData.email)
    const userRef = doc(collection(db, "users"))
    const newUser: Omit<User, "id"> = {
      ...userData,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }

    await setDoc(userRef, newUser)
    console.log("User created successfully:", userRef.id)

    return {
      id: userRef.id,
      ...userData,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  try {
    console.log("Updating user:", userId, updates)
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
    console.log("User updated successfully:", userId)
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    console.log("Getting user by ID:", userId)
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      console.log("No user found with ID:", userId)
      return null
    }

    const userData = userSnap.data() as User
    console.log("Found user by ID:", { id: userId, email: userData.email })

    return {
      id: userId,
      ...userData,
    }
  } catch (error) {
    console.error("Error getting user by ID:", error)
    throw error
  }
}

export async function storeInvitationCode(userId: string, invitationCode: string): Promise<void> {
  try {
    console.log("Storing invitation code for user:", userId)
    await updateUser(userId, { invitationCode })
    console.log("Invitation code stored successfully")
  } catch (error) {
    console.error("Error storing invitation code:", error)
    throw error
  }
}

// Sign up with universal code
export async function signupWithUniversalCode(
  email: string,
  name: string,
  universalCode: string,
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    console.log("Signing up with universal code:", { email, universalCode })

    // Find trainer with this universal code
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("universalInviteCode", "==", universalCode))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return { success: false, message: "Invalid invitation code" }
    }

    const trainerDoc = querySnapshot.docs[0]
    const trainerId = trainerDoc.id

    // Create new user
    const newUser = await createUser({
      email,
      name,
      role: "client",
      status: "pending_approval",
      invitationCode: universalCode,
    })

    // Add user to trainer's pending list
    await updateDoc(doc(db, "users", trainerId), {
      pendingUsers: arrayUnion(newUser.id),
      updatedAt: serverTimestamp(),
    })

    console.log("User signed up successfully:", newUser.id)
    return { success: true, message: "Account created, pending approval", userId: newUser.id }
  } catch (error) {
    console.error("Error signing up with universal code:", error)
    return { success: false, message: "Failed to create account" }
  }
}

// Approve user
export async function approveUser(userId: string, trainerId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Approving user:", { userId, trainerId })

    // Update user status
    await updateUser(userId, {
      status: "active",
      isApproved: true,
    })

    // Remove from pending list and add to approved clients
    const trainerRef = doc(db, "users", trainerId)
    const trainerDoc = await getDoc(trainerRef)

    if (trainerDoc.exists()) {
      const trainerData = trainerDoc.data()
      const pendingUsers = (trainerData.pendingUsers || []).filter((id: string) => id !== userId)

      await updateDoc(trainerRef, {
        pendingUsers,
        updatedAt: serverTimestamp(),
      })
    }

    console.log("User approved successfully:", userId)
    return { success: true, message: "User approved successfully" }
  } catch (error) {
    console.error("Error approving user:", error)
    return { success: false, message: "Failed to approve user" }
  }
}

// Get pending users for a trainer
export async function getPendingUsers(trainerId: string): Promise<User[]> {
  try {
    console.log("Getting pending users for trainer:", trainerId)

    const trainerRef = doc(db, "users", trainerId)
    const trainerDoc = await getDoc(trainerRef)

    if (!trainerDoc.exists()) {
      return []
    }

    const trainerData = trainerDoc.data()
    const pendingUserIds = trainerData.pendingUsers || []

    if (pendingUserIds.length === 0) {
      return []
    }

    // Get all pending users
    const pendingUsers: User[] = []
    for (const userId of pendingUserIds) {
      const user = await getUserById(userId)
      if (user) {
        pendingUsers.push(user)
      }
    }

    console.log("Found pending users:", pendingUsers.length)
    return pendingUsers
  } catch (error) {
    console.error("Error getting pending users:", error)
    return []
  }
}

// Update universal invite code
export async function updateUniversalInviteCode(
  trainerId: string,
  newCode: string,
): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Updating universal invite code for trainer:", trainerId)

    await updateUser(trainerId, {
      universalInviteCode: newCode,
    })

    console.log("Universal invite code updated successfully")
    return { success: true, message: "Invite code updated successfully" }
  } catch (error) {
    console.error("Error updating universal invite code:", error)
    return { success: false, message: "Failed to update invite code" }
  }
}
