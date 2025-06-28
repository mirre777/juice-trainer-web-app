import { type NextRequest, NextResponse } from "next/server"
import { getFirebaseAdminAuth, initializeFirebaseAdmin, getFirebaseAdminFirestore } from "@/lib/firebase/firebase-admin"
import { cookies } from "next/headers"

// Initialize Firebase Admin SDK if not already done
initializeFirebaseAdmin()

export async function GET(request: NextRequest) {
  try {
    // Fix: Use 'auth_token' instead of 'session' to match your auth system
    const authToken = cookies().get("auth_token")?.value

    if (!authToken) {
      return NextResponse.json({ error: "No authentication token found" }, { status: 401 })
    }

    // Verify the token using Firebase Admin
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(authToken)
    const uid = decodedToken.uid

    // Get user data from Firestore
    const adminDb = getFirebaseAdminFirestore()
    const userDoc = await adminDb.collection("users").doc(uid).get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()

    return NextResponse.json({
      uid: uid,
      email: decodedToken.email,
      role: userData?.role || "client",
      ...userData,
    })
  } catch (error: any) {
    console.error("Error verifying token:", error)

    if (error.code === "auth/id-token-expired") {
      return NextResponse.json({ error: "Token expired" }, { status: 401 })
    }

    if (error.code === "auth/argument-error") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }
}
