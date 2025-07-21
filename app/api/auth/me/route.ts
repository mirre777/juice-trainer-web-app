import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET(request: NextRequest) {
  try {
    console.log("[API:me] 🔄 Starting user data retrieval")

    const cookieStore = cookies()
    const userIdCookie = cookieStore.get("user_id")

    if (!userIdCookie?.value) {
      console.log("[API:me] ❌ No user_id cookie found")
      return NextResponse.json({ error: "No authentication found" }, { status: 401 })
    }

    const userId = userIdCookie.value
    console.log("[API:me] ✅ Found user_id cookie:", userId)

    try {
      console.log("[API:me] 🔄 Fetching user data from Firestore...")

      const userDocRef = doc(db, "users", userId)
      const userDoc = await getDoc(userDocRef)

      if (!userDoc.exists()) {
        console.log("[API:me] ❌ No user document found for ID:", userId)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const userData = userDoc.data()
      console.log("[API:me] ✅ Successfully retrieved user data")
      console.log("[API:me] 👤 User role:", userData.role || "Not set")

      return NextResponse.json({
        uid: userData.uid || userId,
        email: userData.email || "",
        role: userData.role || "user",
        name: userData.name || userData.displayName || "",
        profilePicture: userData.profilePicture || "",
        isApproved: userData.isApproved || false,
        subscriptionStatus: userData.subscriptionStatus || "",
        universalInviteCode: userData.universalInviteCode || "",
      })
    } catch (firestoreError) {
      console.error("[API:me] ❌ Firestore error:", firestoreError)
      return NextResponse.json(
        {
          error: "Database error",
          details: firestoreError instanceof Error ? firestoreError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[API:me] ❌ Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
