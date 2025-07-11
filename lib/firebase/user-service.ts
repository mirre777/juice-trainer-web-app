import { db } from "./firebase"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { getAuth, onAuthStateChanged, type User } from "firebase/auth"

export interface UserProfile {
  uid?: string
  email: string
  name?: string
  role: "trainer" | "user" | "admin"
  user_type?: "trainer" | "client"
  hasFirebaseAuth?: boolean
  profilePicture?: string
  createdAt?: Timestamp | Date
  updatedAt?: Timestamp | Date
  isApproved?: boolean
  subscriptionStatus?: string
  stripeCustomerId?: string
  universalInviteCode?: string
}

export async function getUserProfile(email: string): Promise<UserProfile | null> {
  try {
    console.log("[getUserProfile] 🔍 Fetching user profile for:", email)

    if (!email) {
      console.log("[getUserProfile] ❌ No email provided")
      return null
    }

    // Query users by email
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))

    console.log("[getUserProfile] 📋 Executing Firestore query...")
    const querySnapshot = await getDocs(q)

    console.log(`[getUserProfile] 📊 Query returned ${querySnapshot.size} documents`)

    if (querySnapshot.empty) {
      console.log("[getUserProfile] ❌ No user found with email:", email)
      return null
    }

    if (querySnapshot.size > 1) {
      console.warn("[getUserProfile] ⚠️ Multiple users found with email:", email, "- using first one")
    }

    // Get the first (should be only) user document
    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    console.log("[getUserProfile] 📄 Raw user data from Firestore:", {
      id: userDoc.id,
      email: userData.email,
      role: userData.role,
      user_type: userData.user_type,
      name: userData.name,
      roleType: typeof userData.role,
      rawRole: JSON.stringify(userData.role),
    })

    // Ensure role is properly set
    let role: "trainer" | "user" | "admin" = "user" // Default

    if (userData.role === "trainer" || userData.role === "admin") {
      role = userData.role
    } else if (userData.user_type === "trainer") {
      // Fallback: if user_type is trainer but role isn't set correctly
      role = "trainer"
      console.log("[getUserProfile] 🔄 Using user_type as role fallback")
    }

    const userProfile: UserProfile = {
      uid: userDoc.id,
      email: userData.email,
      name: userData.name || "",
      role: role,
      user_type: userData.user_type,
      hasFirebaseAuth: userData.hasFirebaseAuth,
      profilePicture: userData.profilePicture,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      isApproved: userData.isApproved,
      subscriptionStatus: userData.subscriptionStatus,
      stripeCustomerId: userData.stripeCustomerId,
      universalInviteCode: userData.universalInviteCode,
    }

    console.log("[getUserProfile] ✅ Processed user profile:", {
      email: userProfile.email,
      role: userProfile.role,
      user_type: userProfile.user_type,
      name: userProfile.name,
    })

    return userProfile
  } catch (error: any) {
    console.error("[getUserProfile] ❌ Error fetching user profile:", error)
    console.error("[getUserProfile] Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    })
    throw error
  }
}

export async function getUserById(uid: string): Promise<UserProfile | null> {
  try {
    console.log("[getUserById] 🔍 Fetching user by ID:", uid)

    if (!uid) {
      console.log("[getUserById] ❌ No user ID provided")
      return null
    }

    const docRef = doc(db, "users", uid)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      console.log("[getUserById] ❌ No user found with ID:", uid)
      return null
    }

    const userData = docSnap.data()

    const userProfile: UserProfile = {
      uid: docSnap.id,
      email: userData.email,
      name: userData.name || "",
      role: userData.role || "user",
      user_type: userData.user_type,
      hasFirebaseAuth: userData.hasFirebaseAuth,
      profilePicture: userData.profilePicture,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      isApproved: userData.isApproved,
      subscriptionStatus: userData.subscriptionStatus,
      stripeCustomerId: userData.stripeCustomerId,
      universalInviteCode: userData.universalInviteCode,
    }

    console.log("[getUserById] ✅ User profile fetched:", {
      uid: userProfile.uid,
      email: userProfile.email,
      role: userProfile.role,
    })

    return userProfile
  } catch (error: any) {
    console.error("[getUserById] ❌ Error fetching user by ID:", error)
    throw error
  }
}

// Legacy function for backward compatibility
export async function getUserByEmail(email: string): Promise<any> {
  const profile = await getUserProfile(email)
  if (!profile) return null

  return {
    id: profile.uid,
    ...profile,
  }
}

// Get current user from Firebase Auth
export async function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

// Get current user data from Firestore
export async function getCurrentUserData(): Promise<UserProfile | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    return await getUserById(user.uid)
  } catch (error) {
    console.error("[getCurrentUserData] Error:", error)
    return null
  }
}

// Store invitation code for a user
export async function storeInvitationCode(userId: string, inviteCode: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      invitationCode: inviteCode,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error("[storeInvitationCode] Error:", error)
    return false
  }
}

// Create a new user
export async function createUser(userData: Partial<UserProfile>): Promise<string | null> {
  try {
    const usersRef = collection(db, "users")
    const docRef = await addDoc(usersRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("[createUser] Error:", error)
    return null
  }
}

// Update user data
export async function updateUser(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error("[updateUser] Error:", error)
    return false
  }
}

// Update universal invite code
export async function updateUniversalInviteCode(userId: string, code: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      universalInviteCode: code,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error("[updateUniversalInviteCode] Error:", error)
    return false
  }
}

// Approve a user
export async function approveUser(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      isApproved: true,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error("[approveUser] Error:", error)
    return false
  }
}

// Get pending users
export async function getPendingUsers(): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("isApproved", "==", false))
    const querySnapshot = await getDocs(q)

    const users: UserProfile[] = []
    querySnapshot.forEach((doc) => {
      const userData = doc.data()
      users.push({
        uid: doc.id,
        email: userData.email,
        name: userData.name || "",
        role: userData.role || "user",
        user_type: userData.user_type,
        hasFirebaseAuth: userData.hasFirebaseAuth,
        profilePicture: userData.profilePicture,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        isApproved: userData.isApproved,
        subscriptionStatus: userData.subscriptionStatus,
        stripeCustomerId: userData.stripeCustomerId,
        universalInviteCode: userData.universalInviteCode,
      })
    })

    return users
  } catch (error) {
    console.error("[getPendingUsers] Error:", error)
    return []
  }
}

// Signup with universal code
export async function signupWithUniversalCode(
  email: string,
  password: string,
  name: string,
  code: string,
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Create user with universal code logic
    const userData: Partial<UserProfile> = {
      email,
      name,
      role: "user",
      isApproved: false,
      universalInviteCode: code,
    }

    const userId = await createUser(userData)
    if (!userId) {
      return { success: false, error: "Failed to create user" }
    }

    return { success: true, userId }
  } catch (error) {
    console.error("[signupWithUniversalCode] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
