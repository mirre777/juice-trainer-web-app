import { auth, db } from "./firebase"
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"

// Simplified user creation - no complex role logic
export async function createUser(userData: {
  email: string
  password?: string
  name?: string
  inviteCode?: string
}): Promise<{ success: boolean; userId?: string; error?: any }> {
  try {
    let userId: string

    // Create Firebase Auth user if password provided
    if (userData.password) {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
      userId = userCredential.user.uid
    } else {
      // Create Firestore-only user
      const usersRef = collection(db, "users")
      const docRef = await addDoc(usersRef, { email: userData.email.toLowerCase() })
      userId = docRef.id
    }

    // Simple user document - no complex fields
    const userDocData: any = {
      email: userData.email.toLowerCase(),
      name: userData.name || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // If they used an invite code, add them to trainer's pending list
    if (userData.inviteCode) {
      const trainer = await getTrainerByInviteCode(userData.inviteCode)
      if (trainer) {
        userDocData.pendingApprovalFrom = trainer.id
        userDocData.status = "pending_approval"

        // Add to trainer's pending list
        const trainerRef = doc(db, "users", trainer.id)
        await updateDoc(trainerRef, {
          pendingUsers: arrayUnion(userId),
        })
      }
    }

    const userRef = doc(db, "users", userId)
    await setDoc(userRef, userDocData)

    return { success: true, userId }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, error }
  }
}

// Find trainer by their universal invite code
async function getTrainerByInviteCode(inviteCode: string) {
  const usersRef = collection(db, "users")
  const q = query(usersRef, where("universalInviteCode", "==", inviteCode.toUpperCase()))
  const querySnapshot = await getDocs(q)

  if (!querySnapshot.empty) {
    const trainerDoc = querySnapshot.docs[0]
    return { id: trainerDoc.id, ...trainerDoc.data() }
  }
  return null
}

// Simplified approval - just move user from pending to approved
export async function approveUser(
  trainerId: string,
  userId: string,
  action: "approve" | "reject",
): Promise<{ success: boolean; error?: any }> {
  try {
    const userRef = doc(db, "users", userId)
    const trainerRef = doc(db, "users", trainerId)

    if (action === "approve") {
      // Update user status
      await updateDoc(userRef, {
        status: "approved",
        trainerId: trainerId, // Simple - just store the trainer ID
        approvedAt: serverTimestamp(),
      })
    } else {
      // Reject user
      await updateDoc(userRef, {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      })
    }

    // Remove from pending list
    await updateDoc(trainerRef, {
      pendingUsers: arrayRemove(userId),
    })

    return { success: true }
  } catch (error) {
    console.error("Error approving user:", error)
    return { success: false, error }
  }
}
