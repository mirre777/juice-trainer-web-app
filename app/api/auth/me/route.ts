export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    console.log("🚀 Starting /api/auth/me request")

    const cookieStore = await cookies()

    // Check for ALL possible cookie names your app might use
    const authToken =
      cookieStore.get("auth-token")?.value ||
      cookieStore.get("auth_token")?.value ||
      cookieStore.get("session_token")?.value
    const userId = cookieStore.get("user_id")?.value

    console.log("🍪 Cookie check results:", {
      "auth-token": cookieStore.get("auth-token")?.value ? "Present" : "Missing",
      auth_token: cookieStore.get("auth_token")?.value ? "Present" : "Missing",
      session_token: cookieStore.get("session_token")?.value ? "Present" : "Missing",
      user_id: cookieStore.get("user_id")?.value ? "Present" : "Missing",
    })

    // If we have an auth token, try to decode it
    if (authToken) {
      try {
        console.log("🔓 Attempting to verify auth token...")
        const { verifyToken } = await import("@/lib/auth/token-service")
        const decoded = await verifyToken(authToken)
        console.log("✅ Token decoded successfully:", { uid: decoded.uid, email: decoded.email })

        return NextResponse.json({
          uid: decoded.uid,
          email: decoded.email,
          role: decoded.role || "user",
          name: decoded.name || "",
        })
      } catch (tokenError) {
        console.error("❌ Token verification failed:", tokenError)
        // Don't return error immediately, try user_id cookie as fallback
      }
    }

    // Fallback: If we have a user_id cookie, use that with Firestore
    if (userId) {
      try {
        console.log("🔍 Using user_id cookie, fetching from Firestore...")
        const { db } = await import("@/lib/firebase/firebase")

        if (!db) {
          console.error("❌ Firestore not available")
          return NextResponse.json({ error: "Database not available" }, { status: 500 })
        }

        const { collection, doc, getDoc } = await import("firebase/firestore")
        const userDocRef = doc(collection(db, "users"), userId)
        const userDoc = await getDoc(userDocRef)

        if (!userDoc.exists()) {
          console.log("❌ User document not found for ID:", userId)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const userData = userDoc.data()
        console.log("✅ User data retrieved from Firestore")

        const response = {
          uid: userId,
          email: userData?.email || "",
          name: userData?.name || "",
          role: userData?.role || "user",
          user_type: userData?.user_type || "",
          universalInviteCode: userData?.universalInviteCode || "",
          inviteCode: userData?.inviteCode || "",
        }

        console.log("📤 Sending successful response:", response)
        return NextResponse.json(response)
      } catch (firestoreError: any) {
        console.error("💥 Firestore error:", firestoreError)
        return NextResponse.json(
          {
            error: "Database error",
            details: firestoreError?.message || "Database connection failed",
          },
          { status: 500 },
        )
      }
    }

    // No authentication found at all
    console.log("❌ No authentication cookies found - user needs to log in")
    return NextResponse.json(
      {
        error: "Not authenticated",
        debug: "No auth-token, auth_token, session_token, or user_id cookies found",
      },
      { status: 401 },
    )
  } catch (error: any) {
    console.error("💥 Unexpected error in /api/auth/me:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
