export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    console.log("🚀 Starting /api/auth/me request")

    const cookieStore = await cookies()

    // Check for different possible cookie names
    const authToken =
      cookieStore.get("auth-token")?.value ||
      cookieStore.get("auth_token")?.value ||
      cookieStore.get("session_token")?.value
    const userId = cookieStore.get("user_id")?.value

    console.log("🍪 Cookies found:", {
      "auth-token": cookieStore.get("auth-token")?.value ? "Present" : "Missing",
      auth_token: cookieStore.get("auth_token")?.value ? "Present" : "Missing",
      session_token: cookieStore.get("session_token")?.value ? "Present" : "Missing",
      user_id: userId || "Missing",
    })

    // If we have an auth token, try to decode it
    if (authToken) {
      try {
        console.log("🔓 Attempting to verify auth token...")
        const { verifyToken } = await import("@/lib/auth/token-service")
        const decoded = await verifyToken(authToken)
        console.log("✅ Token decoded successfully:", {
          uid: decoded.uid,
          email: decoded.email,
          tokenRole: decoded.role,
        })

        // ALWAYS get fresh user data from Firestore to ensure we have the latest role
        try {
          console.log("🔍 Fetching fresh user data from Firestore for UID:", decoded.uid)
          const { db } = await import("@/lib/firebase/firebase")
          const { collection, doc, getDoc } = await import("firebase/firestore")

          const userDocRef = doc(collection(db, "users"), decoded.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const freshUserData = userDoc.data()
            console.log("✅ Fresh user data from Firestore:", {
              uid: decoded.uid,
              email: freshUserData.email,
              firestoreRole: freshUserData.role,
              user_type: freshUserData.user_type,
            })

            const finalRole = freshUserData.role || decoded.role || "user"
            console.log("🎭 Final role determined:", finalRole)

            return NextResponse.json({
              uid: decoded.uid,
              email: decoded.email,
              role: finalRole,
              user_type: freshUserData.user_type,
              name: freshUserData.name || "",
              universalInviteCode: freshUserData.universalInviteCode || "",
              inviteCode: freshUserData.inviteCode || "",
            })
          } else {
            console.log("⚠️ User document not found in Firestore, using token data")
            return NextResponse.json({
              uid: decoded.uid,
              email: decoded.email,
              role: decoded.role || "user",
              name: decoded.name || "",
            })
          }
        } catch (firestoreError) {
          console.error("⚠️ Firestore lookup failed, using token data:", firestoreError)
          return NextResponse.json({
            uid: decoded.uid,
            email: decoded.email,
            role: decoded.role || "user",
            name: decoded.name || "",
          })
        }
      } catch (tokenError) {
        console.error("❌ Token verification failed:", tokenError)
        // Continue to user_id fallback
      }
    }

    // Fallback: If we have a user_id cookie, use that
    if (userId) {
      try {
        console.log("🔍 Using user_id cookie, fetching from Firestore...")
        const { db } = await import("@/lib/firebase/firebase")

        if (!db) {
          console.error("❌ Firestore not available")
          return NextResponse.json({ error: "Database not available" }, { status: 500 })
        }

        console.log("🔍 Querying Firestore for user:", userId)

        const { collection, doc, getDoc } = await import("firebase/firestore")
        const userDocRef = doc(collection(db, "users"), userId)
        const userDoc = await getDoc(userDocRef)

        console.log("✅ Document query completed, exists:", userDoc.exists())

        if (!userDoc.exists()) {
          console.log("❌ User document not found for ID:", userId)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const userData = userDoc.data()
        console.log("✅ User data extracted from Firestore:", {
          uid: userId,
          email: userData?.email,
          role: userData?.role,
          user_type: userData?.user_type,
        })

        const response = {
          uid: userId,
          email: userData?.email || "",
          name: userData?.name || "",
          role: userData?.role || "user", // This should now get the correct role from Firestore
          user_type: userData?.user_type || "",
          universalInviteCode: userData?.universalInviteCode || "",
          inviteCode: userData?.inviteCode || "",
        }

        console.log("📤 Sending successful response with role:", response.role)
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

    // No authentication found
    console.log("❌ No authentication cookies found")
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  } catch (error: any) {
    console.error("💥 Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
