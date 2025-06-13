import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export interface UserData {
  name?: string
  email?: string
  image?: string
  displayName?: string
}

export async function getUserData(userId: string): Promise<{ user: UserData | null; error: string | null }> {
  try {
    console.log(`[getUserData] Fetching user data for userId: ${userId}`)

    const userDoc = await getDoc(doc(db, "users", userId))

    if (!userDoc.exists()) {
      console.log(`[getUserData] User document not found for userId: ${userId}`)
      return { user: null, error: "User not found" }
    }

    const userData = userDoc.data() as UserData
    console.log(`[getUserData] Successfully fetched user data:`, userData)

    return { user: userData, error: null }
  } catch (error) {
    console.error(`[getUserData] Error fetching user data for userId ${userId}:`, error)
    return { user: null, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
