export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export async function GET() {
  try {
    console.log("🔍 [DEBUG] Starting debug clients request")

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    console.log("🆔 [DEBUG] User ID from cookie:", userId)

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Check if the user document exists
    const userDocRef = collection(db, "users")
    const userSnapshot = await getDocs(userDocRef)

    console.log("👥 [DEBUG] Total users in collection:", userSnapshot.size)

    let userExists = false
    userSnapshot.forEach((doc) => {
      if (doc.id === userId) {
        userExists = true
        console.log("✅ [DEBUG] Found user document:", doc.id, doc.data())
      }
    })

    if (!userExists) {
      console.log("❌ [DEBUG] User document not found")
      return NextResponse.json({
        error: "User document not found",
        userId,
        totalUsers: userSnapshot.size,
      })
    }

    // Check the clients subcollection
    const clientsCollectionRef = collection(db, "users", userId, "clients")
    const clientsSnapshot = await getDocs(clientsCollectionRef)

    console.log(`📊 [DEBUG] Clients collection size: ${clientsSnapshot.size}`)

    const rawClients: any[] = []
    clientsSnapshot.forEach((doc) => {
      const data = doc.data()
      rawClients.push({
        id: doc.id,
        data: data,
      })
      console.log(`📄 [DEBUG] Client document:`, doc.id, data)
    })

    return NextResponse.json({
      success: true,
      userId,
      userExists,
      clientsCollectionPath: `users/${userId}/clients`,
      clientsCount: clientsSnapshot.size,
      rawClients,
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
