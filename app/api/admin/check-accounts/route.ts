import { NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/firebase/user-service"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check Firestore
    const firestoreUser = await getUserByEmail(email)

    // Check Firebase Auth
    let firebaseAuthUser = null
    try {
      const admin = await import("firebase-admin/app")
      const { getAuth } = await import("firebase-admin/auth")

      // Initialize Firebase Admin if not already done
      if (!admin.getApps().length) {
        const { initializeApp, cert } = await import("firebase-admin/app")
        initializeApp({
          credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          }),
        })
      }

      firebaseAuthUser = await getAuth().getUserByEmail(email)
    } catch (authError: any) {
      if (authError.code !== "auth/user-not-found") {
        console.error("Firebase Auth error:", authError)
      }
    }

    return NextResponse.json({
      email,
      firestore: {
        exists: !!firestoreUser,
        id: firestoreUser?.id,
        hasFirebaseAuth: firestoreUser?.hasFirebaseAuth,
        firebaseUid: firestoreUser?.firebaseUid,
      },
      firebaseAuth: {
        exists: !!firebaseAuthUser,
        uid: firebaseAuthUser?.uid,
        email: firebaseAuthUser?.email,
      },
      linked: !!(firestoreUser?.hasFirebaseAuth && firestoreUser?.firebaseUid && firebaseAuthUser),
      needsLinking: !!(firestoreUser && firebaseAuthUser && !firestoreUser.hasFirebaseAuth),
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Failed to check accounts" }, { status: 500 })
  }
}
