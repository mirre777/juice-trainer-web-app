import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("[API:me] 🔄 Starting user data retrieval")

    const cookieStore = cookies()
    const userIdCookie = cookieStore.get("user_id")

    if (!userIdCookie?.value) {
      console.log("[API:me] ❌ No user_id cookie found")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = userIdCookie.value
    console.log(`[API:me] 🔍 Looking up user: ${userId}`)

    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      console.log(`[API:me] ❌ User document not found for ID: ${userId}`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    console.log(`[API:me] 📊 Raw Firestore data:`, {
      email: userData.email,
      role: userData.role,
      user_type: userData.user_type,
      roleType: typeof userData.role,
      hasRole: !!userData.role,
      allKeys: Object.keys(userData),
    })

    const user = {
      uid: userDoc.id,
      email: userData.email || "",
      name: userData.name || userData.displayName || "",
      role: userData.role || "user",
      user_type: userData.user_type,
      profilePicture: userData.profilePicture || "",
      isApproved: userData.isApproved || false,
      subscriptionStatus: userData.subscriptionStatus || "",
      universalInviteCode: userData.universalInviteCode || "",
    }

    console.log(`[API:me] ✅ Processed user data:`, {
      uid: user.uid,
      email: user.email,
      role: user.role,
      roleType: typeof user.role,
    })

    // Return user data at the top level (not nested under 'user')
    return NextResponse.json(user)
  } catch (error: any) {
    console.error("[API:me] ❌ Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
