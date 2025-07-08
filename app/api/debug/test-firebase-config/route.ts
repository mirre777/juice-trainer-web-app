import { NextResponse } from "next/server"
import { db } from "@/lib/firebase/firebase"
import { collection, getDocs, limit, query } from "firebase/firestore"

export async function GET() {
  try {
    console.log("[DEBUG] Testing Firebase configuration...")

    // Test basic connection
    const usersRef = collection(db, "users")
    const q = query(usersRef, limit(1))
    const snapshot = await getDocs(q)

    console.log("[DEBUG] Firebase connection successful")
    console.log("[DEBUG] Users collection accessible:", !snapshot.empty)

    return NextResponse.json({
      success: true,
      message: "Firebase connection successful",
      hasUsers: !snapshot.empty,
      userCount: snapshot.size,
    })
  } catch (error: any) {
    console.error("[DEBUG] Firebase connection failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: 500 },
    )
  }
}
