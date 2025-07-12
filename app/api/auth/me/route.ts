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
    console.log(`[API:me] ✅ User found: ${userData.email}`)

    const user = {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      user_type: userData.user_type,
      status: userData.status,
      hasFirebaseAuth: userData.hasFirebaseAuth,
      createdAt: userData.createdAt?.toDate?.()?.toISOString(),
      updatedAt: userData.updatedAt?.toDate?.()?.toISOString(),
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.log("[API:me] ❌ Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
