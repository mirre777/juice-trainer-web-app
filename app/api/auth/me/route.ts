export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    console.log("🚀 Starting /api/auth/me request")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 User ID from cookie:", userId)

    if (!userId) {
      console.log("❌ No user_id in cookies")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    try {
      // Import Firestore directly instead of through db wrapper
      const { db } = await import("@/lib/firebase/firebase")
      console.log("📊 Firestore imported successfully")

      if (!db) {
        console.error("❌ Firestore not available")
        return NextResponse.json({ error: "Database not available" }, { status: 500 })
      }

      console.log("🔍 Querying Firestore for user:", userId)

      // Import collection and doc from firebase/firestore
      const { collection, doc, getDoc } = await import("firebase/firestore")
      const userDocRef = doc(collection(db, "users"), userId)
      const userDoc = await getDoc(userDocRef)

      console.log("✅ Document query completed, exists:", userDoc.exists())

      if (!userDoc.exists()) {
        console.log("❌ User document not found for ID:", userId)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const userData = userDoc.data()
      console.log("✅ User data extracted:", userData)

      const response = {
        uid: userId,
        email: userData?.email || "",
        name: userData?.name || "",
        // Only include role if it exists in the document
        ...(userData?.role && { role: userData.role }),
        // Only include user_type if it exists in the document
        ...(userData?.user_type && { user_type: userData.user_type }),
        universalInviteCode: userData?.universalInviteCode || "",
        // Add the inviteCode field that gets stored during login
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
