// lib/firebase/user-service.ts

import { auth, db } from "./firebase"
import {
  collection,
  doc,
  getDoc,
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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { ErrorType, createError, logError, tryCatch } from "@/lib/utils/error-handler"

export const createUserWithAuth = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Create a user document in Firestore
    const userDocRef = doc(db, "users", user.uid)
    await setDoc(userDocRef, {
      email: user.email,
      uid: user.uid,
      // Add any other initial user data here
    })

    return user
  } catch (error: any) {
    console.error("Error creating user:", error)
    throw error
  }
}

export const signInUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error("Error signing in user:", error)
    throw error
  }
}

export const signOutUser = async () => {
  try {
    await signOut(auth)
  } catch (error: any) {
    console.error("Error signing out user:", error)
    throw error
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<any | null> {
  try {
    if (!userId) {
      const error = createError(ErrorType.API_MISSING_PARAMS, null, { function: "getUserById" }, "User ID is required")
      logError(error)
      return null
    }

    const userRef = doc(db, "users", userId)
    const [userDoc, error] = await tryCatch(() => getDoc(userRef), ErrorType.DB_READ_FAILED, {
      function: "getUserById",
      userId,
    })

    if (error || !userDoc) {
      return null
    }

    if (!userDoc.exists()) {
      const error = createError(
        ErrorType.DB_DOCUMENT_NOT_FOUND,
        null,
        { function: "getUserById", userId },
        "User not found",
      )
      logError(error)
      return null
    }

    return { id: userDoc.id, ...userDoc.data() }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getUserById", userId },
      "Unexpected error fetching user",
    )
    logError(appError)
    return null
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<any | null> {
  try {
    if (!email) {
      const error = createError(ErrorType.API_MISSING_PARAMS, null, { function: "getUserByEmail" }, "Email is required")
      logError(error)
      return null
    }

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email.toLowerCase()))
    const [querySnapshot, error] = await tryCatch(() => getDocs(q), ErrorType.DB_READ_FAILED, {
      function: "getUserByEmail",
      email,
    })

    if (error || !querySnapshot) {
      return null
    }

    if (querySnapshot.empty) {
      return null
    }

    const userDoc = querySnapshot.docs[0]
    return { id: userDoc.id, ...userDoc.data() }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "getUserByEmail", email },
      "Unexpected error fetching user by email",
    )
    logError(appError)
    return null
  }
}

// Create a new user with Firebase Auth + Firestore
export async function createUser(userData: {
  email: string
  password?: string
  name?: string
  firstName?: string
  lastName?: string
  role?: string // Optional - only set for trainers
  provider?: string
}): Promise<{ success: boolean; userId?: string; error?: any }> {
  try {
    if (!userData.email) {
      const error = createError(ErrorType.API_MISSING_PARAMS, null, { function: "createUser" }, "Email is required")
      logError(error)
      return { success: false, error }
    }

    // Check if user already exists in Firestore
    const existingUser = await getUserByEmail(userData.email)
    if (existingUser) {
      return { success: true, userId: existingUser.id }
    }

    let userId: string

    // If password is provided, create Firebase Auth user
    if (userData.password) {
      console.log(`[createUser] Creating Firebase Auth user for: ${userData.email}`)

      const [userCredential, authError] = await tryCatch(
        () => createUserWithEmailAndPassword(auth, userData.email, userData.password!),
        ErrorType.AUTH_FAILED,
        { function: "createUser", email: userData.email },
      )

      if (authError || !userCredential) {
        console.error(`[createUser] Firebase Auth creation failed:`, authError)
        return { success: false, error: authError }
      }

      userId = userCredential.user.uid
      console.log(`[createUser] Firebase Auth user created with UID: ${userId}`)
    } else {
      // Fallback: create Firestore-only user (for existing flow compatibility)
      console.log(`[createUser] Creating Firestore-only user for: ${userData.email}`)
      const usersRef = collection(db, "users")
      const [docRef, firestoreError] = await tryCatch(
        () => addDoc(usersRef, { email: userData.email.toLowerCase() }),
        ErrorType.DB_WRITE_FAILED,
        { function: "createUser", email: userData.email },
      )

      if (firestoreError || !docRef) {
        return { success: false, error: firestoreError }
      }

      userId = docRef.id
      console.log(`[createUser] Firestore-only user created with ID: ${userId}`)
    }

    // Create Firestore document with the userId (either Firebase Auth UID or auto-generated)
    const userDocData: any = {
      email: userData.email.toLowerCase(),
      name: userData.name || "",
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      provider: userData.provider || "email",
      hasFirebaseAuth: !!userData.password, // Track if user has Firebase Auth
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }

    // Only add role if it's provided (trainers only)
    if (userData.role) {
      userDocData.role = userData.role
    }

    const userRef = doc(db, "users", userId)
    const [, firestoreError] = await tryCatch(() => setDoc(userRef, userDocData), ErrorType.DB_WRITE_FAILED, {
      function: "createUser",
      userId,
      userData,
    })

    if (firestoreError) {
      console.error(`[createUser] Firestore document creation failed:`, firestoreError)
      return { success: false, error: firestoreError }
    }

    console.log(`[createUser] ✅ User created successfully: ${userId} with role: ${userData.role || "none"}`)

    // Set default subscription plan for trainers only
    if (userData.role === "trainer") {
      const { setDefaultSubscriptionPlan } = await import("./subscription-service")
      await setDefaultSubscriptionPlan(userId)
    }

    return { success: true, userId }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "createUser", userData },
      "Unexpected error creating user",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Update user data
export async function updateUser(userId: string, updates: any): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      const error = createError(ErrorType.API_MISSING_PARAMS, null, { function: "updateUser" }, "User ID is required")
      logError(error)
      return { success: false, error }
    }

    const userRef = doc(db, "users", userId)
    const [, error] = await tryCatch(
      () =>
        updateDoc(userRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "updateUser", userId, updates },
    )

    if (error) {
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "updateUser", userId, updates },
      "Unexpected error updating user",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Update user's last login time
export async function updateUserLastLogin(userId: string): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "updateUserLastLogin" },
        "User ID is required",
      )
      logError(error)
      return { success: false, error }
    }

    const userRef = doc(db, "users", userId)
    const [, error] = await tryCatch(
      () =>
        updateDoc(userRef, {
          lastLoginAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "updateUserLastLogin", userId },
    )

    if (error) {
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "updateUserLastLogin", userId },
      "Unexpected error updating user's last login",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Store the invitation code in the user document
export async function storeInvitationCode(
  userId: string,
  inviteCode: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!userId || !inviteCode) {
      console.error("[storeInvitationCode] User ID and invitation code are required")
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "storeInvitationCode", userId, inviteCode },
        "User ID and invitation code are required",
      )
      logError(error)
      return { success: false, error }
    }

    console.log(`[storeInvitationCode] Storing invitation code ${inviteCode} for user ${userId}`)

    const userRef = doc(db, "users", userId)
    const [, updateError] = await tryCatch(
      () =>
        updateDoc(userRef, {
          inviteCode: inviteCode,
          inviteCodeStoredAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "storeInvitationCode", userId, inviteCode },
    )

    if (updateError) {
      console.error(`[storeInvitationCode] ❌ Failed to store invitation code:`, updateError)
      return { success: false, error: updateError }
    }

    console.log(`[storeInvitationCode] ✅ Successfully stored invitation code ${inviteCode} for user ${userId}`)
    return { success: true }
  } catch (error) {
    console.error("[storeInvitationCode] ❌ Unexpected error:", error)
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "storeInvitationCode", userId, inviteCode },
      "Unexpected error storing invitation code",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Generate universal invite code for trainer
export async function generateUniversalInviteCode(
  trainerId: string,
): Promise<{ success: boolean; inviteCode?: string; error?: any }> {
  try {
    if (!trainerId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "generateUniversalInviteCode" },
        "Trainer ID is required",
      )
      logError(error)
      return { success: false, error }
    }

    // Generate a simple 8-character code
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()

    const trainerRef = doc(db, "users", trainerId)
    const [, error] = await tryCatch(
      () =>
        updateDoc(trainerRef, {
          universalInviteCode: inviteCode,
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "generateUniversalInviteCode", trainerId },
    )

    if (error) {
      return { success: false, error }
    }

    return { success: true, inviteCode }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "generateUniversalInviteCode", trainerId },
      "Unexpected error generating universal invite code",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Sign up with universal invite code (always creates user with no role)
export async function signupWithUniversalCode(userData: {
  email: string
  name?: string
  firstName?: string
  lastName?: string
  password?: string
  universalInviteCode: string
}): Promise<{ success: boolean; userId?: string; trainerId?: string; error?: any }> {
  try {
    if (!userData.email || !userData.universalInviteCode) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "signupWithUniversalCode" },
        "Email and invite code are required",
      )
      logError(error)
      return { success: false, error }
    }

    // Find trainer with this universal invite code
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("universalInviteCode", "==", userData.universalInviteCode))
    const [querySnapshot, queryError] = await tryCatch(() => getDocs(q), ErrorType.DB_READ_FAILED, {
      function: "signupWithUniversalCode",
      inviteCode: userData.universalInviteCode,
    })

    if (queryError || !querySnapshot) {
      return { success: false, error: queryError }
    }

    if (querySnapshot.empty) {
      const error = createError(
        ErrorType.DB_DOCUMENT_NOT_FOUND,
        null,
        { function: "signupWithUniversalCode", inviteCode: userData.universalInviteCode },
        "Invalid invite code",
      )
      logError(error)
      return { success: false, error }
    }

    const trainerDoc = querySnapshot.docs[0]
    const trainerId = trainerDoc.id

    // Create user account with NO ROLE (invite signups are always users, not trainers)
    const {
      success,
      userId,
      error: createError,
    } = await createUser({
      ...userData,
      password: userData.password,
      // No role assigned for invite signups
      provider: "email",
    })

    if (!success || !userId) {
      return { success: false, error: createError }
    }

    // Update user with pending approval status
    const userRef = doc(db, "users", userId)
    const [, updateError] = await tryCatch(
      () =>
        updateDoc(userRef, {
          status: "pending_approval",
          invitedBy: trainerId,
          universalInviteCode: userData.universalInviteCode,
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "signupWithUniversalCode", userId, trainerId },
    )

    if (updateError) {
      return { success: false, error: updateError }
    }

    // Add user to trainer's pending users list
    const trainerRef = doc(db, "users", trainerId)
    console.log(`[signupWithUniversalCode] Adding user ${userId} to trainer ${trainerId} pending list`)

    const [, addToPendingError] = await tryCatch(
      () =>
        updateDoc(trainerRef, {
          pendingUsers: arrayUnion(userId),
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "signupWithUniversalCode", trainerId, userId },
    )

    if (addToPendingError) {
      console.error(`[signupWithUniversalCode] Failed to add user to pending list:`, addToPendingError)
      return { success: false, error: addToPendingError }
    }

    console.log(`[signupWithUniversalCode] Successfully added user ${userId} to trainer ${trainerId} pending list`)

    return { success: true, userId, trainerId }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "signupWithUniversalCode", userData },
      "Unexpected error during signup with universal code",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Get pending users for a trainer
export async function getPendingUsers(trainerId: string): Promise<any[]> {
  try {
    if (!trainerId) {
      console.error("Trainer ID is required")
      return []
    }

    // Get trainer document to get pending users list
    const trainerRef = doc(db, "users", trainerId)
    const [trainerDoc, trainerError] = await tryCatch(() => getDoc(trainerRef), ErrorType.DB_READ_FAILED, {
      function: "getPendingUsers",
      trainerId,
    })

    if (trainerError || !trainerDoc || !trainerDoc.exists()) {
      return []
    }

    const trainerData = trainerDoc.data()
    const pendingUserIds = trainerData.pendingUsers || []

    if (pendingUserIds.length === 0) {
      return []
    }

    // Get details for each pending user
    const pendingUsers = []
    for (const userId of pendingUserIds) {
      const userData = await getUserById(userId)
      if (userData && userData.status === "pending_approval") {
        pendingUsers.push({
          id: userId,
          name: userData.name || userData.firstName || "Unknown User",
          email: userData.email || "",
          createdAt: userData.createdAt,
          status: userData.status,
        })
      }
    }

    return pendingUsers
  } catch (error) {
    console.error("Error getting pending users:", error)
    return []
  }
}

// Approve or reject a pending user
export async function approveUser(
  trainerId: string,
  userId: string,
  action: "approve" | "reject",
  matchToClientId?: string,
  createNew?: boolean,
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!trainerId || !userId || !action) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "approveUser" },
        "Trainer ID, user ID, and action are required",
      )
      logError(error)
      return { success: false, error }
    }

    const userRef = doc(db, "users", userId)
    const trainerRef = doc(db, "users", trainerId)

    if (action === "approve") {
      // Update user status to approved
      const [, updateUserError] = await tryCatch(
        () =>
          updateDoc(userRef, {
            status: "approved",
            approvedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
        ErrorType.DB_WRITE_FAILED,
        { function: "approveUser", userId, action },
      )

      if (updateUserError) {
        return { success: false, error: updateUserError }
      }

      // Add trainer to user's trainers list
      const [, addTrainerError] = await tryCatch(
        () =>
          updateDoc(userRef, {
            trainers: arrayUnion(trainerId),
          }),
        ErrorType.DB_WRITE_FAILED,
        { function: "approveUser", userId, trainerId },
      )

      if (addTrainerError) {
        return { success: false, error: addTrainerError }
      }

      // Handle client matching or creation
      if (createNew) {
        // Create new client document
        const userData = await getUserById(userId)
        if (userData) {
          const { createClient } = await import("./client-service")
          const result = await createClient(trainerId, {
            name: userData.name || userData.firstName || "New Client",
            email: userData.email || "",
            phone: "",
            goal: "",
            notes: `Created from user signup: ${userData.email}`,
            program: "",
          })

          if (result.success && result.clientId) {
            // Link the new client to the user
            const clientRef = doc(db, "users", trainerId, "clients", result.clientId)
            await updateDoc(clientRef, {
              userId: userId,
              status: "Active",
              isTemporary: false,
              updatedAt: serverTimestamp(),
            })
          }
        }
      } else if (matchToClientId) {
        // Match to existing client
        const clientRef = doc(db, "users", trainerId, "clients", matchToClientId)
        const [, updateClientError] = await tryCatch(
          () =>
            updateDoc(clientRef, {
              userId: userId,
              status: "Active",
              isTemporary: false,
              updatedAt: serverTimestamp(),
            }),
          ErrorType.DB_WRITE_FAILED,
          { function: "approveUser", trainerId, matchToClientId, userId },
        )

        if (updateClientError) {
          return { success: false, error: updateClientError }
        }
      }
    } else {
      // Reject user
      const [, updateUserError] = await tryCatch(
        () =>
          updateDoc(userRef, {
            status: "rejected",
            rejectedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
        ErrorType.DB_WRITE_FAILED,
        { function: "approveUser", userId, action },
      )

      if (updateUserError) {
        return { success: false, error: updateUserError }
      }
    }

    // Remove user from trainer's pending list
    const [, removePendingError] = await tryCatch(
      () =>
        updateDoc(trainerRef, {
          pendingUsers: arrayRemove(userId),
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "approveUser", trainerId, userId },
    )

    if (removePendingError) {
      return { success: false, error: removePendingError }
    }

    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "approveUser", trainerId, userId, action },
      "Unexpected error approving/rejecting user",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

// Update universal invite code for trainer
export async function updateUniversalInviteCode(
  trainerId: string,
  newCode: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!trainerId) {
      const error = createError(
        ErrorType.API_MISSING_PARAMS,
        null,
        { function: "updateUniversalInviteCode" },
        "Trainer ID is required",
      )
      logError(error)
      return { success: false, error }
    }

    // Allow empty string to clear the invite code
    if (newCode === "") {
      const trainerRef = doc(db, "users", trainerId)
      const [, error] = await tryCatch(
        () =>
          updateDoc(trainerRef, {
            universalInviteCode: "",
            updatedAt: serverTimestamp(),
          }),
        ErrorType.DB_WRITE_FAILED,
        { function: "updateUniversalInviteCode", trainerId, code: "CLEARED" },
      )

      if (error) {
        return { success: false, error }
      }

      return { success: true }
    }

    // Updated regex to allow dashes
    const codeRegex = /^[A-Za-z0-9-]{1,20}$/
    if (!codeRegex.test(newCode)) {
      const error = createError(
        ErrorType.API_VALIDATION_FAILED,
        null,
        { function: "updateUniversalInviteCode", code: newCode },
        "Invite code must be 1-20 characters, letters, numbers, and dashes only",
      )
      logError(error)
      return { success: false, error }
    }

    // Check if code is already taken by another trainer
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("universalInviteCode", "==", newCode.toUpperCase()))
    const [querySnapshot, queryError] = await tryCatch(() => getDocs(q), ErrorType.DB_READ_FAILED, {
      function: "updateUniversalInviteCode",
      code: newCode,
    })

    if (queryError) {
      return { success: false, error: queryError }
    }

    // If code exists and it's not this trainer, it's taken
    if (!querySnapshot.empty) {
      const existingDoc = querySnapshot.docs[0]
      if (existingDoc.id !== trainerId) {
        const error = createError(
          ErrorType.API_VALIDATION_FAILED,
          null,
          { function: "updateUniversalInviteCode", code: newCode },
          "This invite code is already taken",
        )
        logError(error)
        return { success: false, error }
      }
    }

    const trainerRef = doc(db, "users", trainerId)
    const [, error] = await tryCatch(
      () =>
        updateDoc(trainerRef, {
          universalInviteCode: newCode.toUpperCase(),
          updatedAt: serverTimestamp(),
        }),
      ErrorType.DB_WRITE_FAILED,
      { function: "updateUniversalInviteCode", trainerId, code: newCode },
    )

    if (error) {
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    const appError = createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      { function: "updateUniversalInviteCode", trainerId, code: newCode },
      "Unexpected error updating universal invite code",
    )
    logError(appError)
    return { success: false, error: appError }
  }
}

export const getUserData = async (uid: string) => {
  try {
    const userDocRef = doc(db, "users", uid)
    const docSnap = await getDoc(userDocRef)

    if (docSnap.exists()) {
      return docSnap.data()
    } else {
      console.log("No such document!")
      return null
    }
  } catch (error: any) {
    console.error("Error getting user data:", error)
    throw error
  }
}

// Get current authenticated user
export async function getCurrentUser(): Promise<any | null> {
  try {
    const { auth } = await import("./firebase")
    const { onAuthStateChanged } = await import("firebase/auth")

    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe()
        resolve(user)
      })
    })
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
