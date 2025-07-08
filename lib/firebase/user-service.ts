import { collection, doc, getDoc, getDocs, updateDoc, query, where, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function getUserByEmail(email: string): Promise<any> {
  try {
    if (!email) {
      console.error("[getUserByEmail] No email provided")
      return null
    }

    console.log(`[getUserByEmail] 🔍 Searching for user with email: ${email}`)

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))

    console.log(`[getUserByEmail] 📋 Executing Firestore query...`)
    const querySnapshot = await getDocs(q)

    console.log(`[getUserByEmail] 📊 Query returned ${querySnapshot.size} documents`)

    if (querySnapshot.empty) {
      console.log(`[getUserByEmail] ❌ No user found with email: ${email}`)
      return null
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    console.log(`[getUserByEmail] ✅ Found user:`, {
      id: userDoc.id,
      email: userData.email,
      role: userData.role || "user",
    })

    return {
      id: userDoc.id,
      ...userData,
    }
  } catch (error: any) {
    console.error(`[getUserByEmail] ❌ Error fetching user data for ${email}:`, error)
    throw error
  }
}

export async function getUserById(userId: string): Promise<any> {
  try {
    if (!userId) {
      console.error("[getUserById] No user ID provided")
      return null
    }

    console.log(`[getUserById] 🔍 Fetching user with ID: ${userId}`)

    const userDocRef = doc(collection(db, "users"), userId)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      console.log(`[getUserById] ❌ No user found with ID: ${userId}`)
      return null
    }

    const userData = userDoc.data()
    console.log(`[getUserById] ✅ Found user:`, {
      id: userId,
      email: userData.email,
      role: userData.role || "user",
    })

    return {
      id: userId,
      ...userData,
    }
  } catch (error: any) {
    console.error(`[getUserById] ❌ Error fetching user data for ${userId}:`, error)
    throw error
  }
}

export async function updateUserRole(userId: string, role: string): Promise<boolean> {
  try {
    console.log(`[updateUserRole] 🔄 Updating role for user ${userId} to: ${role}`)

    const userDocRef = doc(collection(db, "users"), userId)
    await updateDoc(userDocRef, {
      role: role,
      updatedAt: serverTimestamp(),
    })

    console.log(`[updateUserRole] ✅ Role updated successfully`)
    return true
  } catch (error: any) {
    console.error(`[updateUserRole] ❌ Error updating role:`, error)
    throw error
  }
}
