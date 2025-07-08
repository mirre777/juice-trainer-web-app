import { NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET() {
  try {
    console.log("[DEBUG] Testing Firebase connection...")

    const userId = "HN2QjNvnWKQ37nVXCSkhXdCwMEH2"
    console.log("[DEBUG] Testing user ID:", userId)

    const userRef = doc(db, "users", userId)
    console.log("[DEBUG] Document path:", userRef.path)

    const userDoc = await getDoc(userRef)
    console.log("[DEBUG] Document fetch completed")

    if (userDoc.exists()) {
      const userData = userDoc.data()
      console.log("[DEBUG] ✅ User document found!")

      return NextResponse.json({
        success: true,
        message: "User document found",
        userId,
        userData: {
          name: userData.name,
          status: userData.status,
          trainers: userData.trainers,
          email: userData.email,
          createdAt: userData.createdAt,
          linkedAt: userData.linkedAt,
        },
        documentPath: userRef.path,
      })
    } else {
      console.log("[DEBUG] ❌ User document not found")

      return NextResponse.json(
        {
          success: false,
          message: "User document not found",
          userId,
          documentPath: userRef.path,
          possibleCauses: [
            "Document doesn't exist",
            "Permission denied",
            "Wrong project/database",
            "Firestore rules blocking access",
          ],
        },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error("[DEBUG] Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
