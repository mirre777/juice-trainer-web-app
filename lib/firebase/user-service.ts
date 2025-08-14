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
  hasFirebaseAuth?: boolean
  firebaseUid?: string
}

export async function getCurrentUser(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    const auth = getAuth()
    if (auth.currentUser) {
      resolve(auth.currentUser)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export async function getCurrentUserData(): Promise<User | null> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return null
    }
    return await getUserById(currentUser.uid)
  } catch (error) {
    console.error("Error getting current user data:", error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data() as User
    return {
      ...userData,
      id: userDoc.id,
    }
  } catch (error) {
    console.error("Error getting user by email:", error)
    throw error
  }
}

export async function createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
  try {
    const userRef = doc(collection(db, "users"))
    const newUser: Omit<User, "id"> = {
      ...userData,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }

    await setDoc(userRef, newUser)

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
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return null
    }

    const userData = userSnap.data() as User
    return {
      ...userData,
      id: userId,
    }
  } catch (error) {
    console.error("Error getting user by ID:", error)
    throw error
  }
}

export async function storeInvitationCode(userId: string, invitationCode: string): Promise<void> {
  try {
    await updateUser(userId, { invitationCode })
  } catch (error) {
    console.error("Error storing invitation code:", error)
    throw error
  }
}

export async function signupWithUniversalCode(
  email: string,
  name: string,
  universalCode: string,
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const usersRef = collection(db, "users")
    const trainerQuery = query(usersRef, where("universalInviteCode", "==", universalCode))
    const trainerResult = await getDocs(trainerQuery)

    if (trainerResult.empty) {
      return { success: false, message: "Invalid invitation code" }
    }

    const trainerDoc = trainerResult.docs[0]
    const trainerId = trainerDoc.id

    const newUser = await createUser({
      email,
      name,
      role: "client",
      status: "pending_approval",
      invitationCode: universalCode,
    })

    await updateDoc(doc(db, "users", trainerId), {
      pendingUsers: arrayUnion(newUser.id),
      updatedAt: serverTimestamp(),
    })

    return { success: true, message: "Account created, pending approval", userId: newUser.id }
  } catch (error) {
    console.error("Error signing up with universal code:", error)
    return { success: false, message: "Failed to create account" }
  }
}

export async function approveUser(userId: string, trainerId: string): Promise<{ success: boolean; message: string }> {
  try {
    await updateUser(userId, {
      status: "active",
      isApproved: true,
    })

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

    return { success: true, message: "User approved successfully" }
  } catch (error) {
    console.error("Error approving user:", error)
    return { success: false, message: "Failed to approve user" }
  }
}

export async function rejectUser(userId: string, trainerId: string): Promise<{ success: boolean; message: string }> {
  try {
    await updateUser(userId, {
      status: "inactive",
    })
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

    return { success: true, message: "User rejected successfully" }
  } catch (error) {
    console.error("Error rejecting user:", error)
    return { success: false, message: "Failed to reject user" }
  }
}

export async function getPendingUsers(trainerId: string): Promise<User[]> {
  try {
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

    const pendingUsers: User[] = []
    for (const userId of pendingUserIds) {
      const user = await getUserById(userId)
      if (user) {
        pendingUsers.push(user)
      }
    }

    return pendingUsers
  } catch (error) {
    console.error("Error getting pending users:", error)
    return []
  }
}

export async function updateUniversalInviteCode(
  trainerId: string,
  newCode: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await updateUser(trainerId, {
      universalInviteCode: newCode,
    })

    return { success: true, message: "Invite code updated successfully" }
  } catch (error) {
    console.error("Error updating universal invite code:", error)
    return { success: false, message: "Failed to update invite code" }
  }
}
