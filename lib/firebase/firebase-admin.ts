// lib/firebase/firebase-admin.ts
import * as admin from "firebase-admin"

let initialized = false

export function initializeFirebaseAdmin() {
  if (!initialized) {
    try {
      // Ensure private key is correctly formatted (replace \\n with \n)
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
      if (!privateKey) {
        throw new Error("FIREBASE_PRIVATE_KEY environment variable is not set or is invalid.")
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      })
      initialized = true
      console.log("Firebase Admin SDK initialized successfully.")
    } catch (error) {
      console.error("Failed to initialize Firebase Admin SDK:", error)
      throw new Error(
        `Firebase Admin SDK initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
}

export const getFirebaseAdminFirestore = () => {
  if (!initialized) {
    initializeFirebaseAdmin()
  }
  return admin.firestore()
}

export const getFirebaseAdminAuth = () => {
  if (!initialized) {
    initializeFirebaseAdmin()
  }
  return admin.auth()
}
