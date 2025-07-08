import { db } from "./firebase"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"

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
    console.log("[getUserProfile] Fetching user profile for:", email)

    if (!email) {
      console.log("[getUserProfile] No email provided")
      return null
    }

    // Query users by email
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log("[getUserProfile] No user found with email:", email)
      return null
    }

    if (querySnapshot.size > 1) {
      console.warn("[getUserProfile] Multiple users found with email:", email, "- using first one")
    }

    // Get the first (should be only) user document
    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    console.log("[getUserProfile] Raw user data from Firestore:", {
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
      console.log("[getUserProfile] Using user_type as role fallback")
    }

    const userProfile: UserProfile = {
      uid: userDoc.id,
      email: userData.email,
      name: userData.name,
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

    console.log("[getUserProfile] Processed user profile:", {
      email: userProfile.email,
      role: userProfile.role,
      user_type: userProfile.user_type,
      name: userProfile.name,
    })

    return userProfile
  } catch (error) {
    console.error("[getUserProfile] Error fetching user profile:", error)
    throw error
  }
}

export async function createUserProfile(userData: Partial<UserProfile>): Promise<UserProfile> {
  try {
    console.log("[createUserProfile] Creating user profile:", userData)

    if (!userData.email) {
      throw new Error("Email is required to create user profile")
    }

    // Check if user already exists
    const existingUser = await getUserProfile(userData.email)
    if (existingUser) {
      console.log("[createUserProfile] User already exists, updating instead")
      return await updateUserProfile(userData.email, userData)
    }

    const userProfile: UserProfile = {
      email: userData.email,
      name: userData.name || "",
      role: userData.role || "user",
      user_type: userData.user_type || "client",
      hasFirebaseAuth: userData.hasFirebaseAuth || false,
      profilePicture: userData.profilePicture,
      isApproved: userData.isApproved || false,
      subscriptionStatus: userData.subscriptionStatus || "inactive",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Create document with auto-generated ID
    const usersRef = collection(db, "users")
    const docRef = doc(usersRef)

    await setDoc(docRef, userProfile)

    console.log("[createUserProfile] User profile created with ID:", docRef.id)

    return {
      ...userProfile,
      uid: docRef.id,
    }
  } catch (error) {
    console.error("[createUserProfile] Error creating user profile:", error)
    throw error
  }
}

export async function updateUserProfile(email: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    console.log("[updateUserProfile] Updating user profile for:", email, "with:", updates)

    // Find the user document
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      throw new Error(`User not found with email: ${email}`)
    }

    const userDoc = querySnapshot.docs[0]
    const docRef = doc(db, "users", userDoc.id)

    // Prepare update data
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    await updateDoc(docRef, updateData)

    console.log("[updateUserProfile] User profile updated successfully")

    // Return updated profile
    const updatedProfile = await getUserProfile(email)
    if (!updatedProfile) {
      throw new Error("Failed to fetch updated user profile")
    }

    return updatedProfile
  } catch (error) {
    console.error("[updateUserProfile] Error updating user profile:", error)
    throw error
  }
}

export async function getUserById(uid: string): Promise<UserProfile | null> {
  try {
    console.log("[getUserById] Fetching user by ID:", uid)

    const docRef = doc(db, "users", uid)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      console.log("[getUserById] No user found with ID:", uid)
      return null
    }

    const userData = docSnap.data()

    const userProfile: UserProfile = {
      uid: docSnap.id,
      email: userData.email,
      name: userData.name,
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

    console.log("[getUserById] User profile fetched:", {
      uid: userProfile.uid,
      email: userProfile.email,
      role: userProfile.role,
    })

    return userProfile
  } catch (error) {
    console.error("[getUserById] Error fetching user by ID:", error)
    throw error
  }
}
