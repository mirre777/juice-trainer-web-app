export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getUserIdFromCookie } from "@/lib/utils/user"
import { db } from "@/lib/firebase/firebase"
import { collection, doc, getDoc } from "firebase/firestore"
import { SubscriptionPlan } from "@/lib/firebase/subscription-service"

export async function GET() {
  try {
    console.log("🚀 Starting /api/auth/me request")

    const userId = await getUserIdFromCookie()
    console.log("🆔 User ID from cookie:", userId)

    if (!userId) {
      console.log("❌ No user_id in cookies")
      // redirect to login
      return NextResponse.redirect(new URL("/login", window.location.origin))
    }

    try {
      // Import Firestore directly instead of through db wrapper
      console.log("📊 Firestore imported successfully")

      if (!db) {
        console.error("❌ Firestore not available")
        return NextResponse.json({ error: "Database not available" }, { status: 500 })
      }

      console.log("🔍 Querying Firestore for user:", userId)

      // Import collection and doc from firebase/firestore
      const userDocRef = doc(collection(db, "users"), userId)
      const userDoc = await getDoc(userDocRef)

      console.log("✅ Document query completed, exists:", userDoc.exists())

      if (!userDoc.exists()) {
        console.log("❌ User document not found for ID:", userId)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const userData = userDoc.data()
      console.log("✅ User data extracted:", userDoc.id, userData.name, userData.role)

      // Determine user role with fallback logic
      let role = userData?.role ?? "client"

      const response = {
        uid: userId,
        email: userData?.email || "",
        name: userData?.name || "",
        role: role, // Always include the determined role
        // Only include user_type if it exists in the document
        ...(userData?.user_type && { user_type: userData.user_type }),
        universalInviteCode: userData?.universalInviteCode || "",
        // Add the inviteCode field that gets stored during login
        inviteCode: userData?.inviteCode || "",
        // Add subscription plan with default to "trainer_basic"
        subscriptionPlan: userData?.subscriptionPlan || SubscriptionPlan.TrainerBasic,
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
