import { db } from "@/lib/firebase/firebase"
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore"

export interface User {
  id: string
  email: string
  name?: string
  role?: string
  status?: string
  user_type?: string[]
  createdAt?: any
  updatedAt?: any
  hasFirebaseAuth?: boolean
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    console.log(`[getUserById] 🔍 Fetching user by ID: ${userId}`)

    const userDoc = await getDoc(doc(db, "users", userId))

    if (!userDoc.exists()) {
      console.log(`[getUserById] ❌ No user found with ID: ${userId}`)
      return null
    }

    const userData = userDoc.data()
    console.log(`[getUserById] ✅ User found:`, userData)

    return {
      id: userDoc.id,
      ...userData,
    } as User
  } catch (error: any) {
    console.error(`[getUserById] ❌ Error fetching user:`, error)
    throw error
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    console.log(`[getUserByEmail] 🔍 Fetching user by email: ${email}`)

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email), limit(1))
    const querySnapshot = await getDocs(q)

    console.log(`[getUserByEmail] 📊 Query returned ${querySnapshot.size} documents`)

    if (querySnapshot.empty) {
      console.log(`[getUserByEmail] ❌ No user found with email: ${email}`)
      return null
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    console.log(`[getUserByEmail] ✅ User found:`, userData)

    return {
      id: userDoc.id,
      ...userData,
    } as User
  } catch (error: any) {
    console.error(`[getUserByEmail] ❌ Error fetching user:`, error)
    throw error
  }
}
