import { NextResponse } from "next/server"
import { getFirebaseAdminAuth, initializeFirebaseAdmin } from "@/lib/firebase/firebase-admin"
import { cookies } from "next/headers"

// Initialize Firebase Admin
initializeFirebaseAdmin()

export async function GET() {
  try {
    const sessionCookie = cookies().get("session")?.value
    const authToken = cookies().get("auth_token")?.value

    if (!sessionCookie && !authToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    let decodedToken

    try {
      if (sessionCookie) {
        decodedToken = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true)
      } else if (authToken) {
        decodedToken = await getFirebaseAdminAuth().verifyIdToken(authToken)
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || "client",
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Authentication check failed" }, { status: 500 })
  }
}
