import { NextResponse } from "next/server"
import { db } from "@/lib/firebase/firebase"
import { collection, getDocs, limit, query } from "firebase/firestore"

export async function GET() {
  try {
    console.log("🔄 Testing Firebase configuration...")

    // Test basic connection
    const usersRef = collection(db, "users")
    const testQuery = query(usersRef, limit(1))
    const snapshot = await getDocs(testQuery)

    console.log("✅ Firebase connection successful")
    console.log(`📊 Found ${snapshot.size} user(s) in test query`)

    return NextResponse.json({
      success: true,
      message: "Firebase connection successful",
      userCount: snapshot.size,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ Firebase connection failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
