export async function getUserByEmail(email: string) {
  try {
    console.log(`[getUserByEmail] Searching for user with email: ${email}`)

    // Create a query to find user by email
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`[getUserByEmail] No user found with email: ${email}`)
      return null
    }

    // Get the first matching document
    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    console.log(`[getUserByEmail] Found user:`, { id: userDoc.id, email: userData.email, role: userData.role })

    return {
      id: userDoc.id,
      ...userData,
    }
  } catch (error: any) {
    console.error(`[getUserByEmail] Error:`, error)
    throw new Error(`Failed to get user by email: ${error.message}`)
  }
}
