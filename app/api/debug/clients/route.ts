export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    console.log("🔍 [DEBUG] Starting debug clients endpoint")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 [DEBUG] User ID from cookie:", userId)

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Import Firebase functions
    const { db } = await import("@/lib/firebase/firebase")
    const { collection, getDocs } = await import("firebase/firestore")

    console.log("📊 [DEBUG] Checking Firestore collection...")

    // Check the collection directly
    const clientsRef = collection(db, "users", userId, "clients")
    const snapshot = await getDocs(clientsRef)

    console.log(`📈 [DEBUG] Found ${snapshot.size} documents in collection`)

    const rawClients: any[] = []
    const validClients: any[] = []
    const invalidClients: any[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      const clientInfo = {
        id: doc.id,
        name: data.name,
        email: data.email,
        status: data.status,
        hasName: !!data.name,
        hasEmail: !!data.email,
        nameType: typeof data.name,
        emailType: typeof data.email,
        rawData: data,
      }

      rawClients.push(clientInfo)

      // Check validation
      if (
        data.name &&
        typeof data.name === "string" &&
        data.name.trim() !== "" &&
        data.email &&
        typeof data.email === "string" &&
        data.email.trim() !== ""
      ) {
        validClients.push(clientInfo)
      } else {
        invalidClients.push(clientInfo)
      }
    })

    return NextResponse.json({
      success: true,
      userId,
      collectionPath: `users/${userId}/clients`,
      totalDocuments: snapshot.size,
      rawClients,
      validClients: validClients.length,
      invalidClients: invalidClients.length,
      validationIssues: invalidClients.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        issues: [
          !c.hasName && "Missing name",
          !c.hasEmail && "Missing email",
          c.nameType !== "string" && `Name is ${c.nameType}, not string`,
          c.emailType !== "string" && `Email is ${c.emailType}, not string`,
        ].filter(Boolean),
      })),
    })
  } catch (error: any) {
    console.error("💥 [DEBUG] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
