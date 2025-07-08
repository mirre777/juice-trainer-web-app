export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    console.log("🚀 Starting /api/auth/me request")

    const cookieStore = await cookies()

    // Check for different possible cookie names
    const authToken = cookieStore.get("auth-token")?.value || cookieStore.get("auth_token")?.value
    const userId = cookieStore.get("user_id")?.value

    console.log("🍪 Cookies found:", {
      authToken: authToken ? "Present" : "Missing",
      userId: userId ? "Present" : "Missing",
    })

    // If we have an auth token, try to decode it
    if (authToken) {
      try {
        const { verifyToken } = await import("@/lib/auth/token-service")
        const decoded = await verifyToken(authToken)
        console.log("🔓 Token decoded successfully:", { uid: decoded.uid, email: decoded.email })

        return NextResponse.json({
          uid: decoded.uid,
          email: decoded.email,
          role: decoded.role || "user",
        })
      } catch (tokenError) {
        console.error("❌ Token verification failed:", tokenError)
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
    }

    // If we have a user_id cookie, use that
    if (userId) {
      try {
        const { db } = await import("@/lib/firebase/firebase")
        const { collection, doc, getDoc } = await import("firebase/firestore")

        const userDocRef = doc(collection(db, "users"), userId)
        const userDoc = await getDoc(userDocRef)

        if (!userDoc.exists()) {
          console.log("❌ User document not found for ID:", userId)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const userData = userDoc.data()
        console.log("✅ User data retrieved from Firestore")

        return NextResponse.json({
          uid: userId,
          email: userData?.email || "",
          name: userData?.name || "",
          role: userData?.role || "user",
          user_type: userData?.user_type || "",
          universalInviteCode: userData?.universalInviteCode || "",
          inviteCode: userData?.inviteCode || "",
        })
      } catch (firestoreError: any) {
        console.error("💥 Firestore error:", firestoreError)
        return NextResponse.json({ error: "Database error", details: firestoreError?.message }, { status: 500 })
      }
    }

    // No authentication found
    console.log("❌ No authentication cookies found")
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  } catch (error: any) {
    console.error("💥 Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error", details: error?.message }, { status: 500 })
  }
}
