import { NextResponse } from "next/server"
import { getUserByEmail, updateUser } from "@/lib/firebase/user-service"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log(`[Admin] Linking accounts for: ${email}`)

    // Get user from Firestore
    const firestoreUser = await getUserByEmail(email)
    if (!firestoreUser) {
      return NextResponse.json({ error: "User not found in Firestore" }, { status: 404 })
    }

    // Check if already linked
    if (firestoreUser.hasFirebaseAuth) {
      return NextResponse.json({
        message: "Account already linked",
        firestoreId: firestoreUser.id,
        firebaseUid: firestoreUser.firebaseUid,
      })
    }

    try {
      // Get Firebase Auth user by email
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

      const authUser = await getAuth().getUserByEmail(email)

      console.log(`[Admin] Found Firebase Auth user: ${authUser.uid}`)

      // Link the accounts
      const updateResult = await updateUser(firestoreUser.id, {
        hasFirebaseAuth: true,
        firebaseUid: authUser.uid,
        linkedAt: new Date().toISOString(),
        linkedBy: "admin",
      })

      if (!updateResult.success) {
        return NextResponse.json({ error: "Failed to update Firestore user" }, { status: 500 })
      }

      console.log(`[Admin] ✅ Successfully linked accounts for ${email}`)

      return NextResponse.json({
        success: true,
        message: "Accounts linked successfully",
        firestoreId: firestoreUser.id,
        firebaseUid: authUser.uid,
        email: email,
      })
    } catch (authError: any) {
      if (authError.code === "auth/user-not-found") {
        return NextResponse.json(
          {
            error: "User not found in Firebase Auth. Create Firebase Auth account first.",
          },
          { status: 404 },
        )
      }

      console.error("[Admin] Firebase Auth error:", authError)
      return NextResponse.json({ error: "Failed to get Firebase Auth user" }, { status: 500 })
    }
  } catch (error) {
    console.error("[Admin] Unexpected error:", error)
    return NextResponse.json({ error: "Failed to link accounts" }, { status: 500 })
  }
}
