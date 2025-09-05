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
  createdAt?: Timestamp
  updatedAt?: Timestamp
  inviteCode?: string
  universalInviteCode?: string
  pendingUsers?: string[]
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

export async function getUserByUid(uid: string): Promise<User | null> {
  try {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)
    return userSnap.exists() ? { id: uid, ...userSnap.data() } as User : null
  } catch (error) {
    console.error("Error getting user by UID:", error)
    throw error
  }
}

export async function createUser(userId: string, userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
  try {
    const userRef = doc(collection(db, "users"), userId)
    const newUser: Omit<User, "id"> = {
      ...userData,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }

    await setDoc(userRef, newUser)

    return {
      id: userId,
      ...newUser,
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

export async function storeInviteCode(userId: string, inviteCode: string): Promise<void> {
  try {
    await updateUser(userId, { inviteCode })
  } catch (error) {
    console.error("Error storing invitation code:", error)
    throw error
  }
}

export async function signupWithUniversalCode(
  userId: string,
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

    const newUser = await createUser(userId, {
      email,
      name,
      role: "client",
      inviteCode: universalCode,
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

export async function removePendingUser(userId: string, trainerId: string): Promise<{ success: boolean; message: string }> {
  try {
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

    return { success: true, message: "User removed from pending list successfully" }
  } catch (error) {
    console.error("Error removing user from pending list:", error)
    return { success: false, message: "Failed to remove user from pending list" }
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
