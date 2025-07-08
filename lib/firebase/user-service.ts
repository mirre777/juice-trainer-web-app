import { db } from "./firebase"
import { collection, query, where, getDocs, doc, getDoc, type Timestamp } from "firebase/firestore"

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
